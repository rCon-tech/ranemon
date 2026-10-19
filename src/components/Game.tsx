'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import { STARTERS } from '@/lib/battle/roster';
import { addResult, getRecord, getServerRecord, subscribeRecord } from '@/lib/record';
import { BattleScreen } from './BattleScreen';
import { TeamPreview } from './TeamPreview';
import { TitleScreen } from './TitleScreen';

type Screen =
  | { kind: 'title' }
  | { kind: 'preview'; mine: Creature[]; theirs: Creature[] }
  | { kind: 'battle'; teams: [Creature[], Creature[]]; difficulty: Difficulty; key: number };

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

/** The CPU picks 3 of its 6 at random for now. */
function cpuPicks(theirs: Creature[]): Creature[] {
  return shuffle(theirs).slice(0, 3);
}

export function Game() {
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const record = useSyncExternalStore(subscribeRecord, getRecord, getServerRecord);

  function start() {
    const pool = shuffle(STARTERS);
    setScreen({ kind: 'preview', mine: pool.slice(0, 6), theirs: pool.slice(6, 12) });
  }

  if (screen.kind === 'title') return <TitleScreen record={record} onStart={start} />;

  if (screen.kind === 'preview') {
    return (
      <TeamPreview
        mine={screen.mine}
        theirs={screen.theirs}
        onReady={(picks, difficulty) =>
          setScreen({
            kind: 'battle',
            teams: [picks, cpuPicks(screen.theirs)],
            difficulty,
            key: Date.now(),
          })
        }
      />
    );
  }

  return (
    <BattleScreen
      key={screen.key}
      teams={screen.teams}
      difficulty={screen.difficulty}
      onFinish={(result) => {
        if (result !== 'draw') addResult(result === 'win');
        setScreen({ kind: 'title' });
      }}
    />
  );
}
