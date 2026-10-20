'use client';

import { useState } from 'react';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { moveById } from '@/lib/battle/moves';
import { DEX } from '@/lib/battle/evolutions';
import { ROSTER } from '@/lib/battle/roster';
import { canUseOn, ITEMS, itemById, shopStock, type ItemId } from '@/lib/story/items';
import {
  creatureOf,
  expProgress,
  movesAt,
  PARTY_SIZE,
  speciesById,
  START_LEVEL,
  statsOf,
  type Member,
} from '@/lib/story/party';
import { hasFlag, type StoryState } from '@/lib/story/state';
import { COUNTIES, mapById } from '@/content/story/maps';

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
      <div className="flex items-center justify-between text-[10px]">
        <h2>{title}</h2>
        {onClose && (
          <button type="button" className="pixel-btn px-2 py-1 text-[8px]" onClick={onClose}>
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
    <span className="flex items-center gap-1 text-[6px]">
      {label}
      <span className="h-1.5 flex-1 border border-ink bg-paper">
        <span className="block h-full bg-ink" style={{ width: `${Math.round(value * 100)}%` }} />
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
        <span className="flex justify-between text-[8px]">
          <span className="truncate">{speciesById(m.species).name}</span>
          <span>Lv{m.level}</span>
        </span>
        <Bar value={m.hp / max} label="HP" />
        <span className="flex justify-between text-[6px]">
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
  onClose,
}: {
  game: StoryState;
  onLead: (index: number) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Panel title="PARTY" onClose={onClose}>
      <p className="text-[7px] leading-relaxed">
        The first Ranemon leads in battle and walks behind you.
      </p>
      {game.party.map((m, i) => (
        <div key={m.uid} className="flex flex-col gap-1">
          <MemberRow m={m} onClick={() => setOpen(open === i ? null : i)} pressed={open === i} />
          {open === i && (
            <div className="flex flex-col gap-1 border-2 border-ink p-2 text-[7px]">
              <span className="flex gap-1">
                {speciesById(m.species).types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
              {m.moves.map((id, j) => (
                <span key={id} className="flex justify-between">
                  <span>
                    {moveById(id).signature ? '* ' : ''}
                    {moveById(id).name}
                  </span>
                  <span>
                    PP {m.pp[j]}/{moveById(id).pp}
                  </span>
                </span>
              ))}
              {i > 0 && (
                <button
                  type="button"
                  className="pixel-btn menu-item mt-1 text-[8px]"
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
  onClose,
}: {
  game: StoryState;
  onUse: (item: ItemId, member: number) => void;
  onClose: () => void;
}) {
  const [pick, setPick] = useState<ItemId | null>(null);
  const items = ITEMS.filter((i) => (game.bag[i.id] ?? 0) > 0);
  if (pick) {
    const item = itemById(pick);
    return (
      <Panel title={item.name.toUpperCase()} onClose={() => setPick(null)}>
        <p className="text-[7px] leading-relaxed">Use it on which Ranemon?</p>
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
      {items.length === 0 && <p className="text-[8px]">The bag is empty.</p>}
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={i.use.kind === 'pint'}
          onClick={() => setPick(i.id)}
        >
          <span className="flex justify-between text-[8px]">
            <span>{i.name}</span>
            <span>×{game.bag[i.id]}</span>
          </span>
          <span className="text-[6px] leading-relaxed">
            {i.about}
            {i.use.kind === 'pint' ? ' Use it in a wild battle.' : ''}
          </span>
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
    <Panel title="CORNER SHOP" onClose={onClose}>
      <p className="text-[8px]">Money: €{game.money}</p>
      {shopStock(county).map((i) => (
        <button
          key={i.id}
          type="button"
          className="pixel-btn flex flex-col gap-1 px-2 py-1.5"
          disabled={game.money < (i.price ?? Infinity)}
          onClick={() => onBuy(i.id)}
        >
          <span className="flex justify-between text-[8px]">
            <span>{i.name}</span>
            <span>€{i.price}</span>
          </span>
          <span className="text-[6px] leading-relaxed">
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
      <p className="text-[7px] leading-relaxed">
        Tap a party member to send them to the chat, or someone in the chat to bring them along.
        They come back fully rested.
      </p>
      <h3 className="text-[8px]">
        PARTY {game.party.length}/{PARTY_SIZE}
      </h3>
      {game.party.map((m, i) => (
        <MemberRow key={m.uid} m={m} disabled={game.party.length <= 1} onClick={() => onSend(i)} />
      ))}
      <h3 className="text-[8px]">IN THE CHAT ({game.box.length})</h3>
      {game.box.length === 0 && <p className="text-[7px]">Nobody yet.</p>}
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

export function RanedexPanel({ game, onClose }: { game: StoryState; onClose: () => void }) {
  return (
    <Panel title="RANEDEX" onClose={onClose}>
      <p className="text-[8px]">
        Seen {game.seen.length} · Befriended {game.caught.length} / {DEX.length}
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {DEX.map((c, i) => {
          const seen = game.seen.includes(c.id);
          return (
            <div key={c.id} className="flex flex-col items-center gap-1 border-2 border-ink p-1">
              <span className="text-[6px]">{String(i + 1).padStart(3, '0')}</span>
              <span className="h-10 w-10">{seen ? <Sprite creature={c} /> : null}</span>
              <span className="text-[6px]">
                {seen ? c.name : '?????'}
                {game.caught.includes(c.id) ? ' ●' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function JerseysPanel({ game, onClose }: { game: StoryState; onClose: () => void }) {
  return (
    <Panel title="TRAINER CARD" onClose={onClose}>
      <p className="text-[8px] leading-relaxed">
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
              className={`flex flex-col items-center gap-1 border-2 border-ink p-1 text-[6px] ${won ? 'bg-ink text-paper' : ''}`}
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
      <p className="text-[7px] leading-relaxed">
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
            <span className="text-[6px]">{r.name}</span>
          </button>
        ))}
      </div>
      {c && (
        <div className="flex flex-col gap-1.5 border-2 border-ink p-2 text-[7px] leading-relaxed">
          <span className="flex items-center gap-1 text-[9px]">
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
            className="pixel-btn menu-item text-[9px]"
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
    <div className="dialog absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-3 text-[9px] leading-relaxed">
      <p>{question}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="pixel-btn menu-item text-[9px]" onClick={onYes}>
          {yes}
        </button>
        <button type="button" className="pixel-btn menu-item text-[9px]" onClick={onNo}>
          {no}
        </button>
      </div>
    </div>
  );
}

/** Credits: the road you walked, county by county, with your party. */
export function EndingPanel({ game, onDone }: { game: StoryState; onDone: () => void }) {
  return (
    <Panel title="CHAMPIONS OF IRELAND">
      <p className="text-[8px] leading-relaxed">
        In Front Square, Michael D presents the title. The Campanile bells ring out over Dublin.
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {game.party.map((m) => (
          <span key={m.uid} className="h-10 w-10">
            <Sprite creature={creatureOf(m)} />
          </span>
        ))}
      </div>
      <ol className="flex flex-col gap-1 text-[7px]">
        {[...COUNTIES, 'dublin', 'trinity'].map((id) => (
          <li key={id}>▶ {mapById(id).name}</li>
        ))}
      </ol>
      <p className="text-[7px] leading-relaxed">
        THE END. Thanks for playing Ranemon. B&S want a rematch at level 60: find them in the Long
        Room.
      </p>
      <button type="button" className="pixel-btn menu-item text-[9px]" onClick={onDone}>
        CONTINUE
      </button>
    </Panel>
  );
}
