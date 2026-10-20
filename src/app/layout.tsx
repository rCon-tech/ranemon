import type { Metadata, Viewport } from 'next';
import { GbPalette } from '@/components/GbPalette';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ranemon', template: '%s · Ranemon' },
  description: 'A battle game where your friends are the creatures.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f380f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Press Start 2P (SIL Open Font Licence), loaded at runtime so builds don't need Google. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        />
      </head>
      <body className="antialiased">
        <GbPalette />
        <main className="gb-screen mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
