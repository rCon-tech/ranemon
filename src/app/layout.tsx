import type { Metadata, Viewport } from 'next';
import { Gate } from '@/components/Gate';
import { OfflineHooks } from '@/components/Offline';
import { SoundHooks } from '@/components/Sound';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ranemon', template: '%s · Ranemon' },
  description: 'A battle game where your friends are the creatures.',
  // Added to an iPhone's home screen, it opens full screen like an app.
  appleWebApp: { capable: true, title: 'Ranemon', statusBarStyle: 'black' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1c2026' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SoundHooks />
        <OfflineHooks />
        <main className="screen mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          <Gate>{children}</Gate>
        </main>
      </body>
    </html>
  );
}
