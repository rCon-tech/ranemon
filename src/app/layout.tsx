import type { Metadata, Viewport } from 'next';
import { Gate } from '@/components/Gate';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ranemon', template: '%s · Ranemon' },
  description: 'A battle game where your friends are the creatures.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1c2026' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Pixelify Sans (SIL Open Font Licence), loaded at runtime so builds don't need Google. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <main className="screen mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          <Gate>{children}</Gate>
        </main>
      </body>
    </html>
  );
}
