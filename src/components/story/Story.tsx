'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { BattleScreen, type BagEntry } from '@/components/BattleScreen';
import { MS_PER_CHAR, TypedText } from '@/components/TypedText';
import { mapById } from '@/content/story/maps';
import { teamOf, trainerById } from '@/content/story/trainers';
import type { Difficulty } from '@/lib/battle/cpu';
import type { BattleState, Entrant } from '@/lib/battle/engine';
import { applyItem, ITEMS, itemById, type ItemId } from '@/lib/story/items';
import {
  blueGhost,
  catchRate,
  expProgress,
  makeMember,
  speciesById,
  toEntrant,
} from '@/lib/story/party';
import {
  beatFlag,
  canFight,
  follower,
  fromGroupChat,
  give,
  hasFlag,
  healParty,
  load,
  makeLead,
  newGame,
  recruit,
  save,
  SAVE_KEY,
  see,
  setFlag,
  settleBattle,
  take,
  toGroupChat,
  type StoryState,
} from '@/lib/story/state';
import {
  DELTA,
  doorIndex,
  ENCOUNTER_RATE,
  ENCOUNTER_TILES,
  find,
  isPresent,
  marker,
  npcsOf,
  OPPOSITE,
  pickWild,
  spottedBy,
  tileAt,
  type Dir,
  type Step,
} from '@/lib/story/world';
import type { Foe } from '@/lib/ui/playback';
import type { Result } from '@/lib/ui/session';
import { Overworld, type Held, type Position } from './Overworld';
import {
  BagPanel,
  Choice,
  EndingPanel,
  GroupChatPanel,
  JerseysPanel,
  PartyPanel,
  RanedexPanel,
  ShopPanel,
  StarterPanel,
} from './Panels';

/** Script steps plus the story screen's own: the pub's Group Chat question. */
type Run = Step | { do: 'offer-chat' };

type Overlay =
  | 'menu'
  | 'party'
  | 'bag'
  | 'shop'
  | 'chat'
  | 'dex'
  | 'card'
  | 'starter'
  | 'offer-chat'
  | 'ending'
  | null;

interface Fight {
  teams: [Entrant[], Entrant[]];
  foe: Foe;
  ai: Difficulty;
  trainer: string | null;
  key: number;
}

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const noSubscribe = () => () => {};

const ghostFlag = (map: string, x: number, y: number) => `ghost:${map}:${x}:${y}`;
const challenge = (trainer: string): Run[] => [
  { do: 'say', text: trainerById(trainer).before },
  { do: 'battle', trainer },
];

