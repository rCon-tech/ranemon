'use client';

import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { useView } from '@/components/ViewButton';
import { STAT_KEYS, type Creature } from '@/lib/battle/creature';
import { moveById } from '@/lib/battle/moves';
import { TYPE_LABEL, type RaneType } from '@/lib/battle/types';
import {
  dexMoves,
  evolutionLine,
  habitats,
  looksOf,
  matchups,
  strongAgainst,
  type DexKnowledge,
  type DexMove,
} from '@/lib/story/dex';
import { STAT_HELP } from '@/lib/ui/stats';

const STAT_LABEL = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  spirit: 'SPI',
  speed: 'SPD',
} as const;

const CATEGORY = { physical: 'PHYS', spirit: 'SPIR', status: 'STAT' } as const;

const names = (types: RaneType[]) => types.map((t) => TYPE_LABEL[t]).join(', ');

/**
 * A Ranedex page for one Ranemon: a big picture you can flip through its looks on, its types,
 * entry, stats, evolution line, moves and where it's found. `know` decides how much of that is
 * filled in, so story mode only shows what you've come across. `look` is the picture showing,
 * an index into its looks; `onOpen` goes to another Ranemon of its line.
 */
export function DexEntry({
  creature: c,
  number,
  know,
  look,
  onLook,
  onOpen,
  onStep,
  battleMoves = false,
}: {
  creature: Creature;
  number: number;
  know: DexKnowledge;
  look: number;
  onLook: (look: number) => void;
  onOpen?: (id: string) => void;
  /** ◀ and ▶ either side of the picture, to the Ranemon before or after it. */
  onStep?: (step: 1 | -1) => void;
  /** Also list battle mode's four moves, above the story learnset. */
  battleMoves?: boolean;
}) {
  const view = useView();
  const caught = know.caught(c.id);
  const looks = looksOf(c, know.shiny(c.id), !!know.form);
  const shown = looks[look % looks.length];
  const total = STAT_KEYS.reduce((sum, k) => sum + c.base[k], 0);
  const { weak, resists } = matchups(c.types);
  const evolution = evolutionLine(c.id);
  const as = know.form ?? ((f: Creature) => f);
  const line = {
    first: as(evolution.first),
    branches: evolution.branches.map((b) => ({ ...b, creature: as(b.creature) })),
  };
  const places = know.visited && habitats(c.id).filter((p) => know.where?.(p.map) ?? true);
  return (
    <article className="flex flex-col gap-3" data-testid="dex-entry" data-id={c.id}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] opacity-60">No.{String(number).padStart(3, '0')}</span>
          <h3 className="text-[17px]">
            {shown.creature.shiny && <span className="shiny-name">★</span>}
            {c.name}
          </h3>
        </div>
        <span className="flex gap-1">
          {c.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {onStep && <Step label="Previous" arrow="◀" onClick={() => onStep(-1)} />}
        <div
          className={`mx-auto h-40 w-40 rounded-lg border-2 bg-mist p-2 ${shown.creature.shiny ? 'border-gold' : 'border-frame'}`}
        >
          <Sprite key={shown.label} creature={shown.creature} solid={view === '3d'} />
        </div>
        {onStep && <Step label="Next" arrow="▶" onClick={() => onStep(1)} />}
      </div>
      {looks.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1" aria-label="Looks">
          {looks.map((l, i) => (
            <button
              key={l.label}
              type="button"
              className="pixel-btn px-2 py-0.5 text-[10px]"
              aria-pressed={i === look % looks.length}
              onClick={() => onLook(i)}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed">
        {caught ? c.entry : 'Befriend one to fill in the rest of its page.'}
      </p>

      <Section title="TYPE MATCHUPS">
        <p className="text-[10px] leading-relaxed">
          Weak to {weak.length ? names(weak) : 'nothing'}.
          <br />
          Shrugs off {resists.length ? names(resists) : 'nothing'}.
        </p>
      </Section>

      {caught && (
        <Section title={`BASE STATS · ${total}`}>
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
                <dd className="text-right">{c.base[k]}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[9px] leading-relaxed opacity-70" data-testid="spirit-help">
            SPI is Spirit. {STAT_HELP.spirit}
          </p>
        </Section>
      )}

      {line.branches.length > 0 && (
        <Section title="EVOLUTION">
          <div className="flex flex-wrap items-center gap-2 text-[9px]">
            <Form creature={line.first} current={c.id} know={know} onOpen={onOpen} />
            <div className="flex flex-col gap-2">
              {line.branches.map((b) => (
                <div key={b.creature.id} className="flex items-center gap-2">
                  <span className="flex w-20 flex-col items-center text-center leading-snug">
                    <span aria-hidden="true">▶</span>
                    {know.seen(b.creature.id) ? b.how : '?????'}
                  </span>
                  <Form creature={b.creature} current={c.id} know={know} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {caught && battleMoves && (
        <Section title="BATTLE MODE MOVES">
          <MoveList moves={c.moves.map((id) => ({ move: moveById(id), hidden: false }))} />
        </Section>
      )}
      {caught && (
        <Section title={battleMoves ? 'STORY MODE MOVES' : 'MOVES'}>
          <MoveList moves={dexMoves(c, know)} levels />
        </Section>
      )}

      {places && (
        <Section title="WHERE IT'S FOUND">
          {places.length === 0 ? (
            <p className="text-[10px]">Not in the long grass.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-[10px]">
              {places.map((p) => (
                <li key={p.map} className="flex justify-between gap-2">
                  <span>{know.visited!(p.map) ? p.name : '?????'}</span>
                  <span>
                    Lv{p.min}
                    {p.max > p.min && `–${p.max}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </article>
  );
}

function Step({ label, arrow, onClick }: { label: string; arrow: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="pixel-btn shrink-0 px-2 py-1 text-[11px]"
      onClick={onClick}
      aria-label={label}
    >
      {arrow}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 border-t-2 border-shell pt-2">
      <h4 className="text-[11px] font-bold">{title}</h4>
      {children}
    </section>
  );
}

/** One form in the evolution line: tap it to open its page, once it's been seen. */
function Form({
  creature,
  current,
  know,
  onOpen,
}: {
  creature: Creature;
  current: string;
  know: DexKnowledge;
  onOpen?: (id: string) => void;
}) {
  const seen = know.seen(creature.id);
  const here = creature.id === current;
  const body = (
    <>
      <span className="h-12 w-12">
        {seen ? <Sprite creature={creature} /> : <span className="block h-full w-full" />}
      </span>
      {seen ? creature.name : '?????'}
    </>
  );
  const box = `flex w-20 flex-col items-center gap-1 rounded-lg border-2 bg-mist p-1 text-center ${here ? 'border-accent2' : 'border-frame'}`;
  if (!seen || here || !onOpen) return <span className={box}>{body}</span>;
  return (
    <button type="button" className={`pixel-btn ${box}`} onClick={() => onOpen(creature.id)}>
      {body}
    </button>
  );
}

function MoveList({ moves, levels = false }: { moves: DexMove[]; levels?: boolean }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {moves.map(({ move: m, level, hidden }) =>
        hidden ? (
          <li key={m.id} className="flex gap-2 text-[10px]">
            {levels && <span className="w-8 shrink-0">Lv{level}</span>}
            <span>??? · learnt later on</span>
          </li>
        ) : (
          <li key={m.id} className="flex gap-2 text-[10px]">
            {levels && <span className="w-8 shrink-0">Lv{level}</span>}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center justify-between gap-1">
                <span className={m.signature ? 'text-accent' : ''}>
                  {m.signature ? '★ ' : ''}
                  {m.name}
                </span>
                {m.type && <TypeBadge type={m.type} />}
              </span>
              <span className="opacity-70">
                {CATEGORY[m.category]} · POW {m.power || '—'} · ACC {m.accuracy ?? '—'} · PP {m.pp}
              </span>
              {strongAgainst(m).length > 0 && (
                <span>Super effective on {names(strongAgainst(m))}</span>
              )}
              {m.signature && <span className="leading-relaxed">{m.flavour}</span>}
            </span>
          </li>
        ),
      )}
    </ul>
  );
}
