'use client';

import { useEffect, useState } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import { TEAM_SIZE } from '@/lib/battle/engine';
import { formById } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { CLASSIC } from '@/lib/battle/variants';
import { itemById } from '@/lib/story/items';
import {
  britainUnlocked,
  creatureOfPick,
  FORMS,
  holdItemsFor,
  looksOf,
  newPick,
  rosterOf,
  ROSTERS,
  spareMoves,
  withForm,
  type Forms,
  type RosterId,
  type Slot,
  type TeamPick,
} from '@/lib/ui/battle-mode';
import { MoveCard } from './MoveCard';
import { Sprite } from './Sprite';
import { TypeBadge } from './TypeBadge';

const PICK_SECONDS = 120;
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

interface Props {
  onReady: (picks: TeamPick[], slots: Slot[], difficulty: Difficulty) => void;
}

/** A row of buttons where one is picked, like the difficulty. */
function Choice<T extends string>({
  label,
  options,
  value,
  locked = [],
  onPick,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  /** Options that can't be picked yet. */
  locked?: T[];
  onPick: (id: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="pixel-btn text-center text-[11px]"
          aria-pressed={value === o.id}
          disabled={locked.includes(o.id)}
          onClick={() => onPick(o.id)}
        >
          {locked.includes(o.id) ? '🔒 ???' : o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * One of your picks, opened: its form when the rule gives it a choice, its look, what it holds,
 * and its moves, swapped as on story mode's MOVES screen.
 */
function PickEditor({
  pick,
  slot,
  britain,
  onChange,
}: {
  pick: TeamPick;
  slot: Slot;
  /** Whether the drawn UK look is unlocked. */
  britain: boolean;
  onChange: (pick: TeamPick) => void;
}) {
  const [moveFrom, setMoveFrom] = useState<{ slot: number } | { spare: string } | null>(null);
  const c = creatureOfPick(pick);
  const looks = looksOf(pick.form, britain);
  const items = holdItemsFor(pick.form);
  const spares = spareMoves(formById(pick.form), pick.moves);
  const stab = (id: string) => {
    const t = moveById(id).type;
    return t !== null && c.types.includes(t);
  };
  const swap = (at: number, spare: string) => {
    const moves = [...pick.moves];
    moves[at] = spare;
    onChange({ ...pick, moves });
    setMoveFrom(null);
  };
  const prompt =
    moveFrom === null
      ? 'Tap a move, then a spare move to swap them.'
      : 'slot' in moveFrom
        ? `Swap out ${moveById(pick.moves[moveFrom.slot]).name} for which spare move?`
        : `Swap in ${moveById(moveFrom.spare).name} for which move?`;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border-2 border-frame bg-mist p-2 text-[10px]"
      data-testid="pick-editor"
    >
      <div className="flex items-center gap-2">
        <span className="h-12 w-12 shrink-0">
          <Sprite creature={c} />
        </span>
        <span className="flex flex-col gap-1 text-[12px]">
          {c.name}
          <span className="flex gap-1">
            {c.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </span>
        </span>
      </div>

      {slot.forms.length > 1 && (
        <>
          <h3 className="text-[11px] font-bold">FORM</h3>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Form">
            {slot.forms.map((f) => (
              <button
                key={f.id}
                type="button"
                className="pixel-btn flex flex-col items-center gap-1 px-1 py-1.5"
                aria-pressed={pick.form === f.id}
                onClick={() => onChange(withForm(pick, f.id))}
              >
                <span className="h-10 w-10">
                  <Sprite creature={f} />
                </span>
                <span className="text-[9px] leading-tight">{f.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {looks.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold">LOOK</h3>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Look">
            {[undefined, ...looks].map((v) => (
              <button
                key={v?.id ?? ''}
                type="button"
                className="pixel-btn flex flex-col items-center gap-1 px-1 py-1.5"
                aria-pressed={pick.variant === v?.id}
                onClick={() => {
                  const next = { ...pick };
                  if (v) next.variant = v.id;
                  else delete next.variant;
                  onChange(next);
                }}
              >
                <span className="h-10 w-10">
                  <Sprite creature={creatureOfPick({ ...pick, variant: v?.id })} />
                </span>
                <span className="text-[9px] leading-tight">{v?.label ?? CLASSIC}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="text-[11px] font-bold">HOLDS</h3>
      <div className="flex flex-col gap-1" role="group" aria-label="Held item">
        {[undefined, ...items].map((item) => (
          <button
            key={item?.id ?? ''}
            type="button"
            className="pixel-btn flex flex-col gap-0.5 px-2 py-1 text-[10px]"
            aria-pressed={pick.held === item?.id}
            onClick={() => {
              const next = { ...pick };
              if (item) next.held = item.id;
              else delete next.held;
              onChange(next);
            }}
          >
            <span className="text-[11px]">{item?.name ?? 'Nothing'}</span>
            {item && <span className="text-[9px] leading-relaxed opacity-80">{item.about}</span>}
          </button>
        ))}
      </div>

      <h3 className="text-[11px] font-bold">MOVES</h3>
      <p className="leading-relaxed" data-testid="moves-prompt">
        {spares.length === 0 ? 'No spare moves to swap in.' : prompt}
      </p>
      {pick.moves.map((id, j) => (
        <MoveCard
          key={id}
          id={id}
          stab={stab(id)}
          picked={moveFrom !== null && 'slot' in moveFrom && moveFrom.slot === j}
          onClick={() => {
            if (moveFrom && 'spare' in moveFrom) swap(j, moveFrom.spare);
            else
              setMoveFrom(
                moveFrom && 'slot' in moveFrom && moveFrom.slot === j ? null : { slot: j },
              );
          }}
        />
      ))}
      {spares.length > 0 && <h3 className="text-[11px] font-bold">SPARE MOVES</h3>}
      {spares.map((id) => (
        <MoveCard
          key={id}
          id={id}
          stab={stab(id)}
          picked={moveFrom !== null && 'spare' in moveFrom && moveFrom.spare === id}
          onClick={() => {
            if (moveFrom && 'slot' in moveFrom) swap(moveFrom.slot, id);
            else
              setMoveFrom(
                moveFrom && 'spare' in moveFrom && moveFrom.spare === id ? null : { spare: id },
              );
          }}
        />
      ))}
      <p className="text-[9px] leading-relaxed opacity-70">
        Spare moves are the ones it learns by Lv50 in story mode. Battle mode keeps to one special
        move each.
      </p>
    </div>
  );
}

/**
 * Pick 6 from the roster. The first pick leads; the rival is drawn from the rest. Tap a pick
 * on YOUR TEAM to set its form, look, held item and moves.
 */
export function TeamSelect({ onReady }: Props) {
  // Britain's Ranemon stay a surprise until a story save gets there.
  const [britain] = useState(() => {
    try {
      return britainUnlocked(localStorage);
    } catch {
      return false;
    }
  });
  const [roster, setRoster] = useState<RosterId>('lads');
  const [forms, setForms] = useState<Forms>('basic');
  const [picks, setPicks] = useState<TeamPick[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [timeLeft, setTimeLeft] = useState(PICK_SECONDS);
  const slots = rosterOf(roster, forms);
  const slotOf = (line: string) => slots.find((s) => s.line === line)!;

  // As in Stadium, the clock fills any empty slots at random when it runs out.
  useEffect(() => {
    if (timeLeft <= 0) {
      const rest = slots
        .filter((s) => !picks.some((p) => p.line === s.line))
        .sort(() => Math.random() - 0.5)
        .map(newPick);
      onReady([...picks, ...rest].slice(0, TEAM_SIZE), slots, difficulty);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  /** A new roster or rule keeps the picks it still has, each at a form the rule allows. */
  function rule(nextRoster: RosterId, nextForms: Forms) {
    const next = rosterOf(nextRoster, nextForms);
    setRoster(nextRoster);
    setForms(nextForms);
    setPicks((ps) =>
      ps.flatMap((p) => {
        const s = next.find((x) => x.line === p.line);
        if (!s) return [];
        return [s.forms.some((f) => f.id === p.form) ? p : withForm(p, s.forms[0].id)];
      }),
    );
  }

  function toggle(slot: Slot) {
    setPicks((ps) =>
      ps.some((p) => p.line === slot.line)
        ? ps.filter((p) => p.line !== slot.line)
        : ps.length < TEAM_SIZE
          ? [...ps, newPick(slot)]
          : ps,
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 text-ink">
      <div className="flex items-center justify-between text-[14px]">
        <h1>CHOOSE YOUR TEAM</h1>
        <span aria-label="Time left to pick">⏱ {timeLeft}s</span>
      </div>

      <section className="dialog flex flex-col gap-2 p-3 text-ink" aria-label="Rules">
        <h2 className="text-[13px]">ROSTER</h2>
        <Choice
          label="Roster"
          options={ROSTERS}
          value={roster}
          locked={britain ? [] : ['london', 'everyone']}
          onPick={(r) => rule(r, forms)}
        />
        <h2 className="text-[13px]">FORMS</h2>
        <Choice label="Forms" options={FORMS} value={forms} onPick={(f) => rule(roster, f)} />
        <p className="text-[10px] leading-relaxed opacity-70">
          {ROSTERS.find((r) => r.id === roster)?.about} {FORMS.find((f) => f.id === forms)?.about}
        </p>
      </section>

      <section className="dialog p-3 text-ink" aria-label="Your roster">
        <h2 className="mb-1 text-[13px]">PICK {TEAM_SIZE}</h2>
        <p className="mb-2 text-[10px] leading-relaxed opacity-70">
          Your first pick leads. Your rival gets {TEAM_SIZE} of the rest.
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {slots.map((s) => {
            const order = picks.findIndex((p) => p.line === s.line);
            const c = order >= 0 ? creatureOfPick(picks[order]) : s.forms[0];
            return (
              <button
                key={s.line}
                type="button"
                className="pixel-btn flex flex-col items-center gap-1 px-1 py-2 text-center"
                aria-pressed={order >= 0}
                onClick={() => toggle(s)}
              >
                <span className="h-12 w-12">
                  <Sprite creature={c} />
                </span>
                <span className="text-[11px] leading-tight">{c.name}</span>
                <span className="flex flex-wrap justify-center gap-0.5">
                  {c.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </span>
                <span className="h-2.5 text-[10px]">
                  {order === 0 ? 'LEAD' : order > 0 ? `#${order + 1}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {picks.length > 0 && (
        <section className="dialog flex flex-col gap-1.5 p-3 text-ink" aria-label="Your team">
          <h2 className="text-[13px]">YOUR TEAM</h2>
          <p className="text-[10px] leading-relaxed opacity-70">
            Tap one to pick its look, what it holds and its moves.
          </p>
          {picks.map((p, i) => {
            const c = creatureOfPick(p);
            return (
              <div key={p.line} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  className="pixel-btn flex items-center gap-2 px-2 py-1 text-left"
                  aria-expanded={open === p.line}
                  onClick={() => setOpen(open === p.line ? null : p.line)}
                  data-testid="team-pick"
                >
                  <span className="h-9 w-9 shrink-0">
                    <Sprite creature={c} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col text-[11px]">
                    <span>
                      {i === 0 ? 'LEAD · ' : `#${i + 1} · `}
                      {c.name}
                    </span>
                    <span className="truncate text-[9px] opacity-75">
                      {p.held ? `Holds ${itemById(p.held).name}` : 'Holds nothing'}
                    </span>
                  </span>
                  <span aria-hidden="true">{open === p.line ? '▲' : '▼'}</span>
                </button>
                {open === p.line && (
                  <PickEditor
                    key={p.form}
                    pick={p}
                    slot={slotOf(p.line)}
                    britain={britain}
                    onChange={(next) =>
                      setPicks((ps) => ps.map((x) => (x.line === p.line ? next : x)))
                    }
                  />
                )}
              </div>
            );
          })}
        </section>
      )}

      <div role="group" aria-label="Difficulty" className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className="pixel-btn text-center text-[13px]"
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
        data-cmd="fight"
        disabled={picks.length !== TEAM_SIZE}
        onClick={() => onReady(picks, slots, difficulty)}
      >
        BATTLE! ({picks.length}/{TEAM_SIZE})
      </button>
    </div>
  );
}
