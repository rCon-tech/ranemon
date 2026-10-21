'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import { TEAM_SIZE } from '@/lib/battle/engine';
import { drawTeam, ROSTER } from '@/lib/battle/roster';
import { addResult, getRecord, getServerRecord, subscribeRecord } from '@/lib/record';
import { BattleScreen } from './BattleScreen';
import { useMusic } from './Sound';
import { TeamSelect } from './TeamSelect';
import { TitleScreen } from './TitleScreen';

type Screen =
  | { kind: 'title' }
  | { kind: 'select' }
  | { kind: 'battle'; teams: [Creature[], Creature[]]; difficulty: Difficulty; key: number };

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

/** The rival's team is drawn at random from the Ranemon you didn't pick. */
function rivalTeam(mine: Creature[]): Creature[] {
  const remaining = ROSTER.filter((c) => !mine.includes(c));
  return drawTeam(shuffle(remaining), TEAM_SIZE);
}

export function Game() {
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const record = useSyncExternalStore(subscribeRecord, getRecord, getServerRecord);
  // The battle screen plays its own music.
  useMusic(screen.kind === 'battle' ? undefined : 'title');

  function start() {
    setScreen({ kind: 'select' });
  }

  if (screen.kind === 'title') return <TitleScreen record={record} onStart={start} />;

  if (screen.kind === 'select') {
    return (
      <TeamSelect
        roster={ROSTER}
        onReady={(picks, difficulty) =>
          setScreen({
            kind: 'battle',
            teams: [picks, rivalTeam(picks)],
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
