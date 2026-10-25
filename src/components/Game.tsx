'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import { TEAM_SIZE, type Entrant } from '@/lib/battle/engine';
import { entrantOfPick, rivalTeam } from '@/lib/ui/battle-mode';
import { addResult, getRecord, getServerRecord, subscribeRecord } from '@/lib/record';
import { BattleScreen } from './BattleScreen';
import { useMusic } from './Sound';
import { TeamSelect } from './TeamSelect';
import { TitleScreen } from './TitleScreen';

type Screen =
  | { kind: 'title' }
  | { kind: 'select' }
  | { kind: 'battle'; teams: [Entrant[], Creature[]]; difficulty: Difficulty; key: number };

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
        onReady={(picks, slots, difficulty) =>
          setScreen({
            kind: 'battle',
            // The rival is drawn from the rest of the same roster, each in a random look.
            teams: [
              picks.map(entrantOfPick),
              rivalTeam(
                slots,
                picks.map((p) => p.line),
                TEAM_SIZE,
                Math.random,
              ),
            ],
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
