import Link from 'next/link';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { levelStats, STAT_KEYS } from '@/lib/battle/creature';
import { moveById } from '@/lib/battle/moves';
import { ROSTER } from '@/lib/battle/roster';

export const metadata = { title: 'Ranedex' };

const STAT_LABEL = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  spirit: 'SPI',
  speed: 'SPD',
} as const;

export default function Ranedex() {
  return (
    <div className="flex flex-1 flex-col gap-3 bg-dex p-3">
      <div className="flex items-center justify-between text-[10px] text-paper">
        <h1>RANEDEX</h1>
        <Link href="/" className="text-[8px] underline underline-offset-4">
          BACK
        </Link>
      </div>
      <ol className="flex flex-col gap-3">
        {ROSTER.map((c, i) => {
          const stats = levelStats(c.base);
          return (
            <li key={c.id} className="dialog flex flex-col gap-3 p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 rounded border-2 border-ink bg-[#d8f4ff] p-1">
                  <Sprite creature={c} />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[8px] opacity-60">No.{String(i + 1).padStart(3, '0')}</span>
                  <h2 className="text-[11px]">{c.name}</h2>
                  <span className="flex gap-1">
                    {c.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </span>
                </div>
              </div>
              <p className="text-[8px] leading-relaxed">{c.entry}</p>
              <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-[7px]">
                {STAT_KEYS.map((k) => (
                  <div key={k} className="contents">
                    <dt>{STAT_LABEL[k]}</dt>
                    <dd className="h-1.5 rounded bg-[#d0d4dc]">
                      <div
                        className="h-full rounded bg-ink"
                        style={{ width: `${(c.base[k] / 130) * 100}%` }}
                      />
                    </dd>
                    <dd className="text-right">{stats[k]}</dd>
                  </div>
                ))}
              </dl>
              <ul className="grid grid-cols-2 gap-1 text-[7px]">
                {c.moves.map((id) => (
                  <li key={id} className="truncate">
                    {moveById(id).signature ? '★' : '·'} {moveById(id).name}
                  </li>
                ))}
              </ul>
              {c.moves
                .map(moveById)
                .filter((m) => m.signature)
                .map((m) => (
                  <p key={m.id} className="text-[7px] leading-relaxed">
                    ★ {m.name}: {m.flavour}
                  </p>
                ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
