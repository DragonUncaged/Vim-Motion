import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KeyboardWatch } from '@/components/clay/KeyboardWatch';
import { SiteNav } from '@/components/SiteNav';
import { siteMetadata } from '@/lib/seo/copy';
import './globals.css';

const fredoka = localFont({
  src: './fonts/Fredoka-Latin-600.woff2',
  weight: '600',
  style: 'normal',
  variable: '--font-fredoka',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '100%' }],
});

const nunitoSans = localFont({
  src: './fonts/NunitoSans-Latin-Variable.woff2',
  weight: '200 1000',
  style: 'normal',
  variable: '--font-nunito-sans',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '100%' }],
});

const jetbrainsMono = localFont({
  src: './fonts/JetBrainsMono-Latin-Variable.woff2',
  weight: '100 800',
  style: 'normal',
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9e7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#221c39' },
  ],
};

const THEME_SCRIPT = `(function(){var d=true;try{
d=localStorage.getItem('vimclay:v1:theme')!=='light';
}catch(e){}
var r=document.documentElement;
r.classList.toggle('dark',d);
r.style.colorScheme=d?'dark':'light';})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunitoSans.variable} ${jetbrainsMono.variable}`}
      // The script in <head> stamps the class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* THEME_SCRIPT is a constant with no input, and must be inlined to beat the first paint. */}
        {/* eslint-disable-next-line no-restricted-syntax -- see above */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="clay-shell antialiased">
        <TooltipProvider delayDuration={200}>
          <a className="clay-skip clay-btn clay-btn-primary" href="#main">
            Skip to content
          </a>
          <SiteNav />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-8 sm:px-8">
            {children}
          </main>
          <KeyboardWatch />
        </TooltipProvider>
      </body>
    </html>
  );
}
