import { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import Ranedex from '@/app/ranedex/page';
import Guide from '@/app/guide/page';
import { Game } from '@/components/Game';
import { Gate } from '@/components/Gate';
import { SoundHooks } from '@/components/Sound';
import { SoundTest } from '@/components/SoundTest';
import { Story } from '@/components/story/Story';
import { setCloudSaves } from '@/lib/story/cloud';

/**
 * The claude.ai play link: the whole game as one page. Pages are picked by the URL's hash, and
 * story saves also go to the page's own database, so a name carries on from any device.
 */

interface Db {
  doc(path: string): {
    get(): Promise<{ exists: boolean; data(): { raw?: unknown } | undefined }>;
    set(data: object): Promise<void>;
  };
}
const host = (window as unknown as { claude?: { use(c: 'db'): Promise<Db | null> } }).claude;
setCloudSaves(
  host
    ? host.use('db').then((db) =>
        db
          ? {
              load: async (id: string) => {
                const doc = await db.doc(`saves/${id}`).get();
                const raw = doc.exists ? doc.data()?.raw : null;
                return typeof raw === 'string' ? raw : null;
              },
              save: (id: string, raw: string) =>
                db.doc(`saves/${id}`).set({ raw, savedAt: Date.now() }),
            }
          : null,
      )
    : null,
);

const onHash = (f: () => void) => {
  window.addEventListener('hashchange', f);
  return () => window.removeEventListener('hashchange', f);
};

function App() {
  const hash = useSyncExternalStore(onHash, () => location.hash);
  return (
    <main className="screen mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <SoundHooks />
      <Gate>
        {hash === '#story' ? (
          <Story key="story" />
        ) : hash === '#ranedex' ? (
          <Ranedex />
        ) : hash === '#guide' ? (
          <Guide />
        ) : hash === '#sound' ? (
          <SoundTest />
        ) : (
          <Game />
        )}
      </Gate>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
