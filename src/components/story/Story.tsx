'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { BattleScreen, type BagEntry, type Scene } from '@/components/BattleScreen';
import { Sprite } from '@/components/Sprite';
import { SpeedButton } from '@/components/SpeedButton';
import { MS_PER_CHAR, TypedText } from '@/components/TypedText';
import { scaled } from '@/lib/speed';
import { mapById, outsideOf } from '@/content/story/maps';
import { interiorId } from '@/content/story/interiors';
import { teamOf, trainerById } from '@/content/story/trainers';
import type { Difficulty } from '@/lib/battle/cpu';
import { formAt } from '@/lib/battle/evolutions';
import type { BattleState, Entrant } from '@/lib/battle/engine';
import { flushOnline, hasCloudSaves, loadOnline, saveOnline } from '@/lib/story/cloud';
import { applyItem, ITEMS, itemById, type ItemId } from '@/lib/story/items';
import {
  blueGhost,
  catchRate,
  evolutionIn,
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
  newer,
  newGame,
  parseSave,
  PLAYER_KEY,
  playerId,
  recruit,
  save,
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
  doorStep,
  DOORS,
  EXIT,
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
  type GameMap,
  type Step,
} from '@/lib/story/world';
import type { Foe } from '@/lib/ui/playback';
import type { Result } from '@/lib/ui/session';
import { notice } from '@/lib/story/keys';
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
  | 'ask'
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

/** Dua Lipa works the bar in McGrattans, and has a line for every visit. */
const DUA_LINES = [
  'DUA LIPA: Welcome to McGrattans! Sit down there and I’ll look after your lot.',
  'DUA LIPA: New rules. One: don’t pick up the phone. Two: hand me your Ranemon. Three: have a pint.',
  'DUA LIPA: Don’t start now, I’ve only just healed the last lot! Go on, give them here.',
  'DUA LIPA: Levitating? No, that’s just the Guinness. Leave your Ranemon with me.',
  'DUA LIPA: Physical, physical… they’re all in great shape now. Mind yourself out there.',
];

const ghostFlag = (map: string, x: number, y: number) => `ghost:${map}:${x}:${y}`;
const challenge = (trainer: string): Run[] => [
  { do: 'say', text: trainerById(trainer).before },
  { do: 'battle', trainer },
];

/** While the text announces an evolution: the two forms trading places in a white glow. */
function EvolutionScene({ text }: { text: string }) {
  const evo = evolutionIn(text);
  if (!evo) return null;
  return (
    <div
      className={`evolve-scene absolute inset-0 z-[5] grid place-items-center pb-[30%] ${evo.done ? '' : 'evolving'}`}
      data-testid="evolution"
    >
      <div className="grid h-32 w-32">
        {!evo.done && (
          <span className="evolve-old">
            <Sprite creature={evo.from} />
          </span>
        )}
        <span className={evo.done ? '' : 'evolve-new'}>
          <Sprite creature={evo.to} />
        </span>
      </div>
    </div>
  );
}

/** The battlefield's backdrop: B&S at night, gyms indoors, Dublin's streets, or the fields. */
function sceneOf(map: GameMap, trainer: string | null): Scene {
  if (trainer?.startsWith('bns')) return 'night';
  if (trainer && map.gym?.trainer === trainer) return 'gym';
  const outside = outsideOf(map).id;
  if (outside === 'dublin' || outside === 'trinity') return 'city';
  return 'field';
}

