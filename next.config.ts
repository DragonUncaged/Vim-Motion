import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Vercel's per-deployment id ends up in inline scripts and would break the committed CSP hashes.
delete process.env.NEXT_DEPLOYMENT_ID;

// No `preload` on HSTS (a one-way door for the deployer), and no Cache-Control: Next ignores it here.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

// style-src keeps 'unsafe-inline' for prerendered style= attributes and CodeMirror's <style> fallback.
function contentSecurityPolicy(scriptHashes: string[]): { key: string; value: string } {
  return {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' ${scriptHashes.join(' ')}`.trimEnd(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  };
}

const CATCH_ALL = '/(.*)';

function loadScriptHashes(): Record<string, string[]> {
  const file = join(__dirname, 'csp-hashes.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  console.warn(
    'csp-hashes.json is missing: building with no inline-script hashes. ' +
      'Run `npm run csp:hashes`, then `npm run build` again.',
  );
  return {};
}

interface LockedPackage {
  version?: string;
  integrity?: string;
}

// npm 11's `npm install` rewrites lockfile flags such as `dev`, so hash only what each entry pins.
function lockfileBuildId(): string {
  const { packages }: { packages: Record<string, LockedPackage> } = JSON.parse(
    readFileSync(join(__dirname, 'package-lock.json'), 'utf8'),
  );
  const pinned = Object.entries(packages)
    .map(([path, { version = '', integrity = '' }]) => `${path} ${version} ${integrity}`)
    .sort();
  return createHash('sha256').update(pinned.join('\n')).digest('hex').slice(0, 20);
}

// Next's loaders embed the checkout path URL-encoded in module identifiers, so fold it out.
const PROJECT_ROOT = '<project>';

interface WebpackModule {
  identifier(): string;
}

interface WebpackCompilation {
  chunkGraph: { setModuleId(module: WebpackModule, id: number): void };
  hooks: {
    afterOptimizeModuleIds: {
      tap(name: string, fn: (modules: Iterable<WebpackModule>) => void): void;
    };
  };
}

interface WebpackCompiler {
  hooks: { compilation: { tap(name: string, fn: (c: WebpackCompilation) => void): void } };
}

class PathIndependentModuleIds {
  constructor(private readonly dir: string) {}

  private fold(identifier: string): string {
    return identifier
      .split(this.dir)
      .join(PROJECT_ROOT)
      .split(encodeURIComponent(this.dir))
      .join(PROJECT_ROOT);
  }

  apply(compiler: WebpackCompiler): void {
    const name = 'PathIndependentModuleIds';
    compiler.hooks.compilation.tap(name, (compilation) => {
      compilation.hooks.afterOptimizeModuleIds.tap(name, (modules) => {
        const named = [...modules]
          .map((module) => [this.fold(module.identifier()), module] as const)
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        // Id width is client bytes on every page: a whole 40-bit hash cost 2 kB, so size the space as webpack does.
        let range = 1000;
        while (range < named.length * 10) range *= 10;
        const taken = new Set<number>();
        for (const [identifier, module] of named) {
          const digest = createHash('sha256').update(identifier).digest('hex').slice(0, 10);
          let id = parseInt(digest, 16) % range;
          while (taken.has(id)) id = (id + 1) % range;
          taken.add(id);
          compilation.chunkGraph.setModuleId(module, id);
        }
      });
    });
  }
}

const nextConfig = (phase: string): NextConfig => ({
  poweredByHeader: false,

  // The build id is in every page's flight payload, so a random one would change every CSP hash.
  generateBuildId: lockfileBuildId,

  webpack: (config: { plugins: unknown[] }) => {
    config.plugins.push(new PathIndependentModuleIds(__dirname));
    return config;
  },

  async headers() {
    // next dev's own inline scripts cannot be hashed, so it gets no CSP.
    if (phase === PHASE_DEVELOPMENT_SERVER) {
      return [{ source: CATCH_ALL, headers: securityHeaders }];
    }
    const { [CATCH_ALL]: notFound = [], ...perRoute } = loadScriptHashes();
    return [
      // Catch-all first: a later matching rule overwrites the same key, so anywhere else it erases per-route policies.
      { source: CATCH_ALL, headers: [...securityHeaders, contentSecurityPolicy(notFound)] },
      ...Object.entries(perRoute).map(([source, hashes]) => ({
        source,
        headers: [contentSecurityPolicy(hashes)],
      })),
    ];
  },
});

export default nextConfig;
