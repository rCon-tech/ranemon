import Link from 'next/link';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { levelStats, STAT_KEYS } from '@/lib/battle/creature';
import { evolutionOf } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { ROSTER } from '@/lib/battle/roster';
import { variantForm, variantsOf } from '@/lib/battle/variants';

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
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-dex px-3 py-2 text-[18px] font-bold text-paper [text-shadow:1px_1px_0_rgb(0_0_0/0.4)]">
        <h1>RANEDEX</h1>
        <Link href="/" className="text-[11px] underline underline-offset-4">
          BACK
        </Link>
      </div>
      <ol className="flex flex-col gap-3">
        {ROSTER.map((c, i) => {
          const stats = levelStats(c.base);
          return (
            <li key={c.id} className="dialog flex flex-col gap-3 p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-frame bg-mist p-1">
                  <Sprite creature={c} />
                </div>
                {/* Its other looks: the same Ranemon in another photo. */}
                {variantsOf(c.id).map((v) => (
                  <div
                    key={v.id}
                    className="h-16 w-16 shrink-0 rounded-lg border-2 border-frame bg-mist p-1"
                    title={`${c.name} (${v.label})`}
                  >
                    <Sprite creature={variantForm(c, v.id)} />
                  </div>
                ))}
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[11px] opacity-60">
                    No.{String(i + 1).padStart(3, '0')}
                  </span>
                  <h2 className="text-[15px]">{c.name}</h2>
                  <span className="flex gap-1">
                    {c.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed">{c.entry}</p>
              <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-[10px]">
                {STAT_KEYS.map((k) => (
                  <div key={k} className="contents">
                    <dt>{STAT_LABEL[k]}</dt>
                    <dd className="h-1.5 overflow-hidden rounded-full bg-shell">
                      <div
                        className="h-full rounded-full bg-accent2"
                        style={{ width: `${(c.base[k] / 130) * 100}%` }}
                      />
                    </dd>
                    <dd className="text-right">{stats[k]}</dd>
                  </div>
                ))}
              </dl>
              <ul className="grid grid-cols-2 gap-1 text-[10px]">
                {c.moves.map((id) => (
                  <li
                    key={id}
                    className={`truncate ${moveById(id).signature ? 'text-accent' : ''}`}
                  >
                    {moveById(id).signature ? '★' : '·'} {moveById(id).name}
                  </li>
                ))}
              </ul>
              {c.moves
                .map(moveById)
                .filter((m) => m.signature)
                .map((m) => (
                  <p key={m.id} className="text-[10px] leading-relaxed">
                    ★ {m.name}: {m.flavour}
                  </p>
                ))}
              {evolutionOf(c.id) && (
                <p className="text-[10px] text-frame">
                  In story mode, evolves into {evolutionOf(c.id)!.name} at Lv
                  {evolutionOf(c.id)!.level}.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