export function Story() {
  const [game, setGame] = useState<StoryState | null>(null);
  // The trainer name last used here. Read through the store so the server render hydrates.
  const remembered = useSyncExternalStore(
    noSubscribe,
    () => {
      try {
        return storage()?.getItem(PLAYER_KEY) ?? '';
      } catch {
        return '';
      }
    },
    () => undefined,
  );
  const [typed, setTyped] = useState<string | null>(null);
  const name = typed ?? remembered ?? '';
  /** The trainer playing: whose save every change goes to. */
  const player = useRef('');
  const [title, setTitle] = useState<{ busy: boolean; note: string | null; replace: boolean }>({
    busy: false,
    note: null,
    replace: false,
  });
  const [queue, setQueue] = useState<Run[]>([]);
  /** The line in the text box: `n` restarts the typing, `full` skips to the end of it. */
  const [line, setLine] = useState<{ text: string; n: number; full?: boolean } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  /** The question on screen while the overlay is 'ask'. */
  const [ask, setAsk] = useState<Extract<Step, { do: 'ask' }> | null>(null);
  const [fight, setFight] = useState<Fight | null>(null);
  const [flash, setFlash] = useState(false);
  const [exclaim, setExclaim] = useState<number | null>(null);
  const [faces, setFaces] = useState<Record<number, Dir>>({});
  const held = useRef<Held>({ dir: null, b: false });

  const persist = useCallback((g: StoryState) => {
    const raw = save(storage(), g, player.current);
    if (raw) saveOnline(player.current, raw);
  }, []);

  // Don't lose the last online save when the tab goes away.
  useEffect(() => {
    const hide = () => document.visibilityState === 'hidden' && flushOnline();
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
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
              { do: 'say', text: DUA_LINES[g.steps % DUA_LINES.length] },
              { do: 'say', text: 'Your Ranemon are fighting fit again!' },
              { do: 'offer-chat' },
            );
            break;
          case 'ask':
            setGame(g);
            setQueue(q);
            setLine(null);
            setAsk(s);
            setOverlay('ask');
            return;
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
              foe: { kind: 'trainer', name: t.name },
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
    if (!line.full && Date.now() - line.n < scaled(line.text.length * MS_PER_CHAR)) {
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
      }, scaled(700));
      return;
    }

    if (
      map.wild &&
      ENCOUNTER_TILES.has(tileAt(map, to.x, to.y)) &&
      canFight(g) &&
      Math.random() < ENCOUNTER_RATE
    ) {
      const wild = pickWild(map.wild, Math.random(), Math.random());
      const { level } = wild;
      const species = formAt(wild.species, level);
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
      }, scaled(650));
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
      if (t && !hasFlag(game, beatFlag(t))) {
        if (!canFight(game)) {
          return run(game, [
            { do: 'say', text: 'Your Ranemon are too tired. Heal them in McGrattans first!' },
          ]);
        }
        return run(game, challenge(t));
      }
      if (npc.item.talk) return run(game, npc.item.talk);
      if (t) return run(game, [{ do: 'say', text: trainerById(t).after }]);
      return;
    }
    if (!bumped && map.things?.[tile]) return run(game, [{ do: 'say', text: map.things[tile] }]);
    if (DOORS.has(tile)) return goInside(map, x, y, tile);
    switch (tile) {
      case 'S':
        if (!bumped) run(game, [{ do: 'say', text: map.signs?.[doorIndex(map, x, y)] ?? '…' }]);
        return;
      case EXIT: {
        if (!map.inside) return;
        const outside = mapById(map.inside.map);
        const g: StoryState = {
          ...game,
          map: outside.id,
          ...doorStep(outside, map.inside.x, map.inside.y),
        };
        return run(g, []);
      }
      case 'X': {
        // A gym's statues name the gym and its leader.
        if (bumped || !map.gym) return;
        const leader = trainerById(map.gym.trainer);
        const won = hasFlag(game, beatFlag(leader.id)) ? ` You’ve beaten this gym.` : '';
        return run(game, [
          {
            do: 'say',
            text: `${map.gym.place.toUpperCase()} GYM. Leader: ${leader.name}.${won}`,
          },
        ]);
      }
    }
  }

  /** Through a door: into the room behind it, facing in. */
  function goInside(map: GameMap, x: number, y: number, kind: string) {
    if (!game) return;
    const lock = kind === 'G' ? map.gym?.lock : undefined;
    if (lock && !hasFlag(game, lock.flag)) return run(game, [{ do: 'say', text: lock.locked }]);
    const room = mapById(interiorId(map.id, kind, doorIndex(map, x, y)));
    let g: StoryState = { ...game, map: room.id, ...marker(room, '@'), face: 'up' };
    const steps: Run[] = [...(room.arrive ?? [])];
    // The first time through a locked door, say how it opened.
    if (lock && !hasFlag(g, `unlocked:${map.id}`)) {
      g = setFlag(g, `unlocked:${map.id}`);
      steps.unshift({ do: 'say', text: lock.opened });
    }
    run(g, steps);
  }

  function pressA() {
    if (line) return advance();
    if (!game || busy) return;
    const [dx, dy] = DELTA[game.face];
    const map = mapById(game.map);
    // Talk across a counter to whoever is behind it.
    const across = tileAt(map, game.x + dx, game.y + dy) === 'C' ? 2 : 1;
    interact(game.x + dx * across, game.y + dy * across, game.face, false);
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

  /** Answering a question: its steps for that answer, then the rest of the script. */
  function answer(steps: Step[] | undefined) {
    if (!game) return;
    setOverlay(null);
    setAsk(null);
    run(game, [...(steps ?? []), ...queue]);
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
        {
          do: 'say',
          text: 'THATCHER: Ha! Rule, Britannia! Never mind, dear. A nice cup of tea will sort your lot out.',
        },
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

  if (remembered === undefined) return <div className="flex-1" />;

  /** Finds the trainer's save: the newer of this browser's and the online one. */
  async function findSave(trainer: string) {
    const local = load(storage(), trainer);
    const online = parseSave(await loadOnline(trainer));
    return newer(local, online);
  }

  function begin(trainer: string, g: StoryState, fresh: boolean) {
    player.current = trainer.trim();
    try {
      storage()?.setItem(PLAYER_KEY, player.current);
    } catch {
      // Private windows can refuse storage; the game still runs.
    }
    persist(g);
    setGame(g);
    startGame(g, fresh);
  }

  async function onContinue() {
    setTitle({ busy: true, note: null, replace: false });
    const found = await findSave(name);
    if (found) begin(name, found, false);
    else
      setTitle({
        busy: false,
        note: `No save under “${name.trim()}” yet. Check the spelling, or start a new game.`,
        replace: false,
      });
  }

  async function onNew() {
    if (!title.replace) {
      setTitle({ busy: true, note: null, replace: false });
      const found = await findSave(name);
      if (found) {
        const jerseys = found.flags.filter(
          (f) => f.startsWith('jersey:') && f !== 'jersey:all',
        ).length;
        setTitle({
          busy: false,
          note: `“${name.trim()}” already has a save (${found.party.length} Ranemon, ${jerseys} jerseys). Tap NEW GAME again to replace it.`,
          replace: true,
        });
        return;
      }
    }
    begin(name, newGame(), true);
  }

  if (!game) {
    const ready = playerId(name).length > 0 && !title.busy;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center text-ink">
        <h1 className="text-[40px] font-bold leading-tight text-gold [-webkit-text-stroke:2px_#1c4f96] [text-shadow:0_4px_0_#1c4f96,0_6px_0_#1c2026]">
          RANEMON
          <br />
          STORY
        </h1>
        <p className="text-[11px] leading-relaxed text-frame">
          From Co. Clare to Trinity College Dublin.
          <br />
          Nine jerseys. One pint at a time.
        </p>
        <form
          className="flex w-full max-w-[260px] flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onContinue();
          }}
        >
          <label className="flex flex-col gap-1 text-left text-[12px]">
            TRAINER NAME
            <input
              className="dialog px-3 py-2 text-[16px] outline-none focus:border-accent2"
              value={name}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="words"
              placeholder="e.g. Rich"
              onChange={(e) => {
                setTyped(e.target.value);
                setTitle({ busy: false, note: null, replace: false });
              }}
              data-testid="trainer-name"
            />
          </label>
          <button type="submit" className="pixel-btn menu-item text-[14px]" disabled={!ready}>
            CONTINUE
          </button>
          <button
            type="button"
            className="pixel-btn menu-item text-[14px]"
            disabled={!ready}
            onClick={onNew}
          >
            NEW GAME
          </button>
          <p className="text-[10px] leading-relaxed text-frame" aria-live="polite">
            {title.busy
              ? 'Looking for your save…'
              : (title.note ??
                (hasCloudSaves()
                  ? 'Your save follows this name, so you can carry on from any device.'
                  : 'Your save is kept in this browser under this name.'))}
          </p>
        </form>
        <Link href="/" className="text-[11px] text-frame underline underline-offset-4">
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
        scene={sceneOf(mapById(game.map), fight.trainer)}
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
      <div
        className="relative overflow-hidden rounded-md border-4 border-bezel bg-bezel"
        style={{ aspectRatio: '10 / 9' }}
      >
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
            const tile = tileAt(map, x, y);
            if (DOORS.has(tile) || tile === EXIT) interact(x, y, face, true);
          }}
        />
        <div className="pointer-events-none absolute left-1 top-1 rounded bg-panel/85 px-1.5 text-[9px] text-paper">
          {map.name}
        </div>
        <SpeedButton className="absolute right-1 top-1" />
        {flash && <div className="encounter-flash absolute inset-0" />}
        {line && <EvolutionScene text={line.text} />}
        {line && (
          <button
            type="button"
            className="dialog absolute inset-x-0 bottom-0 z-10 min-h-[38%] px-3 py-2 text-left text-[13px] leading-[1.8]"
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
            onUseKey={() => {
              setOverlay(null);
              run(
                game,
                notice(map, flags, ghosts.length).map((text) => ({ do: 'say', text })),
              );
            }}
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
        {overlay === 'ask' && ask && (
          <Choice
            question={ask.text}
            yes="YES"
            no="NO"
            onYes={() => answer(ask.yes)}
            onNo={() => answer(ask.no)}
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
          className="menu-item py-1.5 text-left text-[13px]"
          onClick={() => onPick(id)}
        >
          {label}
        </button>
      ))}
      <button type="button" className="menu-item py-1.5 text-left text-[13px]" onClick={onClose}>
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
  const arrow = 'pad-btn flex items-center justify-center text-[14px] text-paper';
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
      <button type="button" className="start-btn text-[10px]" onClick={onStart}>
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
