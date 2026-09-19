import Link from 'next/link';
import { Key } from '@/components/clay/Key';
import { ThemeToggle } from '@/components/clay/ThemeToggle';

const LINKS = [
  { href: '/learn', label: 'Learn' },
  { href: '/practice', label: 'Practice' },
  { href: '/sandbox', label: 'Sandbox' },
  { href: '/cheatsheet', label: 'Cheatsheet' },
  { href: '/stats', label: 'Stats' },
  { href: '/about', label: 'About' },
];

export function SiteNav() {
  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8">
      <nav
        aria-label="Main"
        className="clay clay-chip hue-violet flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3"
      >
        <Link href="/" className="clay-focusable flex items-center gap-3 rounded-[14px]">
          <Key label=":w" hue="mint" size="sm" live={false} />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-clay-ink">
            Vim Clay
          </span>
        </Link>
        <ul className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="clay-btn clay-btn-ghost px-3 py-2 text-[0.9375rem]">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
