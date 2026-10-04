import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vim Clay',
    short_name: 'Vim Clay',
    description:
      'Learn vim motions in a real vim editor, in your browser: modes, the operator ' +
      'grammar, text objects, registers and macros.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#e9e7fb',
    theme_color: '#e9e7fb',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
