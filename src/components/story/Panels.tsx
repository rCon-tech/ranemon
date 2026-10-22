'use client';

import { useEffect, useRef, useState } from 'react';
import { DexEntry } from '@/components/DexEntry';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { moveById } from '@/lib/battle/moves';
import { DEX } from '@/lib/battle/evolutions';
import { ROSTER } from '@/lib/battle/roster';
import { canUseOn, ITEMS, itemById, shopStock, type ItemId } from '@/lib/story/items';
import { KEY_ITEMS } from '@/lib/story/keys';
import {
  creatureOf,
  expProgress,
  learnedOf,
  movesAt,
  PARTY_SIZE,
  speciesById,
  START_LEVEL,
  statsOf,
  type Member,
} from '@/lib/story/party';
import { storyKnowledge } from '@/lib/story/dex';
import { shinyForm } from '@/lib/story/shiny';
import { playSfx } from '@/lib/sound/engine';
import type { Dir } from '@/lib/story/world';
import { hasFlag, type StoryState } from '@/lib/story/state';
import { COUNTIES, mapById } from '@/content/story/maps';
import { DEPARTURES, isRunning, type Departure } from '@/content/story/station';

/** A full-screen GB menu: a bordered box with a title and a BACK button. */
export function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="dialog absolute inset-0 z-20 flex flex-col gap-2 overflow-y-auto p-3 text-ink">
      <div className="-mx-3 -mt-3 mb-1 flex items-center justify-between rounded-t-lg bg-panel px-3 py-1.5 text-[15px] font-bold text-paper">
        <h2>{title}</h2>
        {onClose && (
          <button type="button" className="pixel-btn px-2 py-1 text-[11px]" onClick={onClose}>
            BACK
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[8px]">
      {label}
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bezel">
        <span
          className={`block h-full rounded-full ${label === 'EXP' ? 'bg-exp' : 'bg-hp-high'}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
    </span>
  );
}

/** One party row: face, name, level, HP and EXP. */
export function MemberRow({
  m,
  onClick,
  disabled,
  pressed,
}: {
  m: Member;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  const max = statsOf(m).hp;
  return (
    <button
      type="button"
      className="pixel-btn flex items-center gap-2 px-2 py-1.5"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
    >
      <span className="h-8 w-8 shrink-0">
        <Sprite creature={creatureOf(m)} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex justify-between text-[11px]">
          <span className="truncate">
            {m.shiny && (
              <span className="shiny-name" aria-label="Shiny">
                ★
              </span>
            )}
            {speciesById(m.species).name}
            {m.held && (
              <span className="ml-1 text-[9px]" aria-label={`Holding ${itemById(m.held).name}`}>
                ◆
              </span>
            )}
          </span>
          <span>Lv{m.level}</span>
        </span>
        <Bar value={m.hp / max} label="HP" />
        <span className="flex justify-between text-[8px]">
          <span>
            {m.hp === 0 ? 'FAINTED' : `${m.hp}/${max}`}
            {m.status ? ` · ${m.status.toUpperCase()}` : ''}
          </span>
        </span>
        <Bar value={expProgress(m)} label="EXP" />
      </span>
    </button>
  );
}

export function PartyPanel({
  game,
  onLead,
  onSwap,
  onTakeHeld,
  onClose,
}: {
  game: StoryState;
  onLead: (index: number) => void;
  /** Puts a learnt move into one of a member's 4 slots. */
  onSwap: (index: number, slot: number, move: string) => void;
  /** Takes the item a member is holding back into the bag. */
  onTakeHeld: (index: number) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  /** The move slot picked to swap out, on the open member. */
  const [slot, setSlot] = useState<number | null>(null);
  return (
    <Panel title="PARTY" onClose={onClose}>
      <p className="text-[10px] leading-relaxed">
        The first Ranemon leads in battle and walks behind you.
      </p>
      {game.party.map((m, i) => (
        <div key={m.uid} className="flex flex-col gap-1">
          <MemberRow
            m={m}
            onClick={() => {
              setOpen(open === i ? null : i);
              setSlot(null);
            }}
            pressed={open === i}
          />
          {open === i && (
            <div className="flex flex-col gap-1 rounded-lg border-2 border-frame bg-mist p-2 text-[10px]">
              {m.shiny && (
                <span className="shiny-banner self-start rounded px-1.5 py-0.5 text-[10px] font-bold">
                  ★ SHINY ★
                </span>
              )}
              <span className="flex gap-1">
                {speciesById(m.species).types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
              {m.moves.map((id, j) => {
                const spare = learnedOf(m).length > m.moves.length;
                const row = (
                  <>
                    <span>
                      {moveById(id).signature ? '* ' : ''}
                      {moveById(id).name}
                    </span>
                    <span>
                      PP {m.pp[j]}/{moveById(id).pp}
                    </span>
                  </>
                );
                return spare ? (
                  <button
                    key={id}
                    type="button"
                    className={`flex justify-between rounded px-1 text-left ${slot === j ? 'bg-accent2 text-paper' : ''}`}
                    onClick={() => setSlot(slot === j ? null : j)}
                    aria-pressed={slot === j}
                  >
                    {row}
                  </button>
                ) : (
                  <span key={id} className="flex justify-between px-1">
                    {row}
                  </span>
                );
              })}
              {learnedOf(m).length > m.moves.length && (
                <div className="mt-1 flex flex-col gap-1" data-testid="spare-moves">
                  <span className="text-[9px] opacity-70">
                    {slot === null
                      ? 'Tap a move above, then one of these to swap it in.'
                      : `Swap out ${moveById(m.moves[slot]).name} for:`}
                  </span>
                  {learnedOf(m)
                    .filter((id) => !m.moves.includes(id))
                    .map((id) => {
                      const move = moveById(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className="pixel-btn flex justify-between px-1.5 py-1 text-left text-[10px]"
                          disabled={slot === null}
                          onClick={() => {
                            if (slot === null) return;
                            onSwap(i, slot, id);
                            setSlot(null);
                          }}
                        >
                          <span>{move.name}</span>
                          <span className="opacity-70">
                            {move.type?.toUpperCase()} ·{' '}
                            {move.power ? `POW ${move.power}` : 'STATUS'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
              {m.held && (
                <div className="mt-1 flex items-center justify-between gap-2" data-testid="held">
                  <span>HOLDING: {itemById(m.held).name}</span>
                  <button
                    type="button"
                    className="pixel-btn px-2 py-0.5 text-[10px]"
                    onClick={() => onTakeHeld(i)}
                  >
                    TAKE
                  </button>
                </div>
              )}
              {i > 0 && (
                <button
                  type="button"
                  className="pixel-btn menu-item mt-1 text-[11px]"
                  onClick={() => {
                    onLead(i);
                    setOpen(null);
                  }}
                >
                  MAKE LEAD
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </Panel>
  );
}

export function BagPanel({
  game,
  onUse,
  onUseKey,
  onClose,
}: {
  game: StoryState;
  onUse: (item: ItemId, member: number) => void;
  onUseKey: (flag: string) => void;
  onClose: () => void;
}) {
  const [pick, setPick] = useState<ItemId | null>(null);
  const keys = KEY_ITEMS.filter(
    (k) => hasFlag(game, k.flag) && !(k.goneIf && hasFlag(game, k.goneIf)),
  );
  const items = ITEMS.filter((i) => (game.bag[i.id] ?? 0) > 0);
  if (pick) {
    const item = itemById(pick);
    return (
      <Panel title={item.name.toUpperCase()} onClose={() => setPick(null)}>
        <p className="text-[10px] leading-relaxed">
          {item.use.kind === 'hold'
            ? 'Give it to which Ranemon to hold?'
            : 'Use it on which Ranemon?'}
        </p>
        {game.party.map((m, i) => (
          <MemberRow
            key={m.uid}
            m={m}
            disabled={!canUseOn(item, m)}
            onClick={() => {
              onUse(pick, i);
              setPick(null);
            }}
          />
        ))}
      </Panel>
    );
  }
  return (
    <Panel title="BAG" onClose={onClose}>
      {items.length === 0 && !keys.length && <p className="text-[11px]">The bag is empty.</p>}
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={i.use.kind === 'pint' || i.use.kind === 'vape'}
          onClick={() => setPick(i.id)}
        >
          <span className="flex justify-between text-[11px]">
            <span>{i.name}</span>
            <span>×{game.bag[i.id]}</span>
          </span>
          <span className="text-[8px] leading-relaxed">
            {i.about}
            {i.use.kind === 'pint'
              ? ' Use it in a wild battle.'
              : i.use.kind === 'vape'
                ? ' Use it in a battle.'
                : ''}
          </span>
        </button>
      ))}
      {keys.length > 0 && <h3 className="mt-1 text-[11px] font-bold">KEY ITEMS</h3>}
      {keys.map((k) => (
        <button
          key={k.flag}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={!k.usable}
          onClick={() => onUseKey(k.flag)}
          data-testid={`key-${k.flag}`}
        >
          <span className="text-left text-[11px]">{k.name}</span>
          <span className="text-left text-[8px] leading-relaxed">{k.about}</span>
        </button>
      ))}
    </Panel>
  );
}

export function ShopPanel({
  game,
  onBuy,
  onClose,
}: {
  game: StoryState;
  onBuy: (item: ItemId) => void;
  onClose: () => void;
}) {
  const county = mapById(game.map).county;
  return (
    <Panel title="VAPES" onClose={onClose}>
      <p className="text-[11px]">Money: €{game.money}</p>
      {shopStock(county).map((i) => (
        <button
          key={i.id}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={game.money < (i.price ?? Infinity)}
          onClick={() => onBuy(i.id)}
        >
          <span className="flex justify-between text-[11px]">
            <span>{i.name}</span>
            <span>€{i.price}</span>
          </span>
          <span className="text-[8px] leading-relaxed">
            {i.about} You have {game.bag[i.id] ?? 0}.
          </span>
        </button>
      ))}
    </Panel>
  );
}

export function GroupChatPanel({
  game,
  onSend,
  onBring,
  onClose,
}: {
  game: StoryState;
  onSend: (index: number) => void;
  onBring: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <Panel title="GROUP CHAT" onClose={onClose}>
      <p className="text-[10px] leading-relaxed">
        Tap a party member to send them to the chat, or someone in the chat to bring them along.
        They come back fully rested.
      </p>
      <h3 className="text-[11px]">
        PARTY {game.party.length}/{PARTY_SIZE}
      </h3>
      {game.party.map((m, i) => (
        <MemberRow key={m.uid} m={m} disabled={game.party.length <= 1} onClick={() => onSend(i)} />
      ))}
      <h3 className="text-[11px]">IN THE CHAT ({game.box.length})</h3>
      {game.box.length === 0 && <p className="text-[10px]">Nobody yet.</p>}
      {game.box.map((m, i) => (
        <MemberRow
          key={m.uid}
          m={m}
          disabled={game.party.length >= PARTY_SIZE}
          onClick={() => onBring(i)}
        />
      ))}
    </Panel>
  );
}

/** The D-pad, A and B, handed to the Ranedex while it's open. */
export interface DexNav {
  dir: (dir: Dir) => void;
  a: () => void;
  /** B: back from a page to the list. False when the list is showing, so B closes it. */
  b: () => boolean;
}

/** Ranedex tiles per row, for moving up and down with the D-pad. */
const DEX_COLUMNS = 4;

export function RanedexPanel({
  game,
  onClose,
  navRef,
}: {
  game: StoryState;
  onClose: () => void;
  navRef?: React.RefObject<DexNav | null>;
}) {
  const [cursor, setCursor] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [look, setLook] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const know = storyKnowledge(game);
  // Species you have a shiny of right now, in the party or the Group Chat.
  const shinies = new Set(
    [...game.party, ...game.box].filter((m) => m.shiny).map((m) => m.species),
  );
  // Petchemon is not in the Ranedex, so he is left out of the counts.
  const inDex = (id: string) => DEX.some((c) => c.id === id);
  const seen = (i: number) => game.seen.includes(DEX[i].id);

  const show = (i: number) => {
    setCursor(i);
    setOpen(i);
    setLook(0);
    box.current?.closest('.dialog')?.scrollTo({ top: 0 });
  };
  /** The next entry you've seen, one way or the other from `from`, wrapping round. */
  const nextSeen = (from: number, step: 1 | -1) => {
    for (let n = 1; n <= DEX.length; n++) {
      const i = (from + step * n + DEX.length) % DEX.length;
      if (seen(i)) return i;
    }
    return from;
  };

  useEffect(() => {
    if (!navRef) return;
    navRef.current = {
      dir: (dir) => {
        if (open !== null) {
          if (dir === 'left' || dir === 'right') {
            playSfx('blip');
            show(nextSeen(open, dir === 'left' ? -1 : 1));
          } else box.current?.closest('.dialog')?.scrollBy({ top: dir === 'up' ? -80 : 80 });
          return;
        }
        const step = { left: -1, right: 1, up: -DEX_COLUMNS, down: DEX_COLUMNS }[dir];
        const to = cursor + step;
        if (to < 0 || to >= DEX.length) return;
        playSfx('blip');
        setCursor(to);
      },
      a: () => {
        if (open !== null) {
          setLook((l) => l + 1);
          return;
        }
        if (seen(cursor)) {
          playSfx('select');
          show(cursor);
        }
      },
      b: () => {
        if (open === null) return false;
        setOpen(null);
        return true;
      },
    };
    return () => {
      navRef.current = null;
    };
  });

  // Keep the cursor's tile in view as the D-pad moves it.
  useEffect(() => {
    if (open === null)
      box.current?.querySelector(`[data-dex="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  if (open !== null) {
    const c = DEX[open];
    return (
      <Panel title="RANEDEX" onClose={() => setOpen(null)}>
        <div ref={box}>
          <DexEntry
            creature={c}
            number={open + 1}
            know={know}
            look={look}
            onLook={setLook}
            onOpen={(id) => show(DEX.findIndex((d) => d.id === id))}
            onStep={(step) => show(nextSeen(open, step))}
          />
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="RANEDEX" onClose={onClose}>
      <p className="text-[11px]">
        Seen {game.seen.filter(inDex).length} · Befriended {game.caught.filter(inDex).length} /{' '}
        {DEX.length}
        {shinies.size > 0 && <span className="shiny-name"> · ★ Shiny {shinies.size}</span>}
      </p>
      <div ref={box} className="grid grid-cols-4 gap-1.5">
        {DEX.map((c, i) => {
          const seen = game.seen.includes(c.id);
          const shiny = shinies.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              data-dex={i}
              disabled={!seen}
              aria-label={`No.${String(i + 1).padStart(3, '0')} ${seen ? c.name : 'unknown'}`}
              onClick={() => show(i)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 bg-mist p-1 ${shiny ? 'border-gold' : 'border-frame'} ${i === cursor ? 'outline outline-3 outline-accent2' : ''}`}
            >
              <span className="text-[8px]">{String(i + 1).padStart(3, '0')}</span>
              <span className="h-10 w-10">
                {seen ? <Sprite creature={shiny ? shinyForm(c) : c} /> : null}
              </span>
              <span className="text-[8px]">
                {shiny && <span className="shiny-name">★</span>}
                {seen ? c.name : '?????'}
                {game.caught.includes(c.id) ? ' ●' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function JerseysPanel({ game, onClose }: { game: StoryState; onClose: () => void }) {
  return (
    <Panel title="TRAINER CARD" onClose={onClose}>
      <p className="text-[11px] leading-relaxed">
        Money €{game.money}
        <br />
        Ranedex {game.caught.length}
        <br />
        {hasFlag(game, 'champion') ? 'CHAMPION OF IRELAND' : 'Jerseys'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {COUNTIES.map((id) => {
          const name = mapById(id).name.split(', ').at(-1)!.replace('Co. ', '');
          const county = id.charAt(0).toUpperCase() + id.slice(1);
          const won = hasFlag(game, `jersey:${id}`);
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 border-frame p-1 text-[8px] ${won ? 'bg-gold text-ink' : 'bg-mist'}`}
              title={name}
            >
              <Jersey filled={won} />
              {county}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Jersey({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 14" className="h-6 w-7" shapeRendering="crispEdges" aria-hidden="true">
      <path
        d="M5 0h6l5 3-2 4-2-1v8H4V6L2 7 0 3z"
        fill={filled ? 'var(--color-paper)' : 'none'}
        stroke={filled ? 'var(--color-paper)' : 'var(--color-ink)'}
        strokeWidth="1"
      />
    </svg>
  );
}

/** Michael D's kitchen table: a pint for every Ranemon. Pick one to start. */
export function StarterPanel({ onChoose }: { onChoose: (species: string) => void }) {
  const [pick, setPick] = useState<string | null>(null);
  const c = pick ? speciesById(pick) : null;
  return (
    <Panel title="PICK YOUR RANEMON">
      <p className="text-[10px] leading-relaxed">
        Sixteen pints on the table, one for each Ranemon. Whoever you pick starts at Lv
        {START_LEVEL}.
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {ROSTER.map((r) => (
          <button
            key={r.id}
            type="button"
            className="pixel-btn flex flex-col items-center gap-1 px-1 py-1.5"
            aria-pressed={pick === r.id}
            onClick={() => setPick(r.id)}
          >
            <span className="h-10 w-10">
              <Sprite creature={r} />
            </span>
            <span className="text-[8px]">{r.name}</span>
          </button>
        ))}
      </div>
      {c && (
        <div className="flex flex-col gap-1.5 rounded-lg border-2 border-frame bg-mist p-2 text-[10px] leading-relaxed">
          <span className="flex items-center gap-1 text-[13px]">
            {c.name}
            {c.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </span>
          <span>{c.entry}</span>
          <span>
            Knows:{' '}
            {movesAt(c, START_LEVEL)
              .map((id) => moveById(id).name)
              .join(', ')}
            . Special move at Lv20.
          </span>
          <button
            type="button"
            className="pixel-btn menu-item text-[13px]"
            onClick={() => onChoose(c.id)}
          >
            CHOOSE {c.name.toUpperCase()}
          </button>
        </div>
      )}
    </Panel>
  );
}

/** A yes/no question in the text box. */
export function Choice({
  question,
  yes,
  no,
  onYes,
  onNo,
}: {
  question: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="dialog absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-3 text-[13px] leading-relaxed">
      <p>{question}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="pixel-btn menu-item text-[13px]" onClick={onYes}>
          {yes}
        </button>
        <button type="button" className="pixel-btn menu-item text-[13px]" onClick={onNo}>
          {no}
        </button>
      </div>
    </div>
  );
}

/**
 * The departures board at Connolly Station: every line, by platform. Lines that run are tickets
 * to buy; lines still to come are on the board, greyed out.
 */
export function DeparturesPanel({
  game,
  onPick,
  onClose,
}: {
  game: StoryState;
  onPick: (d: Departure) => void;
  onClose: () => void;
}) {
  return (
    <Panel title="DEPARTURES" onClose={onClose}>
      <div className="flex flex-col gap-1.5 rounded bg-[#141418] p-2 font-mono text-[#f8b820]">
        {DEPARTURES.map((d) => {
          const locked = isRunning(d) && d.lock && !hasFlag(game, d.lock.flag);
          const status = !isRunning(d) ? 'COMING SOON' : locked ? 'NOT YET' : 'ON TIME';
          return (
            <button
              key={d.id}
              type="button"
              data-testid={`departure-${d.id}`}
              className="pixel-btn flex items-center gap-2 px-2 py-1.5 text-left"
              disabled={!isRunning(d)}
              onClick={() => isRunning(d) && onPick(d)}
            >
              <span className="w-5 text-center text-[13px] font-bold">{d.platform}</span>
              <span className="flex flex-1 flex-col">
                <span className="text-[11px]">{d.to}</span>
                <span className="text-[8px]">{d.line}</span>
              </span>
              <span className="text-[8px]">{status}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] leading-relaxed">
        Pick a train and the clerk sells you a ticket. More lines are coming to Connolly soon.
      </p>
    </Panel>
  );
}

/** Credits: the road you walked, county by county, with your party. */
export function EndingPanel({ game, onDone }: { game: StoryState; onDone: () => void }) {
  return (
    <Panel title="CHAMPIONS OF IRELAND">
      <p className="text-[11px] leading-relaxed">
        In Front Square, Michael D presents the title. The Campanile bells ring out over Dublin.
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {game.party.map((m) => (
          <span key={m.uid} className="h-10 w-10">
            <Sprite creature={creatureOf(m)} />
          </span>
        ))}
      </div>
      <ol className="flex flex-col gap-1 text-[10px]">
        {[...COUNTIES, 'dublin', 'trinity'].map((id) => (
          <li key={id}>▶ {mapById(id).name}</li>
        ))}
      </ol>
      <p className="text-[10px] leading-relaxed">
        THE END. Thanks for playing Ranemon. B&S want a rematch at level 60: find them in the Long
        Room.
      </p>
      <button type="button" className="pixel-btn menu-item text-[13px]" onClick={onDone}>
        CONTINUE
      </button>
    </Panel>
  );
}
