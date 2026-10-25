'use client';

import { useEffect, useRef, useState } from 'react';
import { DexEntry } from '@/components/DexEntry';
import { MoveCard } from '@/components/MoveCard';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { moveById } from '@/lib/battle/moves';
import { DEX as IRISH_DEX } from '@/lib/battle/evolutions';
import { ROSTER } from '@/lib/battle/roster';
import { UK, UK_ENTRIES } from '@/lib/battle/uk';
import { variantForm } from '@/lib/battle/variants';
import { UK_LEVEL } from '@/content/story/london';
import { canUseOn, ITEMS, itemById, priceOf, shopStock, type ItemId } from '@/lib/story/items';
import { KEY_ITEMS } from '@/lib/story/keys';
import { levelCap, type LevelCap } from '@/lib/story/levels';
import { openMissions } from '@/lib/story/missions';
import {
  creatureOf,
  expProgress,
  learnedOf,
  learnset,
  movesAt,
  nameOf,
  PARTY_SIZE,
  speciesById,
  START_LEVEL,
  statsOf,
  type Member,
} from '@/lib/story/party';
import { storyKnowledge } from '@/lib/story/dex';
import { hasUkDex, ukKnowledge, UK_DEX } from '@/lib/story/ukdex';
import { shinyForm } from '@/lib/story/shiny';
import { playSfx } from '@/lib/sound/engine';
import type { Dir, Stall } from '@/lib/story/world';
import { hasFlag, type StoryState } from '@/lib/story/state';
import { COUNTIES, mapById } from '@/content/story/maps';
import { bandsOf, jerseyOf } from '@/content/story/jerseys';
import { DEPARTURES, isRunning, type Departure } from '@/content/story/station';
import { DEFAULT_SKIN, hasSkin, lookOf, SKINS } from '@/content/story/skins';
import { Portrait } from './Portrait';