export function Story() {
  const [game, setGame] = useState<StoryState | null>(null);
  // The save as stored. Read through the store so the server render (no save) hydrates cleanly.
  const raw = useSyncExternalStore(
    noSubscribe,
    () => {
      try {
        return storage()?.getItem(SAVE_KEY) ?? null;
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  const saved = useMemo(
    () => (raw === undefined ? undefined : load({ getItem: () => raw })),
    [raw],
  );
  const [queue, setQueue] = useState<Run[]>([]);
  /** The line in the text box: `n` restarts the typing, `full` skips to the end of it. */
  const [line, setLine] = useState<{ text: string; n: number; full?: boolean } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [fight, setFight] = useState<Fight | null>(null);
  const [flash, setFlash] = useState(false);
  const [exclaim, setExclaim] = useState<number | null>(null);
  const [faces, setFaces] = useState<Record<number, Dir>>({});
  const held = useRef<Held>({ dir: null, b: false });

  const persist = useCallback((g: StoryState) => {
    save(storage(), g);
  }, []);

  /** Runs script steps until one needs the player: a line of text, a battle or a menu. */
  const run = useCallback(
    (start: StoryState, steps: Run[]) => {
      let g = start;
      const q = [...steps];
      let n = 0;
      while (q.length) {
        const s = q.shift()!;
        switch (s.do) {
          case 'say':
            setGame(g);
            setQueue(q);
            setLine({ text: s.text, n: Date.now() + n++ / 1000 });
            return;
          case 'give': {
            const count = s.count ?? 1;
            g = give(g, s.item, count);
            const name = itemById(s.item).name;
            q.unshift({ do: 'say', text: `You got ${count > 1 ? `${count} × ` : 'a '}${name}!` });
            break;
          }
          case 'flag':
            g = setFlag(g, s.flag);
            break;
          case 'if':
            q.unshift(...(hasFlag(g, s.flag) ? s.then : (s.else ?? [])));
            break;
          case 'heal':
            g = healParty(g);
            break;
          case 'pub':
            g = { ...healParty(g), pub: { map: g.map, x: g.x, y: g.y } };
            q.unshift(
              { do: 'say', text: 'BARMAN: Sit down there. I’ll look after your lot.' },
              { do: 'say', text: 'Your Ranemon are fighting fit again!' },
              { do: 'offer-chat' },
            );
            break;
          case 'offer-chat':
          case 'shop':
          case 'starter':
          case 'ending':
            setGame(g);
            setQueue(q);
            setLine(null);
            setOverlay(s.do === 'offer-chat' ? 'offer-chat' : s.do === 'shop' ? 'shop' : s.do);
            return;
          case 'battle': {
            const t = trainerById(s.trainer);
            const team = teamOf(t, g.starter).map(([id, level], i) =>
              toEntrant(makeMember(id, level, -1 - i)),
            );
            for (const e of team) g = see(g, e.creature.id);
            setGame(g);
            setQueue(q);
            setLine(null);
            setFight({
              teams: [g.party.map(toEntrant), team],
              foe: t.rival ? { kind: 'rival' } : { kind: 'trainer', name: t.name },
              ai: t.ai,
              trainer: t.id,
              key: Date.now(),
            });
            return;
          }
        }
      }
      setGame(g);
      setQueue([]);
      setLine(null);
      persist(g);
    },
    [persist],
  );

  /** A, or tapping the text box: finish typing the line, then go on to the next. */
  const advance = useCallback(() => {
    if (!game || !line) return;
    if (!line.full && Date.now() - line.n < line.text.length * MS_PER_CHAR) {
      setLine({ ...line, full: true });
      return;
    }
    run(game, queue);
  }, [game, line, queue, run]);

  const busy =
    !game || line !== null || overlay !== null || fight !== null || flash || exclaim !== null;

  function startGame(g: StoryState, fresh: boolean) {
    const map = mapById(g.map);
    const intro =
      fresh && map.enter ? [...map.enter, { do: 'flag' as const, flag: `visited:${map.id}` }] : [];
    run(g, intro);
  }

  // ---------- walking ----------

  function onStep(to: Position) {
    if (!game) return;
    const map = mapById(game.map);
    const width = map.rows[0].length;
    if (to.x < 0 || to.x >= width) {
      const nextId = to.x < 0 ? map.west! : map.east!;
      const next = mapById(nextId);
      const at = marker(next, to.x < 0 ? '>' : '@');
      let g: StoryState = { ...game, map: nextId, ...at, face: to.face };
      const steps: Run[] = [];
      if (next.enter && !hasFlag(g, `visited:${nextId}`)) steps.push(...next.enter);
      g = setFlag(g, `visited:${nextId}`);
      persist(g);
      run(g, steps);
      return;
    }
    let g: StoryState = { ...game, ...to, steps: game.steps + 1 };

    const ghost = find(map, '*').some((p) => p.x === to.x && p.y === to.y);
    if (ghost && !hasFlag(g, ghostFlag(map.id, to.x, to.y))) {
      g = setFlag(g, ghostFlag(map.id, to.x, to.y));
      run(g, [
        { do: 'say', text: 'Something glints in the grass…' },
        { do: 'give', item: 'blue-ghost' },
      ]);
      return;
    }

    const flags = new Set(g.flags);
    const spotter = spottedBy(map, to.x, to.y, flags, (t) => hasFlag(g, beatFlag(t)));
    if (spotter) {
      setGame(g);
      setExclaim(spotter.index);
      setTimeout(() => {
        setExclaim(null);
        run(g, challenge(spotter.item.trainer!));
      }, 700);
      return;
    }

    if (
      map.wild &&
      ENCOUNTER_TILES.has(tileAt(map, to.x, to.y)) &&
      canFight(g) &&
      Math.random() < ENCOUNTER_RATE
    ) {
      const { species, level } = pickWild(map.wild, Math.random(), Math.random());
      g = see(g, species);
      setGame(g);
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setFight({
          teams: [g.party.map(toEntrant), [toEntrant(makeMember(species, level, -1))]],
          foe: { kind: 'wild' },
          ai: 'easy',
          trainer: null,
          key: Date.now(),
        });
      }, 650);
      return;
    }
    setGame(g);
  }

  /** What's in front of you, for A or walking into a door. */
  function interact(x: number, y: number, face: Dir, bumped: boolean) {
    if (!game || busy) return;
    const map = mapById(game.map);
    const tile = tileAt(map, x, y);
    const flags = new Set(game.flags);
    const npc = npcsOf(map).find((n) => n.x === x && n.y === y && isPresent(n.item, flags));
    if (npc && !bumped) {
      setFaces({ [npc.index]: OPPOSITE[face] });
      const t = npc.item.trainer;
      if (t && !hasFlag(game, beatFlag(t))) return run(game, challenge(t));
      if (npc.item.talk) return run(game, npc.item.talk);
      if (t) return run(game, [{ do: 'say', text: trainerById(t).after }]);
      return;
    }
    const i = doorIndex(map, x, y);
    switch (tile) {
      case 'S':
        if (!bumped) run(game, [{ do: 'say', text: map.signs?.[i] ?? '…' }]);
        return;
      case 'P':
        return run(game, [{ do: 'pub' }]);
      case 'M':
        return run(game, [{ do: 'say', text: 'SHOPKEEPER: What can I get you?' }, { do: 'shop' }]);
      case 'H':
        return run(game, map.houses?.[i] ?? []);
      case 'L':
        return run(game, map.landmarks?.[i] ?? []);
      case 'G': {
        if (!map.gym) return;
        const leader = trainerById(map.gym.trainer);
        if (hasFlag(game, beatFlag(leader.id)))
          return run(game, [{ do: 'say', text: leader.after }]);
        if (!canFight(game)) {
          return run(game, [
            { do: 'say', text: 'Your Ranemon are too tired. Heal them in the pub first!' },
          ]);
        }
        return run(game, [
          {
            do: 'say',
            text: `${map.name.split(',')[0].toUpperCase()} GYM. Leader: ${leader.name}.`,
          },
          ...challenge(leader.id),
        ]);
      }
    }
  }

  function pressA() {
    if (line) return advance();
    if (!game || busy) return;
    const [dx, dy] = DELTA[game.face];
    interact(game.x + dx, game.y + dy, game.face, false);
  }

  function pressB() {
    if (line) return advance();
    if (overlay && overlay !== 'starter' && overlay !== 'ending' && overlay !== 'offer-chat') {
      closeOverlay();
    }
  }

  function pressStart() {
    if (!game || line || fight) return;
    if (overlay === 'menu') setOverlay(null);
    else if (!overlay && !busy) setOverlay('menu');
  }

  /** Closing a menu the script opened carries on with the script. */
  function closeOverlay() {
    setOverlay(null);
    if (game && queue.length) run(game, queue);
  }

  // Keyboard: arrows or WASD walk, Z/Space is A, X/Escape is B, Enter is START.
  const keys = useRef({ pressA, pressB, pressStart });
  useEffect(() => {
    keys.current = { pressA, pressB, pressStart };
  });
  useEffect(() => {
    const dirs: Record<string, Dir> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
    };
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const dir = dirs[e.key];
      if (dir) {
        held.current.dir = dir;
        e.preventDefault();
      } else if (e.repeat) return;
      else if (e.key === 'z' || e.key === ' ') keys.current.pressA();
      else if (e.key === 'x' || e.key === 'Escape') {
        held.current.b = true;
        keys.current.pressB();
      } else if (e.key === 'Enter') keys.current.pressStart();
    };
    const up = (e: KeyboardEvent) => {
      if (dirs[e.key] && held.current.dir === dirs[e.key]) held.current.dir = null;
      if (e.key === 'x' || e.key === 'Escape') held.current.b = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ---------- battles ----------

  function finishBattle(result: Result, state: BattleState, fought: number[]) {
    if (!game || !fight) return;
    const trainer = fight.trainer ? trainerById(fight.trainer) : null;
    if (trainer?.friendly && result !== 'win') {
      // Losing the first battle is fine: everyone's patched up and the story goes on.
      const g = setFlag(healParty(game), beatFlag(trainer.id));
      setFight(null);
      setFaces({});
      persist(g);
      run(g, [
        { do: 'say', text: 'RIVAL: Ha! Told you mine was better. Go on, I’ll patch yours up.' },
        ...queue,
      ]);
      return;
    }
    const settled = settleBattle(game, state, result, fought, trainer !== null);
    let g = settled.state;
    const steps: Run[] = [];
    if (result === 'win' && trainer) {
      g = { ...g, money: g.money + trainer.prize };
      steps.push({ do: 'say', text: `You got €${trainer.prize} for winning!` });
    }
    steps.push(...settled.lines.map((text) => ({ do: 'say' as const, text })));
    if (result === 'win' && trainer && !hasFlag(g, beatFlag(trainer.id))) {
      g = setFlag(g, beatFlag(trainer.id));
      steps.push({ do: 'say', text: trainer.after }, ...(trainer.reward ?? []));
    }
    const rest = result === 'loss' || result === 'draw' ? [] : queue;
    setFight(null);
    setFaces({});
    persist(g);
    run(g, [...steps, ...rest]);
  }

  const bag: BagEntry[] = game
    ? ITEMS.filter((i) => (game.bag[i.id] ?? 0) > 0).map((i) => ({
        id: i.id,
        name: i.name,
        count: game.bag[i.id] ?? 0,
        use: i.use,
      }))
    : [];

  // ---------- screens ----------

  if (saved === undefined) return <div className="flex-1" />;

  if (!game) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center text-ink">
        <h1 className="text-[22px] leading-snug [text-shadow:3px_3px_0_#8bac0f]">
          RANEMON
          <br />
          STORY
        </h1>
        <p className="text-[8px] leading-relaxed text-frame">
          From Co. Clare to Trinity College Dublin.
          <br />
          Nine jerseys. One pint at a time.
        </p>
        <div className="flex w-full max-w-[260px] flex-col gap-2">
          {saved && (
            <button
              type="button"
              className="pixel-btn menu-item text-[10px]"
              onClick={() => {
                setGame(saved);
                startGame(saved, false);
              }}
            >
              CONTINUE
            </button>
          )}
          <button
            type="button"
            className="pixel-btn menu-item text-[10px]"
            onClick={() => {
              const g = newGame();
              persist(g);
              setGame(g);
              startGame(g, true);
            }}
          >
            {saved ? 'NEW GAME' : 'START'}
          </button>
          {saved && (
            <p className="text-[6px] leading-relaxed text-frame">
              A new game replaces your save ({saved.party.length} Ranemon,{' '}
              {saved.flags.filter((f) => f.startsWith('jersey:') && f !== 'jersey:all').length}{' '}
              jerseys).
            </p>
          )}
        </div>
        <Link href="/" className="text-[8px] text-frame underline underline-offset-4">
          BATTLE MODE
        </Link>
      </div>
    );
  }

  if (fight) {
    const wild = fight.foe.kind === 'wild';
    return (
      <BattleScreen
        key={fight.key}
        teams={fight.teams}
        difficulty={fight.ai}
        foe={fight.foe}
        story={{
          bag,
          rate: wild ? catchRate(fight.teams[1][0].creature.id) : 0,
          onUse: (id) => setGame((g) => (g ? take(g, id as ItemId) : g)),
          expOf: (i) => (game.party[i] ? expProgress(game.party[i]) : 0),
        }}
        onFinish={finishBattle}
      />
    );
  }

  const map = mapById(game.map);
  const flags = new Set(game.flags);
  const walker = follower(game);
  const ghosts = find(map, '*').filter((p) => !flags.has(ghostFlag(map.id, p.x, p.y)));

  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div className="relative border-4 border-ink bg-ink" style={{ aspectRatio: '10 / 9' }}>
        <Overworld
          map={map}
          pos={{ x: game.x, y: game.y, face: game.face }}
          flags={flags}
          follower={walker?.species ?? null}
          frozen={busy}
          bike={hasFlag(game, 'bike')}
          exclaim={exclaim}
          faces={faces}
          ghosts={ghosts}
          held={held}
          onStep={onStep}
          onTurn={(face) => setGame((g) => (g ? { ...g, face } : g))}
          onBump={(x, y, face) => {
            if (['P', 'M', 'G', 'H', 'L'].includes(tileAt(map, x, y))) interact(x, y, face, true);
          }}
        />
        <div className="pointer-events-none absolute left-1 top-1 bg-paper px-1 text-[6px] text-ink">
          {map.name}
        </div>
        {flash && <div className="encounter-flash absolute inset-0" />}
        {line && (
          <button
            type="button"
            className="dialog absolute inset-x-0 bottom-0 z-10 min-h-[38%] px-3 py-2 text-left text-[9px] leading-[1.8]"
            onClick={advance}
            data-testid="story-text"
          >
            <TypedText key={line.n} text={line.text} instant={line.full} />
            <span className="blink ml-1 inline-block">▼</span>
          </button>
        )}
        {overlay === 'menu' && (
          <StartMenu
            onPick={(o) => {
              if (o === 'save') {
                persist(game);
                setOverlay(null);
                run(game, [{ do: 'say', text: 'Saved. Your progress is kept in this browser.' }]);
              } else setOverlay(o);
            }}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay === 'party' && (
          <PartyPanel
            game={game}
            onLead={(i) => setGame(makeLead(game, i))}
            onClose={closeOverlay}
          />
        )}
        {overlay === 'bag' && (
          <BagPanel
            game={game}
            onClose={closeOverlay}
            onUse={(id, i) => {
              const item = itemById(id);
              const m = game.party[i];
              const name = speciesById(m.species).name;
              let g = take(game, id);
              let lines: string[];
              if (item.use.kind === 'level') {
                const r = blueGhost(m);
                g = { ...g, party: g.party.map((x, j) => (j === i ? r.member : x)) };
                lines = [`${name} drank the Blue Ghost!`, ...r.lines];
              } else {
                const healed = applyItem(item, m);
                g = { ...g, party: g.party.map((x, j) => (j === i ? healed : x)) };
                lines = [
                  healed.hp > m.hp && m.hp > 0
                    ? `${name} regained ${healed.hp - m.hp} HP!`
                    : `${name} feels much better!`,
                ];
              }
              setOverlay(null);
              run(
                g,
                lines.map((text) => ({ do: 'say', text })),
              );
            }}
          />
        )}
        {overlay === 'shop' && (
          <ShopPanel
            game={game}
            onClose={closeOverlay}
            onBuy={(id) => {
              const price = itemById(id).price ?? Infinity;
              if (game.money >= price) setGame(give({ ...game, money: game.money - price }, id));
            }}
          />
        )}
        {overlay === 'chat' && (
          <GroupChatPanel
            game={game}
            onSend={(i) => setGame(toGroupChat(game, i))}
            onBring={(i) => setGame(fromGroupChat(game, i))}
            onClose={() => {
              persist(game);
              closeOverlay();
            }}
          />
        )}
        {overlay === 'dex' && <RanedexPanel game={game} onClose={closeOverlay} />}
        {overlay === 'card' && <JerseysPanel game={game} onClose={closeOverlay} />}
        {overlay === 'starter' && (
          <StarterPanel
            onChoose={(species) => {
              const g = setFlag(
                { ...recruit(game, species, 5).state, starter: species },
                'starter',
              );
              setOverlay(null);
              run(g, [
                {
                  do: 'say',
                  text: `You chose ${speciesById(species).name}! It finished the pint in one go.`,
                },
                ...queue,
              ]);
            }}
          />
        )}
        {overlay === 'offer-chat' && (
          <Choice
            question="Check the Group Chat on the wall?"
            yes="YES"
            no="NO"
            onYes={() => setOverlay('chat')}
            onNo={closeOverlay}
          />
        )}
        {overlay === 'ending' && (
          <EndingPanel
            game={game}
            onDone={() => {
              const g = setFlag(game, 'champion');
              persist(g);
              setOverlay(null);
              run(g, queue);
            }}
          />
        )}
      </div>
      <Controls
        onDir={(dir, on) => {
          if (on) held.current.dir = dir;
          else if (held.current.dir === dir) held.current.dir = null;
        }}
        onHoldB={(on) => (held.current.b = on)}
        onA={pressA}
        onB={pressB}
        onStart={pressStart}
      />
    </div>
  );
}

