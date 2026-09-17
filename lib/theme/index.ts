/** Not part of the progress schema: a theme belongs to the device, and progress travels by export (docs/CONTRACT.md §6). */

export const THEME_KEY = 'vimclay:v1:theme';

export type ThemePreference = 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['dark', 'light'];
export const DEFAULT_THEME: ThemePreference = 'dark';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

export function loadTheme(): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === 'system') return DEFAULT_THEME;
    return isPreference(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_KEY, preference);
  } catch {}
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  const OVERRIDE_ID = 'vc-theme-color';
  const existing = document.getElementById(OVERRIDE_ID);
  const ground = getComputedStyle(root).getPropertyValue('--clay-bg').trim();
  if (ground === '') return;
  const meta = existing instanceof HTMLMetaElement ? existing : document.createElement('meta');
  meta.id = OVERRIDE_ID;
  meta.name = 'theme-color';
  meta.content = ground;
  if (existing === null) document.head.appendChild(meta);
}
