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
import {
  canUseOn,
  ITEMS,
  itemById,
  pocketOf,
  POCKETS,
  priceOf,
  sellPrice,
  shopStock,
  whereToUse,
  type Item,
  type ItemId,
  type Pocket,
} from '@/lib/story/items';
import { KEY_ITEMS, type KeyItem } from '@/lib/story/keys';
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
import { COUNTIES, mapById, outsideOf } from '@/content/story/maps';
import {
  bandsOf,
  CLUB_SHORT,
  clubJerseyOf,
  columnsOf,
  jerseyOf,
  type JerseyKit,
} from '@/content/story/jerseys';
import { DEPARTURES, isRunning, type Departure } from '@/content/story/station';
import { FIXTURE_LIST, KX_DEPARTURES, nextClub, type KxDeparture } from '@/content/story/premier';
import { RAILCARD } from '@/content/story/kneecap';
import { paintCrest } from './crests';
import type { ClubId } from '@/lib/story/world';
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

/** The D-pad, A and B, handed to a menu while it's open (the Ranedex, the BAG, a shop). */
export interface MenuNav {
  dir: (dir: Dir) => void;
  a: () => void;
  /** B: back a step inside the menu. False when there's nowhere further back, so B closes it. */
  b: () => boolean;
}

/** Hands `nav` to `navRef` while the menu is open, fresh on every render. */
function useMenuNav(navRef: React.RefObject<MenuNav | null> | undefined, nav: MenuNav) {
  useEffect(() => {
    if (!navRef) return;
    navRef.current = nav;
    return () => {
      navRef.current = null;
    };
  });
}