function StartMenu({
  onPick,
  onClose,
}: {
  onPick: (o: 'party' | 'bag' | 'dex' | 'card' | 'save') => void;
  onClose: () => void;
}) {
  const items = [
    ['party', 'PARTY'],
    ['bag', 'BAG'],
    ['dex', 'RANEDEX'],
    ['card', 'JERSEYS'],
    ['save', 'SAVE'],
  ] as const;
  return (
    <div className="dialog absolute right-0 top-0 z-20 flex w-[55%] flex-col gap-1 p-2">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className="menu-item py-1.5 text-left text-[9px]"
          onClick={() => onPick(id)}
        >
          {label}
        </button>
      ))}
      <button type="button" className="menu-item py-1.5 text-left text-[9px]" onClick={onClose}>
        EXIT
      </button>
    </div>
  );
}

/** The handheld's buttons: a D-pad you can hold, A, B and START. */
function Controls({
  onDir,
  onHoldB,
  onA,
  onB,
  onStart,
}: {
  /** A D-pad direction pressed (true) or let go (false). */
  onDir: (dir: Dir, on: boolean) => void;
  onHoldB: (on: boolean) => void;
  onA: () => void;
  onB: () => void;
  onStart: () => void;
}) {
  const pad = (dir: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      // Let the finger slide from one arrow to the next.
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      onDir(dir, true);
    },
    onPointerEnter: (e: React.PointerEvent) => e.buttons && onDir(dir, true),
    onPointerUp: () => onDir(dir, false),
    onPointerLeave: () => onDir(dir, false),
    onPointerCancel: () => onDir(dir, false),
  });
  const arrow = 'pad-btn flex items-center justify-center text-[10px] text-paper';
  return (
    <div
      className="flex select-none items-center justify-between px-2 py-2"
      style={{ touchAction: 'none' }}
    >
      <div className="grid grid-cols-3 grid-rows-3" aria-label="D-pad">
        <span />
        <button type="button" className={arrow} aria-label="Up" {...pad('up')}>
          ▲
        </button>
        <span />
        <button type="button" className={arrow} aria-label="Left" {...pad('left')}>
          ◀
        </button>
        <span className="pad-btn" />
        <button type="button" className={arrow} aria-label="Right" {...pad('right')}>
          ▶
        </button>
        <span />
        <button type="button" className={arrow} aria-label="Down" {...pad('down')}>
          ▼
        </button>
        <span />
      </div>
      <button type="button" className="start-btn text-[7px]" onClick={onStart}>
        START
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="round-btn mt-6"
          onPointerDown={() => onHoldB(true)}
          onPointerUp={() => onHoldB(false)}
          onPointerLeave={() => onHoldB(false)}
          onClick={onB}
        >
          B
        </button>
        <button type="button" className="round-btn mb-6" onClick={onA}>
          A
        </button>
      </div>
    </div>
  );
}
