'use client';

import { useEffect, useState } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import { TEAM_SIZE } from '@/lib/battle/engine';
import { Sprite } from './Sprite';
import { TypeBadge } from './TypeBadge';

const PICK_SECONDS = 60;
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

interface Props {
  mine: Creature[];
  theirs: Creature[];
  onReady: (picks: Creature[], difficulty: Difficulty) => void;
}

function Card({ creature, children }: { creature: Creature; children?: React.ReactNode }) {
  return (
    <>
      <span className="h-12 w-12">
        <Sprite creature={creature} />
      </span>
      <span className="text-[8px] leading-tight">{creature.name}</span>
      <span className="flex flex-wrap justify-center gap-0.5">
        {creature.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </span>
      {children}
    </>
  );
}

/** Both rosters of 6 side by side, then pick 3. The first pick leads. */
export function TeamPreview({ mine, theirs, onReady }: Props) {
  const [picks, setPicks] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [timeLeft, setTimeLeft] = useState(PICK_SECONDS);

  const chosen = () => picks.map((id) => mine.find((c) => c.id === id)!);

  // As in Stadium, the clock fills any empty slots at random when it runs out.
  useEffect(() => {
    if (timeLeft <= 0) {
      const rest = mine.filter((c) => !picks.includes(c.id)).sort(() => Math.random() - 0.5);
      onReady([...chosen(), ...rest].slice(0, TEAM_SIZE), difficulty);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function toggle(id: string) {
    setPicks((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < TEAM_SIZE ? [...p, id] : p,
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 text-paper">
      <div className="flex items-center justify-between text-[10px]">
        <h1>TEAM PREVIEW</h1>
        <span aria-label="Time left to pick">⏱ {timeLeft}s</span>
      </div>

      <section className="dialog p-3 text-ink" aria-label="Rival’s roster">
        <h2 className="mb-2 text-[9px]">RIVAL</h2>
        <ul className="grid grid-cols-3 gap-2">
          {theirs.map((c) => (
            <li key={c.id} className="flex flex-col items-center gap-1 text-center">
              <Card creature={c} />
            </li>
          ))}
        </ul>
      </section>

      <section className="dialog p-3 text-ink" aria-label="Your roster">
        <h2 className="mb-1 text-[9px]">YOU · PICK 3</h2>
        <p className="mb-2 text-[7px] leading-relaxed opacity-70">Your first pick leads.</p>
        <div className="grid grid-cols-3 gap-2">
          {mine.map((c) => {
            const order = picks.indexOf(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className="pixel-btn flex flex-col items-center gap-1 px-1 py-2 text-center"
                aria-pressed={order >= 0}
                onClick={() => toggle(c.id)}
              >
                <Card creature={c}>
                  <span className="h-2.5 text-[7px]">
                    {order === 0 ? 'LEAD' : order > 0 ? `#${order + 1}` : ''}
                  </span>
                </Card>
              </button>
            );
          })}
        </div>
      </section>

      <div role="group" aria-label="Difficulty" className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className="pixel-btn text-center text-[9px]"
            aria-pressed={difficulty === level}
            onClick={() => setDifficulty(level)}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pixel-btn menu-item"
        disabled={picks.length !== TEAM_SIZE}
        onClick={() => onReady(chosen(), difficulty)}
      >
        BATTLE! ({picks.length}/{TEAM_SIZE})
      </button>
    </div>
  );
}