/** The level cap, as the PARTY and BAG panels say it. Nothing once there's no cap. */
function CapNote({ cap }: { cap: LevelCap }) {
  if (!cap.leader) return null;
  return (
    <p className="text-[10px] leading-relaxed">
      LEVEL CAP: Lv{cap.level}. Beat {cap.leader} to raise it.
    </p>
  );
}

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
  /** The member whose MOVES screen is showing. */
  const [moves, setMoves] = useState<number | null>(null);
  if (moves !== null && game.party[moves])
    return (
      <MovesPanel
        m={game.party[moves]}
        onSwap={(slot, move) => onSwap(moves, slot, move)}
        onClose={() => setMoves(null)}
      />
    );
  return (
    <Panel title="PARTY" onClose={onClose}>
      <p className="text-[10px] leading-relaxed">
        The first Ranemon leads in battle and walks behind you.
      </p>
      <CapNote cap={levelCap(game)} />
      {game.party.map((m, i) => (
        <div key={m.uid} className="flex flex-col gap-1">
          <MemberRow m={m} onClick={() => setOpen(open === i ? null : i)} pressed={open === i} />
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
              <div className="flex flex-col gap-0.5" data-testid="party-moves">
                {m.moves.map((id, j) => {
                  const move = moveById(id);
                  return (
                    <span key={id} className="flex items-center justify-between gap-1 px-1">
                      <span className="truncate">
                        {move.signature ? '★ ' : ''}
                        {move.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[9px]">
                        {move.type && <TypeBadge type={move.type} />}
                        <span className="w-9 text-right">
                          {move.power ? `POW${move.power}` : '—'}
                        </span>
                        <span className="w-11 text-right">
                          PP {m.pp[j]}/{move.pp}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                className="pixel-btn menu-item mt-1 text-[11px]"
                onClick={() => setMoves(i)}
              >
                {learnedOf(m).length > m.moves.length
                  ? `CHANGE MOVES (${learnedOf(m).length - m.moves.length} SPARE)`
                  : 'MOVES'}
              </button>
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

/**
 * A member's moves screen, from PARTY: the 4 it fights with and the spare moves it has learnt,
 * each with its type, power and accuracy. Tap one of each to swap them.
 */
export function MovesPanel({
  m,
  onSwap,
  onClose,
}: {
  m: Member;
  /** Puts a learnt move into one of the 4 slots. */
  onSwap: (slot: number, move: string) => void;
  onClose: () => void;
}) {
  /** The move tapped first, either one in a slot or a spare. */
  const [pick, setPick] = useState<{ slot: number } | { spare: string } | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const species = speciesById(m.species);
  const spares = learnedOf(m).filter((id) => !m.moves.includes(id));
  const next = learnset(species).find((l) => l.level > m.level && !learnedOf(m).includes(l.move));
  const stab = (id: string) => {
    const t = moveById(id).type;
    return t !== null && species.types.includes(t);
  };
  const swap = (slot: number, spare: string) => {
    setSaid(
      `${nameOf(m)} swapped out ${moveById(m.moves[slot]).name} for ${moveById(spare).name}.`,
    );
    onSwap(slot, spare);
    setPick(null);
  };
  const prompt =
    spares.length === 0
      ? 'No spare moves yet. New ones are learnt by levelling up.'
      : pick === null
        ? 'Tap a move it knows, then a spare move to swap them.'
        : 'slot' in pick
          ? `Swap out ${moveById(m.moves[pick.slot]).name} for which spare move?`
          : `Swap in ${moveById(pick.spare).name} for which move?`;
  return (
    <Panel title="MOVES" onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className="h-10 w-10 shrink-0">
          <Sprite creature={creatureOf(m)} />
        </span>
        <span className="flex flex-col gap-1 text-[11px]">
          <span>
            {nameOf(m)} Lv{m.level}
          </span>
          <span className="flex gap-1">
            {species.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </span>
        </span>
      </div>
      <p className="text-[10px] leading-relaxed" data-testid="moves-prompt">
        {said ?? prompt}
      </p>
      <h3 className="text-[11px] font-bold">FIGHTS WITH</h3>
      {m.moves.map((id, j) => (
        <MoveCard
          key={id}
          id={id}
          pp={m.pp[j]}
          stab={stab(id)}
          picked={pick !== null && 'slot' in pick && pick.slot === j}
          onClick={() => {
            setSaid(null);
            if (pick && 'spare' in pick) swap(j, pick.spare);
            else setPick(pick && 'slot' in pick && pick.slot === j ? null : { slot: j });
          }}
        />
      ))}
      <h3 className="mt-1 text-[11px] font-bold">SPARE MOVES</h3>
      {spares.length === 0 && <p className="text-[10px] opacity-70">None yet.</p>}
      {spares.map((id) => (
        <MoveCard
          key={id}
          id={id}
          stab={stab(id)}
          picked={pick !== null && 'spare' in pick && pick.spare === id}
          onClick={() => {
            setSaid(null);
            if (pick && 'slot' in pick) swap(pick.slot, id);
            else setPick(pick && 'spare' in pick && pick.spare === id ? null : { spare: id });
          }}
        />
      ))}
      {next && <p className="text-[10px] opacity-70">Learns a new move at Lv{next.level}.</p>}
      <p className="text-[9px] leading-relaxed opacity-70">
        Swapped-out moves stay learnt, so you can swap them back any time.
      </p>
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
  const cap = levelCap(game);
  if (pick) {
    const item = itemById(pick);
    return (
      <Panel title={item.name.toUpperCase()} onClose={() => setPick(null)}>
        <p className="text-[10px] leading-relaxed">
          {item.use.kind === 'hold'
            ? 'Give it to which Ranemon to hold?'
            : 'Use it on which Ranemon?'}
        </p>
        {item.use.kind === 'level' && <CapNote cap={cap} />}
        {game.party.map((m, i) => (
          <MemberRow
            key={m.uid}
            m={m}
            disabled={!canUseOn(item, m, cap.level)}
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
  stall = null,
  onBuy,
  onClose,
}: {
  game: StoryState;
  /** Someone's own stall instead of Vapes. */
  stall?: Stall | null;
  onBuy: (item: ItemId) => void;
  onClose: () => void;
}) {
  const stock = stall
    ? stall.stock.map((s) => itemById(s.item))
    : shopStock(mapById(game.map).county);
  return (
    <Panel title={stall?.name ?? 'VAPES'} onClose={onClose}>
      <p className="text-[11px]">Money: €{game.money}</p>
      {stock.map((i) => (
        <button
          key={i.id}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={game.money < priceOf(i.id, stall)}
          onClick={() => onBuy(i.id)}
          data-testid={`buy-${i.id}`}
        >
          <span className="flex justify-between text-[11px]">
            <span>{i.name}</span>
            <span>€{priceOf(i.id, stall)}</span>
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
  // Ireland's Ranedex, or the UK's once you've met a Ranemon over there (`ukdex.ts`).
  const uk = hasUkDex(game);
  const [region, setRegion] = useState<'ireland' | 'uk'>('ireland');
  const inUk = region === 'uk' && uk;
  const dex = inUk ? UK_DEX : IRISH_DEX;
  const [cursor, setCursor] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [look, setLook] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const know = inUk ? ukKnowledge(game) : storyKnowledge(game);
  // Species you have a shiny of right now, in the party or the Group Chat.
  const shinies = new Set(
    [...game.party, ...game.box].filter((m) => m.shiny).map((m) => m.species),
  );
  const pick = (r: 'ireland' | 'uk') => {
    playSfx('blip');
    setRegion(r);
    setCursor(0);
  };
  const seen = (i: number) => know.seen(dex[i].id);

  const show = (i: number) => {
    setCursor(i);
    setOpen(i);
    setLook(0);
    box.current?.closest('.dialog')?.scrollTo({ top: 0 });
  };
  /** The next entry you've seen, one way or the other from `from`, wrapping round. */
  const nextSeen = (from: number, step: 1 | -1) => {
    for (let n = 1; n <= dex.length; n++) {
      const i = (from + step * n + dex.length) % dex.length;
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
        if (to < 0 || to >= dex.length) return;
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
    const c = dex[open];
    return (
      <Panel title={inUk ? 'UK RANEDEX' : 'RANEDEX'} onClose={() => setOpen(null)}>
        <div ref={box}>
          <DexEntry
            creature={c}
            number={open + 1}
            know={know}
            look={look}
            onLook={setLook}
            onOpen={(id) => show(dex.findIndex((d) => d.id === id))}
            onStep={(step) => show(nextSeen(open, step))}
          />
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={inUk ? 'UK RANEDEX' : 'RANEDEX'} onClose={onClose}>
      {uk && (
        <div className="flex gap-1" aria-label="Ranedex">
          {(['ireland', 'uk'] as const).map((r) => (
            <button
              key={r}
              type="button"
              className="pixel-btn px-2 py-0.5 text-[10px]"
              aria-pressed={inUk === (r === 'uk')}
              onClick={() => pick(r)}
            >
              {r === 'uk' ? 'UK' : 'IRELAND'}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px]">
        Seen {dex.filter((c) => know.seen(c.id)).length} · Befriended{' '}
        {dex.filter((c) => know.caught(c.id)).length} / {dex.length}
        {shinies.size > 0 && <span className="shiny-name"> · ★ Shiny {shinies.size}</span>}
      </p>
      <div ref={box} className="grid grid-cols-4 gap-1.5">
        {dex.map((c, i) => {
          const seen = know.seen(c.id);
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
                {know.caught(c.id) ? ' ●' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function JerseysPanel({
  game,
  champion = false,
  onClose,
}: {
  game: StoryState;
  /** They hold the Online Champion's crown. */
  champion?: boolean;
  onClose: () => void;
}) {
  return (
    <Panel title="TRAINER CARD" onClose={onClose}>
      {champion && (
        <p
          className="rounded-lg border-2 border-gold bg-[#2a1450] px-2 py-1 text-center text-[11px] font-bold text-gold shadow-[0_0_10px_rgba(255,210,58,0.6)]"
          data-testid="card-champion"
        >
          ♛ ONLINE CHAMPION ♛
        </p>
      )}
      <div className="flex items-center gap-3">
        <Portrait
          look={lookOf(game, champion)}
          className={`h-[72px] w-12 rounded-lg border-2 bg-mist ${champion ? 'border-gold' : 'border-frame'}`}
        />
        <p className="text-[11px] leading-relaxed">
          Money €{game.money}
          <br />
          Ranedex {game.caught.length}
          <br />
          {hasFlag(game, 'champion') ? 'CHAMPION OF IRELAND' : 'Jerseys'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {COUNTIES.map((id) => {
          const name = mapById(id).name.split(', ').at(-1)!.replace('Co. ', '');
          const county = id.charAt(0).toUpperCase() + id.slice(1);
          const won = hasFlag(game, `jersey:${id}`);
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 bg-mist p-1 text-[8px] ${won ? 'border-gold' : 'border-frame'}`}
              title={name}
              aria-label={`${county} jersey${won ? '' : ' not won'}`}
            >
              <Jersey county={id} won={won} />
              {county}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/**
 * Skins: everyone you've beaten or done a side quest for, to walk around as. Locked ones are
 * silhouettes with a hint. The look shows on the map and the Trainer Card, in 2D.
 */
export function SkinsPanel({
  game,
  champion = false,
  onWear,
  onClose,
}: {
  game: StoryState;
  /** They hold the Online Champion's crown, so its skin is theirs while they keep it. */
  champion?: boolean;
  onWear: (id: string) => void;
  onClose: () => void;
}) {
  const wearing = lookOf(game, champion);
  const have = SKINS.filter((k) => hasSkin(game, k, champion)).length;
  return (
    <Panel title="SKINS" onClose={onClose}>
      <p className="text-[10px] leading-relaxed">
        Beat someone, or finish their side quest, to walk around as them. {have}/{SKINS.length}{' '}
        unlocked. The Online Champion’s skin is worn only by whoever holds the crown.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {SKINS.map((k) => {
          const open = hasSkin(game, k, champion);
          return (
            <button
              key={k.id}
              type="button"
              data-testid={`skin-${k.id}`}
              className={`pixel-btn flex flex-col items-center gap-1 px-1 py-1.5 ${k.online ? 'border-gold shadow-[0_0_10px_rgba(255,210,58,0.6)]' : ''}`}
              disabled={!open}
              aria-pressed={open ? wearing === k.id : undefined}
              aria-label={open ? k.name : `Locked. ${k.hint}`}
              onClick={() => {
                if (!open || wearing === k.id) return;
                playSfx('select');
                onWear(k.id);
              }}
            >
              {/* The Champion's skin is on show to everyone: it's worth winning. */}
              <Portrait look={k.id} locked={!open && !k.online} className="h-12 w-8" />
              <span className="text-center text-[8px] leading-tight">
                {open || k.online ? (k.id === DEFAULT_SKIN ? 'YOU' : k.name) : '?????'}
              </span>
              {!open && <span className="text-center text-[7px] leading-tight">{k.hint}</span>}
              {open && wearing === k.id && <span className="text-[7px]">WEARING</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] leading-relaxed">
        Skins show on the map in 2D, and on your Trainer Card.
      </p>
    </Panel>
  );
}

/** START → MISSIONS: every mission you've started and not finished, and what to do next. */
export function MissionsPanel({ game, onClose }: { game: StoryState; onClose: () => void }) {
  const open = openMissions(new Set(game.flags));
  return (
    <Panel title="MISSIONS" onClose={onClose}>
      {open.length === 0 && (
        <p className="text-[11px] leading-relaxed" data-testid="missions-empty">
          No missions open right now. Get out and talk to people: someone always needs a hand.
        </p>
      )}
      {open.map(({ mission, step, progress }) => (
        <div
          key={mission.id}
          className="flex flex-col gap-1 rounded-lg border-2 border-frame bg-mist px-2 py-1.5"
          data-testid={`mission-${mission.id}`}
        >
          <h3 className="flex justify-between gap-2 text-[11px] font-bold">
            <span>{mission.name}</span>
            {progress && (
              <span>
                {progress.got}/{progress.of}
              </span>
            )}
          </h3>
          <p className="text-[8px] leading-relaxed">{mission.about}</p>
          <p className="text-[9px] leading-relaxed">▶ {step.todo}</p>
          <p className="text-[8px] leading-relaxed">WHERE: {step.where}</p>
        </div>
      ))}
    </Panel>
  );
}

const JERSEY = 'M5 0h6l5 3-2 4-2-1v8H4V6L2 7 0 3z';

/** A county jersey: in its colours once won, a grey silhouette until then. */
function Jersey({ county, won }: { county: string; won: boolean }) {
  if (!won) {
    return (
      <svg viewBox="0 0 16 14" className="h-6 w-7" shapeRendering="crispEdges" aria-hidden="true">
        <path d={JERSEY} fill="var(--color-shell)" stroke="var(--color-frame)" strokeWidth="1" />
      </svg>
    );
  }
  const kit = jerseyOf(county);
  const clip = `jersey-${county}`;
  return (
    <svg
      viewBox="-0.5 -0.5 17 15"
      className="h-6 w-7"
      shapeRendering="crispEdges"
      aria-hidden="true"
      data-jersey={county}
    >
      <clipPath id={clip}>
        <path d={JERSEY} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <path d={JERSEY} fill={kit.body} />
        {bandsOf(kit).map(([y, h, colour]) => (
          <rect key={y} x="0" y={y} width="16" height={h} fill={colour} />
        ))}
        {/* Collar and cuffs. */}
        <path d="M6 0l2 2 2-2M0 3l2 4M16 3l-2 4" fill="none" stroke={kit.trim} strokeWidth="1.5" />
      </g>
      <path d={JERSEY} fill="none" stroke="var(--color-ink)" strokeWidth="1" />
    </svg>
  );
}

/** Michael D's kitchen table: a pint for every Ranemon. Pick one to start. */
export function StarterPanel({
  onChoose,
  uk = false,
}: {
  onChoose: (species: string) => void;
  /** Próvaí's pick in London: every Ranemon in its UK form, at a higher level. */
  uk?: boolean;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const level = uk ? UK_LEVEL : START_LEVEL;
  const look = (id: string) => {
    const c = speciesById(id);
    return uk ? { ...variantForm(c, UK), entry: UK_ENTRIES[id] ?? c.entry } : c;
  };
  const c = pick ? look(pick) : null;
  return (
    <Panel title={uk ? 'PICK YOUR UK RANEMON' : 'PICK YOUR RANEMON'}>
      <p className="text-[10px] leading-relaxed">
        {uk
          ? `Twenty pints on the table in the back of W.B Yates, one for each UK Ranemon. Whoever you pick starts at Lv${level}.`
          : `Sixteen pints on the table, one for each Ranemon. Whoever you pick starts at Lv${level}.`}
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
              <Sprite creature={uk ? look(r.id) : r} />
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
            {movesAt(c, level)
              .map((id) => moveById(id).name)
              .join(', ')}
            .{uk ? '' : ' Special move at Lv20.'}
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