/** Keeps the row the D-pad is on in view. */
function useCursorInView(box: React.RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    box.current?.querySelector('[data-cursor="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [box, key]);
}

const CURSOR = 'outline outline-3 outline-offset-1 outline-accent2';

/** A row of tabs along the top of a menu. */
function Tabs<T extends string>({
  tabs,
  value,
  onPick,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onPick: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={t.id === value}
          data-testid={`tab-${t.id}`}
          className={`pixel-btn flex flex-1 flex-col items-center px-0.5 py-1 text-[9px] leading-tight ${t.count === 0 && t.id !== value ? 'opacity-50' : ''}`}
          onClick={() => onPick(t.id)}
        >
          <span>{t.label}</span>
          {t.count !== undefined && <span className="text-[8px]">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** What happened, in a little box: the last thing used or sold. */
function Note({ lines }: { lines: string[] | null }) {
  if (!lines?.length) return null;
  return (
    <div
      className="rounded-lg border-2 border-accent2 bg-mist px-2 py-1 text-[10px] leading-relaxed"
      role="status"
      data-testid="bag-note"
    >
      {lines.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

type BagTab = Pocket | 'key';

type BagRow = { kind: 'item'; item: Item } | { kind: 'key'; key: KeyItem };

export function BagPanel({
  game,
  onUse,
  onUseKey,
  onClose,
  navRef,
}: {
  game: StoryState;
  /**
   * Uses an item on a party member. Returns what happened when the BAG stays open (food, or
   * something to hold), so you can carry on using things; nothing when the story takes over.
   */
  onUse: (item: ItemId, member: number) => string[] | void;
  onUseKey: (flag: string) => void;
  onClose: () => void;
  navRef?: React.RefObject<MenuNav | null>;
}) {
  const keys = KEY_ITEMS.filter(
    (k) => hasFlag(game, k.flag) && !(k.goneIf && hasFlag(game, k.goneIf)),
  );
  const items = ITEMS.filter((i) => (game.bag[i.id] ?? 0) > 0);
  const rowsOf = (tab: BagTab): BagRow[] =>
    tab === 'key'
      ? keys.map((key) => ({ kind: 'key', key }))
      : items.filter((i) => pocketOf(i) === tab).map((item) => ({ kind: 'item', item }));
  const tabs: { id: BagTab; label: string; count: number }[] = [
    ...POCKETS.map((p) => ({ id: p.id, label: p.label, count: rowsOf(p.id).length })),
    { id: 'key' as const, label: 'KEY', count: keys.length },
  ];
  const [tab, setTab] = useState<BagTab>(() => tabs.find((t) => t.count > 0)?.id ?? 'food');
  const [cursor, setCursor] = useState(0);
  const [picked, setPick] = useState<ItemId | null>(null);
  // Out of one: back to the list.
  const pick = picked && game.bag[picked] ? picked : null;
  const [member, setMember] = useState(0);
  const [note, setNote] = useState<string[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const cap = levelCap(game);
  const rows = rowsOf(tab);
  const at = Math.min(cursor, Math.max(0, rows.length - 1));
  const row = rows[at];

  useCursorInView(box, `${tab}:${at}:${pick}:${member}`);

  /** Whether the row can be used from here, and what its button says. */
  const action = (r: BagRow | undefined): { label: string; ok: boolean } => {
    if (!r) return { label: 'USE', ok: false };
    if (r.kind === 'key') return { label: 'USE', ok: !!r.key.usable };
    const kind = r.item.use.kind;
    if (kind === 'pint' || kind === 'vape') return { label: 'IN BATTLE ONLY', ok: false };
    const someone = game.party.some((m) => canUseOn(r.item, m, cap.level));
    const verb = kind === 'hold' ? 'GIVE' : 'USE';
    return someone ? { label: verb, ok: true } : { label: 'NOBODY NEEDS IT', ok: false };
  };

  const activate = (r: BagRow | undefined) => {
    if (!r || !action(r).ok) return;
    playSfx('select');
    setNote(null);
    if (r.kind === 'key') return onUseKey(r.key.flag);
    setPick(r.item.id);
    const first = game.party.findIndex((m) => canUseOn(r.item, m, cap.level));
    setMember(Math.max(0, first));
  };

  const spendOn = (i: number) => {
    if (!pick || !canUseOn(itemById(pick), game.party[i], cap.level)) return;
    const lines = onUse(pick, i);
    if (lines) setNote(lines);
  };

  const switchTab = (t: BagTab) => {
    playSfx('blip');
    setTab(t);
    setCursor(0);
    setNote(null);
  };

  useMenuNav(navRef, {
    dir: (dir) => {
      if (pick) {
        if (dir === 'up' || dir === 'down') {
          const to = member + (dir === 'up' ? -1 : 1);
          if (to < 0 || to >= game.party.length) return;
          playSfx('blip');
          setMember(to);
        }
        return;
      }
      if (dir === 'left' || dir === 'right') {
        const i = tabs.findIndex((t) => t.id === tab);
        switchTab(tabs[(i + (dir === 'left' ? -1 : 1) + tabs.length) % tabs.length].id);
        return;
      }
      const to = at + (dir === 'up' ? -1 : 1);
      if (to < 0 || to >= rows.length) return;
      playSfx('blip');
      setCursor(to);
    },
    a: () => (pick ? spendOn(member) : activate(row)),
    b: () => {
      if (!pick) return false;
      setPick(null);
      return true;
    },
  });

  if (pick) {
    const item = itemById(pick);
    return (
      <Panel title={item.name.toUpperCase()} onClose={() => setPick(null)}>
        <div ref={box} className="flex flex-col gap-2">
          <p className="flex justify-between text-[10px] leading-relaxed">
            <span>
              {item.use.kind === 'hold'
                ? 'Give it to which Ranemon to hold?'
                : 'Use it on which Ranemon?'}
            </span>
            <span data-testid="pick-count">×{game.bag[pick] ?? 0}</span>
          </p>
          {item.use.kind === 'level' && <CapNote cap={cap} />}
          <Note lines={note} />
          {game.party.map((m, i) => (
            <div
              key={m.uid}
              data-cursor={i === member}
              className={`flex flex-col rounded-[10px] ${i === member ? CURSOR : ''}`}
            >
              <MemberRow
                m={m}
                disabled={!canUseOn(item, m, cap.level)}
                onClick={() => {
                  setMember(i);
                  spendOn(i);
                }}
              />
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  const act = action(row);
  return (
    <Panel title="BAG" onClose={onClose}>
      <Tabs label="Pockets" tabs={tabs} value={tab} onPick={switchTab} />
      <p className="text-[9px] leading-relaxed opacity-75">
        {tab === 'key'
          ? 'Things you keep for good. They never run out.'
          : POCKETS.find((p) => p.id === tab)?.about}
      </p>
      <Note lines={note} />
      <div
        ref={box}
        className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1 py-1"
        role="listbox"
        aria-label="Items"
      >
        {rows.length === 0 && (
          <p className="py-2 text-[11px]">
            {items.length === 0 && !keys.length ? 'The bag is empty.' : 'Nothing in here.'}
          </p>
        )}
        {rows.map((r, i) => {
          const id = r.kind === 'item' ? r.item.id : r.key.flag;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={i === at}
              data-cursor={i === at}
              data-testid={r.kind === 'item' ? `item-${id}` : `key-${id}`}
              className={`pixel-btn menu-item flex justify-between px-2 py-1.5 text-left text-[11px] ${i === at ? CURSOR : ''}`}
              onClick={() => (i === at ? activate(r) : setCursor(i))}
            >
              <span>{r.kind === 'item' ? r.item.name : r.key.name}</span>
              {r.kind === 'item' && <span>×{game.bag[r.item.id]}</span>}
            </button>
          );
        })}
      </div>
      {row && (
        <div
          className="flex shrink-0 items-end gap-2 rounded-lg border-2 border-frame bg-mist p-2"
          data-testid="bag-info"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-bold">
              {row.kind === 'item' ? row.item.name : row.key.name}
            </p>
            <p className="text-[9px] leading-relaxed">
              {row.kind === 'item' ? `${row.item.about} ${whereToUse(row.item)}` : row.key.about}
            </p>
          </div>
          {(row.kind === 'item' || row.key.usable) && (
            <button
              type="button"
              className="pixel-btn shrink-0 px-3 py-1 text-[11px]"
              disabled={!act.ok}
              onClick={() => activate(row)}
              data-testid="bag-use"
            >
              {act.label}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

/** Thousands with commas, as prices are shown: €1,050. */
const euro = (n: number) => `€${n.toLocaleString('en-IE')}`;

/** The bag's items, pocket by pocket, as the SELL list shows them. */
const byPocket = (game: StoryState) =>
  POCKETS.flatMap((p) => ITEMS.filter((i) => pocketOf(i) === p.id && (game.bag[i.id] ?? 0) > 0));

export function ShopPanel({
  game,
  stall = null,
  onBuy,
  onSell,
  onClose,
  navRef,
}: {
  game: StoryState;
  /** Someone's own stall instead of Vapes. */
  stall?: Stall | null;
  onBuy: (item: ItemId) => void;
  /** Sells `count` of an item for `sellPrice` each. */
  onSell: (item: ItemId, count: number) => void;
  onClose: () => void;
  navRef?: React.RefObject<MenuNav | null>;
}) {
  const stock = stall
    ? stall.stock.map((s) => itemById(s.item))
    : shopStock(mapById(game.map).county);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [cursor, setCursor] = useState(0);
  /** The item being sold, how many, and whether you're being asked to confirm. */
  const [selling, setSelling] = useState<ItemId | null>(null);
  const [qty, setQty] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState<string[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const sellable = byPocket(game);
  const list = tab === 'buy' ? stock : sellable;
  const at = Math.min(cursor, Math.max(0, list.length - 1));
  useCursorInView(box, `${tab}:${at}`);

  const have = selling ? (game.bag[selling] ?? 0) : 0;
  const each = selling ? (sellPrice(selling) ?? 0) : 0;
  const n = Math.max(1, Math.min(qty, have));

  const buy = (i: number) => {
    const item = stock[i];
    if (!item || game.money < priceOf(item.id, stall)) return;
    playSfx('select');
    setNote(null);
    onBuy(item.id);
  };
  const startSell = (i: number) => {
    const item = sellable[i];
    if (!item || sellPrice(item.id) === null) return;
    playSfx('select');
    setNote(null);
    setSelling(item.id);
    setQty(1);
    setConfirm(false);
  };
  const doSell = () => {
    if (!selling) return;
    playSfx('select');
    const name = itemById(selling).name;
    onSell(selling, n);
    setNote([`Sold ${n} × ${name} for ${euro(each * n)}.`]);
    setSelling(null);
    setConfirm(false);
  };
  const switchTab = (t: 'buy' | 'sell') => {
    playSfx('blip');
    setTab(t);
    setCursor(0);
    setNote(null);
  };
  const bump = (d: number) => {
    playSfx('blip');
    setQty(Math.max(1, Math.min(have, n + d)));
  };

  useMenuNav(navRef, {
    dir: (dir) => {
      if (selling) {
        if (!confirm) bump(dir === 'up' || dir === 'right' ? 1 : -1);
        return;
      }
      if (dir === 'left' || dir === 'right') return switchTab(tab === 'buy' ? 'sell' : 'buy');
      const to = at + (dir === 'up' ? -1 : 1);
      if (to < 0 || to >= list.length) return;
      playSfx('blip');
      setCursor(to);
    },
    a: () => {
      if (selling) return confirm ? doSell() : setConfirm(true);
      if (tab === 'buy') buy(at);
      else startSell(at);
    },
    b: () => {
      if (confirm) setConfirm(false);
      else if (selling) setSelling(null);
      else return false;
      return true;
    },
  });

  // In Britain the shop is a Vapes & More.
  const title = stall?.name ?? (outsideOf(mapById(game.map)).uk ? 'VAPES & MORE' : 'VAPES');

  if (selling) {
    const item = itemById(selling);
    return (
      <Panel title={`SELL ${item.name.toUpperCase()}`} onClose={() => setSelling(null)}>
        <p className="text-[11px]">Money: €{game.money}</p>
        <p className="text-[10px] leading-relaxed">
          You have {have}. The shop pays {euro(each)} each.
        </p>
        {!confirm ? (
          <>
            <div className="flex items-center justify-center gap-2" data-testid="sell-qty">
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[13px]"
                disabled={n <= 1}
                onClick={() => bump(-1)}
                aria-label="One fewer"
              >
                −
              </button>
              <span className="min-w-12 text-center text-[15px] font-bold" data-testid="sell-count">
                ×{n}
              </span>
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[13px]"
                disabled={n >= have}
                onClick={() => bump(1)}
                aria-label="One more"
              >
                +
              </button>
              <button
                type="button"
                className="pixel-btn px-2 py-1 text-[10px]"
                disabled={n >= have}
                onClick={() => {
                  playSfx('blip');
                  setQty(have);
                }}
              >
                ALL
              </button>
            </div>
            <p className="text-center text-[11px]">For {euro(each * n)}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[11px]"
                onClick={() => setSelling(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[11px]"
                onClick={() => setConfirm(true)}
                data-testid="sell-ok"
              >
                SELL
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border-2 border-frame bg-mist p-2">
            <p className="text-[11px] leading-relaxed" data-testid="sell-confirm">
              Sell {n} × {item.name} for {euro(each * n)}?
              {n === have && pocketOf(item) === 'pints'
                ? ' That’s all your pints of this kind.'
                : ''}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[11px]"
                onClick={() => setConfirm(false)}
              >
                NO
              </button>
              <button
                type="button"
                className="pixel-btn px-3 py-1 text-[11px]"
                onClick={doSell}
                data-testid="sell-yes"
              >
                YES
              </button>
            </div>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <Panel title={title} onClose={onClose}>
      <Tabs
        label="Buy or sell"
        tabs={[
          { id: 'buy', label: 'BUY' },
          { id: 'sell', label: 'SELL' },
        ]}
        value={tab}
        onPick={switchTab}
      />
      <p className="text-[11px]">Money: €{game.money}</p>
      <Note lines={note} />
      <div ref={box} className="flex flex-col gap-1.5">
        {tab === 'buy' &&
          stock.map((i, j) => (
            <button
              key={i.id}
              type="button"
              data-cursor={j === at}
              className={`pixel-btn flex flex-col gap-1 px-2 py-1.5 ${j === at ? CURSOR : ''}`}
              disabled={game.money < priceOf(i.id, stall)}
              onClick={() => {
                setCursor(j);
                buy(j);
              }}
              data-testid={`buy-${i.id}`}
            >
              <span className="flex justify-between text-[11px]">
                <span>{i.name}</span>
                <span>€{priceOf(i.id, stall)}</span>
              </span>
              <span className="text-left text-[8px] leading-relaxed">
                {i.about} You have {game.bag[i.id] ?? 0}.
              </span>
            </button>
          ))}
        {tab === 'sell' && (
          <>
            <p className="text-[9px] leading-relaxed opacity-75">
              The shop pays half what it charges. Key items, and one-of-a-kind things you were given
              or found, can’t be sold.
            </p>
            {sellable.length === 0 && <p className="text-[11px]">Nothing to sell.</p>}
            {sellable.map((i, j) => {
              const price = sellPrice(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  data-cursor={j === at}
                  className={`pixel-btn flex justify-between px-2 py-1.5 text-[11px] ${j === at ? CURSOR : ''}`}
                  disabled={price === null}
                  onClick={() => {
                    setCursor(j);
                    startSell(j);
                  }}
                  data-testid={`sell-${i.id}`}
                >
                  <span className="text-left">
                    {i.name} <span className="text-[9px]">×{game.bag[i.id]}</span>
                  </span>
                  <span>{price === null ? 'CAN’T SELL' : `${euro(price)} each`}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
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

/** Ranedex tiles per row, for moving up and down with the D-pad. */
const DEX_COLUMNS = 4;

export function RanedexPanel({
  game,
  onClose,
  navRef,
}: {
  game: StoryState;
  onClose: () => void;
  navRef?: React.RefObject<MenuNav | null>;
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
      <JerseyGroup
        title="IRELAND"
        testId="jerseys-ireland"
        columns="grid-cols-3"
        jerseys={COUNTIES.map((id) => {
          const county = id.charAt(0).toUpperCase() + id.slice(1);
          return {
            id,
            label: county,
            title: mapById(id).name.split(', ').at(-1)!.replace('Co. ', ''),
            kit: jerseyOf(id),
            won: hasFlag(game, `jersey:${id}`),
          };
        })}
      />
      <JerseyGroup
        title="UK · PREMIER LEAGUE"
        testId="jerseys-uk"
        columns="grid-cols-4"
        jerseys={FIXTURE_LIST.map((f) => ({
          id: `pl-${f.id}`,
          label: CLUB_SHORT[f.id],
          title: `${f.club}, ${f.ground}`,
          kit: clubJerseyOf(f.id),
          won: hasFlag(game, f.flag),
          crest: f.id,
        }))}
      />
    </Panel>
  );
}

/** One country's jerseys on the Trainer Card, with how many of them you've won. */
function JerseyGroup({
  title,
  testId,
  columns,
  jerseys,
}: {
  title: string;
  testId: string;
  columns: string;
  jerseys: {
    id: string;
    label: string;
    title: string;
    kit: JerseyKit;
    won: boolean;
    crest?: ClubId;
  }[];
}) {
  const won = jerseys.filter((j) => j.won).length;
  return (
    <section className="flex flex-col gap-1" data-testid={testId}>
      <h3 className="flex justify-between border-b-2 border-frame text-[10px] font-bold">
        <span>{title}</span>
        <span>
          {won}/{jerseys.length}
        </span>
      </h3>
      <div className={`grid ${columns} gap-1.5`}>
        {jerseys.map((j) => (
          <div
            key={j.id}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 bg-mist p-1 text-center text-[8px] leading-tight ${j.won ? 'border-gold' : 'border-frame'}`}
            title={j.title}
            aria-label={`${j.label} jersey${j.won ? '' : ' not won'}`}
          >
            <Jersey id={j.id} kit={j.kit} won={j.won} crest={j.crest} />
            {j.label}
          </div>
        ))}
      </div>
    </section>
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

/**
 * A jersey: in its colours once won, a grey silhouette until then. A club jersey has its crest on
 * the chest.
 */
function Jersey({
  id,
  kit,
  won,
  crest,
}: {
  id: string;
  kit: JerseyKit;
  won: boolean;
  crest?: ClubId;
}) {
  if (!won) {
    return (
      <svg viewBox="0 0 16 14" className="h-8 w-9" shapeRendering="crispEdges" aria-hidden="true">
        <path d={JERSEY} fill="var(--color-shell)" stroke="var(--color-frame)" strokeWidth="1" />
      </svg>
    );
  }
  const clip = `jersey-${id}`;
  return (
    <span className="relative h-8 w-9">
      <svg
        viewBox="-0.5 -0.5 17 15"
        className="h-8 w-9"
        shapeRendering="crispEdges"
        aria-hidden="true"
        data-jersey={id}
      >
        <clipPath id={clip}>
          <path d={JERSEY} />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <path d={JERSEY} fill={kit.body} />
          {bandsOf(kit).map(([y, h, colour]) => (
            <rect key={`b${y}`} x="0" y={y} width="16" height={h} fill={colour} />
          ))}
          {columnsOf(kit).map(([x, w, colour]) => (
            <rect key={`c${x}`} x={x} y="0" width={w} height="14" fill={colour} />
          ))}
          {/* Collar and cuffs. */}
          <path
            d="M6 0l2 2 2-2M0 3l2 4M16 3l-2 4"
            fill="none"
            stroke={kit.trim}
            strokeWidth="1.5"
          />
        </g>
        <path d={JERSEY} fill="none" stroke="var(--color-ink)" strokeWidth="1" />
      </svg>
      {/* The crest over the heart, on the wearer's left. */}
      {crest && (
        <span className="absolute left-[19px] top-[8px]">
          <Crest club={crest} size={11} />
        </span>
      )}
    </span>
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

/** A club's crest, drawn on a little canvas of its own. */
function Crest({ club, size = 20, dim = false }: { club: ClubId; size?: number; dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, size * 2, size * 2);
    paintCrest(c, club, size, size, size * 2);
  }, [club, size]);
  return (
    <canvas
      ref={ref}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size, opacity: dim ? 0.35 : 1 }}
      aria-hidden
    />
  );
}

/**
 * The departures board at King's Cross: every platform, where it goes and which grounds it's
 * for, each club's crest greyed out once you've its jersey, and your next match's train on top
 * of the list in gold. Pick one to buy a ticket.
 */
export function KingsCrossPanel({
  game,
  onPick,
  onClose,
}: {
  game: StoryState;
  onPick: (d: KxDeparture) => void;
  onClose: () => void;
}) {
  const flags = new Set(game.flags);
  const next = nextClub(flags);
  return (
    <Panel title="KING’S CROSS DEPARTURES" onClose={onClose}>
      {next && (
        <p className="rounded bg-[#f8d030] px-2 py-1 text-[10px] leading-relaxed text-ink">
          NEXT MATCH ({next.n} of 12): {next.club} at {next.ground}. Platform {next.platform},{' '}
          {next.to}.
        </p>
      )}
      <div className="flex flex-col gap-1.5 rounded bg-[#141418] p-2 font-mono text-[#f8b820]">
        {KX_DEPARTURES.map((d) => {
          const shut = d.railcard && !flags.has(RAILCARD);
          const done = d.clubs.every((k) => flags.has(k.flag));
          const isNext = next?.map === d.map;
          const status = isNext ? 'NEXT MATCH' : done ? 'ALL WON' : shut ? 'RAILCARD' : 'ON TIME';
          return (
            <button
              key={d.map}
              type="button"
              data-testid={`kx-${d.map}`}
              className={`pixel-btn flex items-center gap-2 px-2 py-1.5 text-left ${isNext ? 'outline outline-2 outline-[#f8d030]' : ''}`}
              onClick={() => onPick(d)}
            >
              <span className="w-5 text-center text-[13px] font-bold">{d.platform}</span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[11px]">{d.to}</span>
                <span className="text-[8px]">
                  {d.clubs.map((k) => `${k.ground} (${k.club})`).join(', ')}
                </span>
              </span>
              <span className="flex gap-0.5">
                {d.clubs.map((k) => (
                  <Crest key={k.id} club={k.id} size={16} dim={flags.has(k.flag)} />
                ))}
              </span>
              <span className="w-12 text-right text-[8px]">{status}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] leading-relaxed">
        Play the clubs in order, smallest to biggest. Each ground’s turnstiles open once you’ve
        beaten the club before it.
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
