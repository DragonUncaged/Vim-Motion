import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const exists = (url) => {
  try {
    return existsSync(fileURLToPath(url));
  } catch {
    return false;
  }
};

const ROOT = new URL('../', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      specifier = new URL(specifier.slice(2), ROOT).href;
    }

    const relative = specifier.startsWith('.') || specifier.startsWith('file:');
    if (relative && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const asFile = new URL(`${specifier}.ts`, context.parentURL);
      if (exists(asFile)) return nextResolve(asFile.href, context);

      const asDir = new URL(specifier, context.parentURL);
      if (exists(asDir) && statSync(fileURLToPath(asDir)).isDirectory()) {
        const barrel = new URL(`${specifier}/index.ts`, context.parentURL);
        if (exists(barrel)) return nextResolve(barrel.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
