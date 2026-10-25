'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchChampion } from '@/lib/online/link';
import { CHAMPION_SKIN, type ChampionView } from '@/lib/online/rules';
import { Portrait } from './story/Portrait';

/** How often to ask the save server who holds the crown, while a page is open. */
const CHECK_MS = 60_000;

/**
 * The Online Champion, as the save server at `base` last said: null if nobody holds the crown,
 * undefined until it answers (or if there's no server). `refresh` asks again now.
 */
export function useChampion(base: string | undefined) {
  const [champ, setChamp] = useState<ChampionView | null | undefined>(undefined);
  const refresh = useCallback(() => {
    if (!base) return;
    fetchChampion(base).then((c) => {
      if (c !== undefined) setChamp(c);
    });
  }, [base]);
  useEffect(() => {
    if (!base) return;
    refresh();
    const timer = setInterval(refresh, CHECK_MS);
    return () => clearInterval(timer);
  }, [base, refresh]);
  return { champ, refresh };
}

/** Who holds the crown, in gold, with the Champion's skin. */
export function ChampionBanner({ champ }: { champ: ChampionView | null | undefined }) {
  if (champ === undefined) return null;
  return (
    <div
      className="flex w-full max-w-[300px] items-center gap-3 rounded-lg border-4 border-gold bg-[#2a1450] px-3 py-2 text-left text-[#ffe9a0] shadow-[0_0_14px_rgba(255,210,58,0.55)]"
      data-testid="champion-banner"
    >
      <Portrait
        look={champ ? CHAMPION_SKIN : 'player'}
        locked={!champ}
        className="h-12 w-8 shrink-0"
      />
      <p className="text-[10px] leading-relaxed">
        <span className="text-[11px] font-bold text-gold">ONLINE CHAMPION</span>
        <br />
        {champ ? (
          <>
            <span className="text-[13px] font-bold" data-testid="champion-name">
              {champ.name}
            </span>
            <br />
            {champ.defences === 1 ? '1 defence' : `${champ.defences} defences`}
            {champ.from && ` · took the crown from ${champ.from}`}
          </>
        ) : (
          'Nobody holds the crown yet. Win a friend battle to claim it.'
        )}
      </p>
    </div>
  );
}
