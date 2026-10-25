'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/asset';
import type { BattleState } from '@/lib/battle/engine';
import { createRoom, joinRoom, LinkError, RoomLink } from '@/lib/online/link';
import { moveById } from '@/lib/battle/moves';
import {
  entrantsOf,
  LEVEL_RULES,
  skinOf,
  trainerId,
  validateTeam,
  type LevelRule,
  type RoomView,
} from '@/lib/online/rules';
import { isPin } from '@/lib/story/cloud';
import { itemById } from '@/lib/story/items';
import type { Member } from '@/lib/story/party';
import { remoteSaves } from '@/lib/story/remote';
import { PLAYER_KEY } from '@/lib/story/state';
import type { QueueItem, Result } from '@/lib/ui/session';
import { BattleScreen, type RemoteBattle } from './BattleScreen';
import { SoundButton, useMusic } from './Sound';
import { MoveCard } from './MoveCard';
import { Sprite } from './Sprite';
import { isLook, Portrait } from './story/Portrait';

/** The save server's address, when this build has one (see `save-api/`). */
function saveApi(): string | undefined {
  try {
    return process.env.NEXT_PUBLIC_SAVE_API || undefined;
  } catch {
    return undefined;
  }
}
const SAVE_API = saveApi();

/** The room you're in, so closing the page and coming back carries on with it. */
const ROOM_KEY = 'ranemon.friend-room';

interface Stored {
  code: string;
  token: string;
  name: string;
}

function readRoom(): Stored | null {
  try {
    const s = JSON.parse(localStorage.getItem(ROOM_KEY) ?? 'null');
    return s && typeof s.code === 'string' && typeof s.token === 'string' ? s : null;
  } catch {
    return null;
  }
}

function writeRoom(s: Stored | null) {
  try {
    if (s) localStorage.setItem(ROOM_KEY, JSON.stringify(s));
    else localStorage.removeItem(ROOM_KEY);
  } catch {
    // Private windows can refuse storage; the battle still runs, without coming back to it.
  }
}

const noSubscribe = () => () => {};

interface Boot {
  /** The trainer name used last in this browser. */
  name: string;
  /** A code from a shared link. */
  room: string;
  stored: Stored | null;
}
let boot: Boot | null = null;

/** What the page starts from, read once. */
function readBoot(): Boot {
  if (boot) return boot;
  let name = '';
  try {
    name = localStorage.getItem(PLAYER_KEY) ?? '';
  } catch {
    // No storage: type the name in.
  }
  const room = new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? '';
  boot = { name, room, stored: readRoom() };
  return boot;
}

/** Coming back mid-battle: both Ranemon that are out come in again. */
function resumeEvents(state: BattleState): QueueItem[] {
  return ([1, 0] as const).flatMap((side) => {
    const team = state.teams[side];
    return team.battlers[team.active].hp > 0
      ? [{ kind: 'send-out' as const, side, index: team.active }]
      : [];
  });
}

type Screen =
  | { kind: 'login' }
  | { kind: 'home' }
  | { kind: 'room' }
  | { kind: 'battle'; link: RoomLink; start: { state: BattleState; events: QueueItem[] } }
  | { kind: 'done'; result: Result };

const RESULT_TEXT: Record<Result, string> = {
  win: 'You won!',
  loss: 'You lost.',
  draw: 'It’s a draw!',
  caught: 'You won!',
  fled: 'The battle ended.',
};

/**
 * Your team as it would fight under a rule, for the lobby. Tap a Ranemon for its moves, with
 * their types and power, and what it's holding.
 */
