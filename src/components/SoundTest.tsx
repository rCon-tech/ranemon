'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROSTER } from '@/lib/battle/roster';
import { playCryOf, playJingle, playSfx, unlock } from '@/lib/sound/engine';
import { SFX, type SfxId } from '@/lib/sound/sfx';
import { JINGLES, SONGS, type JingleId, type SongId } from '@/lib/sound/songs';
import { SoundButton, useMusic } from './Sound';

const SONG_NAME: Record<SongId, string> = {
  title: 'Title',
  route: 'On the road',
  city: 'Dublin',
  pub: 'McGrattans',
  home: 'Home and the shop',
  gym: 'In the gym',
  bike: 'On the bike',
  wild: 'Wild Ranemon',
  trainer: 'Trainer battle',
  leader: 'Gym leader',
  boss: 'Final battles',
  techno: 'I Love Techno',
  victory: 'Victory',
};

const JINGLE_NAME: Record<JingleId, string> = {
  level: 'Level up',
  item: 'Got an item',
  heal: 'Pub heal',
  caught: 'Befriended',
  evolved: 'Evolved',
  lose: 'Lost',
};

/** SOUND TEST: every tune, jingle, effect and cry, as on the old handhelds' sound test. */
export function SoundTest() {
  const [song, setSong] = useState<SongId | null>(null);
  // Leaving the page stops the music.
  useMusic(song);
  const pick = (id: SongId | null) => {
    unlock();
    setSong(id);
  };
  const button = 'pixel-btn px-2 py-1.5 text-left text-[12px]';
  return (
    <div className="flex flex-1 flex-col gap-3 p-3 text-ink">
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-panel px-3 py-2 text-[18px] font-bold text-paper">
        <h1>SOUND TEST</h1>
        <div className="flex items-center gap-3">
          <SoundButton />
          <Link href="/" className="text-[11px] underline underline-offset-4">
            BACK
          </Link>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed">
        Every sound is made by the game as it plays, chip style, like the old handhelds. ♪ at the
        top of the screen switches between music and effects, effects only, and off.
      </p>

      <h2 className="text-[14px] font-bold">MUSIC</h2>
      <div className="grid grid-cols-2 gap-2" data-sound="none">
        {(Object.keys(SONGS) as SongId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={button}
            aria-pressed={song === id}
            onClick={() => pick(song === id ? null : id)}
          >
            {song === id ? '■ ' : '▶ '}
            {SONG_NAME[id]}
          </button>
        ))}
      </div>

      <h2 className="text-[14px] font-bold">JINGLES</h2>
      <div className="grid grid-cols-2 gap-2" data-sound="none">
        {(Object.keys(JINGLES) as JingleId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={button}
            onClick={() => {
              unlock();
              playJingle(id);
            }}
          >
            ▶ {JINGLE_NAME[id]}
          </button>
        ))}
      </div>

      <h2 className="text-[14px] font-bold">EFFECTS</h2>
      <div className="grid grid-cols-3 gap-2" data-sound="none">
        {(Object.keys(SFX) as SfxId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`${button} text-[10px]`}
            onClick={() => {
              unlock();
              playSfx(id);
            }}
          >
            {id.toUpperCase()}
          </button>
        ))}
      </div>

      <h2 className="text-[14px] font-bold">CRIES</h2>
      <div className="grid grid-cols-3 gap-2" data-sound="none">
        {ROSTER.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${button} text-[10px]`}
            onClick={() => {
              unlock();
              playCryOf(c.id);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