function TeamRow({ team, rule }: { team: Member[]; rule: LevelRule }) {
  const [open, setOpen] = useState<number | null>(null);
  const entrants = entrantsOf(team, rule);
  const shown = open === null ? null : { m: team[open], e: entrants[open] };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap justify-center gap-2" data-testid="friend-team">
        {entrants.map((e, i) => (
          <button
            key={i}
            type="button"
            className="flex w-14 flex-col items-center gap-0.5"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="h-12 w-12">
              <Sprite creature={e.creature} />
            </span>
            <span className="text-[9px] leading-tight">{e.creature.name}</span>
            <span className="text-[9px] opacity-75">Lv{e.level}</span>
          </button>
        ))}
      </div>
      {shown && (
        <div className="flex flex-col gap-1 text-left text-[10px]" data-testid="friend-moves">
          <span>
            {shown.e.creature.name}
            {shown.m.held ? ` · holds ${itemById(shown.m.held).name}` : ''}
          </span>
          {shown.m.moves.map((id) => {
            const t = moveById(id).type;
            return (
              <MoveCard key={id} id={id} stab={t !== null && shown.e.creature.types.includes(t)} />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** A trainer in the room, dressed in their Story mode skin. */
function Trainer({ name, skin }: { name: string; skin?: string }) {
  return (
    <span className="flex w-20 flex-col items-center gap-1" data-testid="room-trainer">
      <Portrait look={isLook(skin) ? skin : 'player'} className="h-12 w-8" />
      <span className="max-w-full truncate text-[10px]">{name}</span>
    </span>
  );
}

/**
 * Live battles against a friend, through the save server: sign in with your trainer name and
 * PIN, open a room and share its code (or join a friend's), and both press READY. Each of you
 * fights with your party from Story mode, as it was last saved online.
 */
export function FriendBattle() {
  const boot = useSyncExternalStore(noSubscribe, readBoot, () => null);
  const [screen, setScreen] = useState<Screen>({ kind: 'login' });
  const [typedName, setName] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [team, setTeam] = useState<Member[] | null>(null);
  const [skin, setSkin] = useState<string | undefined>(undefined);
  const [rule, setRule] = useState<LevelRule>('flat50');
  const [typedCode, setCode] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<RoomView | null>(null);
  const [copied, setCopied] = useState(false);
  const link = useRef<RoomLink | null>(null);
  useMusic(screen.kind === 'battle' ? undefined : 'title');
  const name = typedName ?? boot?.stored?.name ?? boot?.name ?? '';
  const code = typedCode ?? boot?.room ?? '';

  function open(stored: Stored, after: number) {
    writeRoom(stored);
    link.current?.stop();
    const l: RoomLink = new RoomLink(
      SAVE_API!,
      stored.code,
      stored.token,
      after,
      (v) => {
        setView(v);
        // The battle starts once both trainers are ready.
        const start = v.stage === 'live' && l.take();
        if (start)
          setScreen((s) =>
            s.kind === 'room'
              ? { kind: 'battle', link: l, start: { state: start.state, events: start.items } }
              : s,
          );
      },
      setNote,
    );
    link.current = l;
    l.start();
    return l;
  }

  // Back into a room you were in before closing the page.
  const stored = boot?.stored;
  useEffect(() => {
    if (!SAVE_API || !stored) return;
    const l = open(stored, -1);
    l.poll().then((v) => {
      if (!v || v.stage === 'over' || v.stage === 'closed') {
        l.stop();
        writeRoom(null);
        setNote(null);
        return;
      }
      if (v.stage === 'live' && v.state)
        setScreen({
          kind: 'battle',
          link: l,
          start: { state: v.state, events: resumeEvents(v.state) },
        });
      else setScreen({ kind: 'room' });
    });
    return () => l.stop();
  }, [stored]);

  const remote: RemoteBattle | null = useMemo(() => {
    if (screen.kind !== 'battle') return null;
    const l = screen.link;
    return { start: screen.start, send: (out) => void l.send(out), listen: (fn) => l.listen(fn) };
  }, [screen]);

  function leave() {
    link.current?.stop();
    link.current = null;
    setView(null);
    writeRoom(null);
  }

  async function signIn() {
    setBusy(true);
    setNote(null);
    try {
      const raw = await remoteSaves(SAVE_API!).load(trainerId(name), pin);
      if (!raw) {
        setNote('That name has no online save yet. Play Story mode with your PIN first.');
        return;
      }
      const save = JSON.parse(raw);
      const checked = validateTeam(save.party);
      if ('error' in checked) {
        setNote(`Your team can’t battle: ${checked.error}`);
        return;
      }
      setTeam(checked.team);
      setSkin(skinOf(save));
      try {
        localStorage.setItem(PLAYER_KEY, name.trim());
      } catch {
        // Fine without.
      }
      setScreen({ kind: 'home' });
    } catch (e) {
      setNote(
        e instanceof Error && e.message === 'pin'
          ? 'That PIN doesn’t match the name’s online save.'
          : e instanceof Error && e.message === 'locked'
            ? 'Too many wrong PINs for that name. Try again in 15 minutes.'
            : 'Couldn’t reach the save server. Check your connection.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function enter(how: 'create' | 'join') {
    setBusy(true);
    setNote(null);
    try {
      const joined =
        how === 'create'
          ? await createRoom(SAVE_API!, name, pin, rule)
          : await joinRoom(SAVE_API!, name, pin, code);
      setView(joined.view);
      open({ code: joined.view.code, token: joined.token, name: name.trim() }, joined.view.n);
      setScreen({ kind: 'room' });
    } catch (e) {
      setNote(e instanceof LinkError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!view) return;
    const url = `${window.location.origin}${asset('/friends/')}?room=${view.code}`;
    const text = `Battle me on Ranemon! Code ${view.code}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Ranemon', text, url });
      else {
        await navigator.clipboard.writeText(`${text}: ${url}`);
        setCopied(true);
      }
    } catch {
      // Cancelled.
    }
  }

  const header = (
    <>
      <SoundButton className="absolute right-2 top-2" />
      <h1 className="text-[34px] font-bold leading-tight text-gold [-webkit-text-stroke:2px_#1c4f96] [text-shadow:0_4px_0_#1c4f96,0_6px_0_#1c2026]">
        FRIEND
        <br />
        BATTLE
      </h1>
    </>
  );
  const shell = (children: React.ReactNode) => (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center text-ink">
      {header}
      {children}
      <p
        className="min-h-[2em] max-w-[300px] text-[11px] leading-relaxed text-frame"
        aria-live="polite"
      >
        {note}
      </p>
      <Link href="/" className="text-[11px] text-frame underline underline-offset-4">
        TITLE SCREEN
      </Link>
    </div>
  );

  if (!SAVE_API)
    return shell(
      <p className="max-w-[300px] text-[12px] leading-relaxed">
        Friend battles run on the save server, and this copy of the game doesn’t have one.
      </p>,
    );

  if (screen.kind === 'battle' && remote && view) {
    return (
      <BattleScreen
        key={view.code}
        remote={remote}
        difficulty="normal"
        foe={{ kind: 'trainer', name: view.foe?.name ?? 'Your friend' }}
        scene="gym"
        music="leader"
        onFinish={(result) => {
          leave();
          setScreen({ kind: 'done', result });
        }}
      />
    );
  }

  if (screen.kind === 'done')
    return shell(
      <>
        <p className="text-[20px] font-bold" data-testid="friend-result">
          {RESULT_TEXT[screen.result]}
        </p>
        <button
          type="button"
          className="pixel-btn menu-item w-full max-w-[260px] text-[14px]"
          onClick={() => setScreen({ kind: team ? 'home' : 'login' })}
        >
          BATTLE AGAIN
        </button>
      </>,
    );

  if (screen.kind === 'room') {
    const foe = view?.foe;
    const closed = view?.stage === 'closed';
    return shell(
      <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
        <p className="text-[12px]">ROOM CODE</p>
        <p
          className="dialog px-4 py-2 text-[28px] font-bold tracking-widest"
          data-testid="room-code"
        >
          {view?.code ?? '…'}
        </p>
        <div className="flex items-end justify-center gap-3">
          <Trainer name={view?.you.name ?? name.trim()} skin={view?.you.skin ?? skin} />
          <span className="pb-5 text-[12px]">VS</span>
          {foe ? (
            <Trainer name={foe.name} skin={foe.skin} />
          ) : (
            <span className="w-20 pb-5 text-[10px] opacity-60">???</span>
          )}
        </div>
        <p className="text-[11px]">
          {LEVEL_RULES.find((r) => r.id === view?.rule)?.label} ·{' '}
          {LEVEL_RULES.find((r) => r.id === view?.rule)?.about}
        </p>
        {closed ? (
          <p className="text-[13px]">This battle has closed.</p>
        ) : !foe ? (
          <>
            <p className="text-[13px]" data-testid="room-status">
              Waiting for a friend to join…
            </p>
            <button
              type="button"
              className="pixel-btn menu-item w-full text-[13px]"
              onClick={share}
            >
              {copied ? 'LINK COPIED' : 'SHARE THE CODE'}
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px]" data-testid="room-status">
              {view?.you.ready
                ? foe.ready
                  ? 'Starting…'
                  : `Waiting for ${foe.name} to press READY…`
                : `${foe.name} is here${foe.ready ? ' and ready' : ''}!`}
            </p>
            <p className="text-[10px] leading-relaxed text-frame">
              You fight with your party as it was last saved online. Make sure Story mode has saved
              (it does every 15 seconds while you play).
            </p>
            <button
              type="button"
              className="pixel-btn menu-item w-full text-[14px]"
              disabled={view?.you.ready}
              onClick={() => link.current?.ready()}
            >
              READY
            </button>
          </>
        )}
        <button
          type="button"
          className="pixel-btn w-full text-[12px]"
          onClick={() => {
            if (!closed) link.current?.send({ kind: 'forfeit' });
            leave();
            setNote(null);
            setScreen({ kind: team ? 'home' : 'login' });
          }}
        >
          {closed ? 'BACK' : 'LEAVE'}
        </button>
      </div>,
    );
  }

  if (screen.kind === 'home' && team)
    return shell(
      <div className="flex w-full max-w-[300px] flex-col gap-3">
        <div className="flex items-center justify-center gap-2">
          <Trainer name={name.trim()} skin={skin} />
        </div>
        <p className="text-[12px]">{name.trim()}’s team</p>
        <TeamRow team={team} rule={rule} />
        <div className="flex flex-col gap-1 text-left text-[12px]">
          LEVELS
          <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Levels">
            {LEVEL_RULES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={rule === r.id}
                className={`pixel-btn text-[11px] ${rule === r.id ? 'border-accent2' : ''}`}
                onClick={() => setRule(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] leading-relaxed text-frame">
            {LEVEL_RULES.find((r) => r.id === rule)?.about}
          </span>
        </div>
        <button
          type="button"
          className="pixel-btn menu-item text-[14px]"
          disabled={busy}
          onClick={() => enter('create')}
        >
          CHALLENGE A FRIEND
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            enter('join');
          }}
        >
          <input
            className="dialog min-w-0 flex-1 px-3 py-2 text-[16px] uppercase outline-none focus:border-accent2"
            value={code}
            maxLength={7}
            placeholder="BOKA-42"
            autoCapitalize="characters"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            data-testid="join-code"
            aria-label="Room code"
          />
          <button
            type="submit"
            className="pixel-btn menu-item text-[14px]"
            disabled={busy || !code}
          >
            JOIN
          </button>
        </form>
      </div>,
    );

  const ready = trainerId(name).length > 0 && isPin(pin) && !busy;
  return shell(
    <form
      className="flex w-full max-w-[260px] flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) signIn();
      }}
    >
      <p className="text-[11px] leading-relaxed text-frame">
        Battle a friend with your Story mode Ranemon. Sign in with your trainer name and PIN.
      </p>
      <label className="flex flex-col gap-1 text-left text-[12px]">
        TRAINER NAME
        <input
          className="dialog px-3 py-2 text-[16px] outline-none focus:border-accent2"
          value={name}
          maxLength={20}
          autoComplete="username"
          onChange={(e) => setName(e.target.value)}
          data-testid="friend-name"
        />
      </label>
      <label className="flex flex-col gap-1 text-left text-[12px]">
        PIN
        <input
          className="dialog px-3 py-2 text-[16px] outline-none focus:border-accent2"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          data-testid="friend-pin"
        />
      </label>
      <button type="submit" className="pixel-btn menu-item text-[14px]" disabled={!ready}>
        {busy ? 'SIGNING IN…' : 'SIGN IN'}
      </button>
    </form>,
  );
}
