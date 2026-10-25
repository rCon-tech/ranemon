'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BattleScreen, type BagEntry, type Scene } from '@/components/BattleScreen';
import { Sprite } from '@/components/Sprite';
import { SpeedButton } from '@/components/SpeedButton';
import { useView, ViewButton } from '@/components/ViewButton';
import { useChampion } from '@/components/Champion';
import { play, SoundButton, useMusic } from '@/components/Sound';
import { areaSong, battleSong, lineCues, partySong } from '@/lib/sound/cues';
import { playSfx } from '@/lib/sound/engine';
import { MS_PER_CHAR, TypedText } from '@/components/TypedText';
import { scaled } from '@/lib/speed';
import { isFlat, mapById, mapFor, outsideOf } from '@/content/story/maps';
import { interiorId } from '@/content/story/interiors';
import { lookOf, unlockSkins, wearSkin } from '@/content/story/skins';
import { ticket } from '@/content/story/station';
import { teamOf, trainerById } from '@/content/story/trainers';
import { levelCap, scaleTeam } from '@/lib/story/levels';
import type { Difficulty } from '@/lib/battle/cpu';
import { formAt } from '@/lib/battle/evolutions';
import { LEGEND } from '@/lib/battle/legend';
import type { BattleState, Entrant } from '@/lib/battle/engine';
import {
  cloudNeedsPin,
  flushOnline,
  hasCloudSaves,
  isPin,
  loadOnline,
  saveOnline,
  setCloudSaves,
} from '@/lib/story/cloud';
import { remoteSaves } from '@/lib/story/remote';
import { replace } from '@/lib/story/save';
import { SaveTools } from './SaveTools';
import { applyItem, ITEMS, itemById, priceOf, type ItemId } from '@/lib/story/items';
import { devSave, isDevName } from '@/lib/story/devsave';
import { COMPANIONS, companionOf, finds, pickFind } from '@/lib/story/norm';
import {
  blueGhost,
  itemEvolve,
  catchRate,
  evolutionIn,
  expProgress,
  makeMember,
  swapMove,
  speciesById,
  toEntrant,
  type Member,
} from '@/lib/story/party';
import {
  beatFlag,
  befriend,
  canFight,
  caughtBefore,
  follower,
  fromGroupChat,
  give,
  hasFlag,
  healParty,
  crossBorder,
  load,
  makeLead,
  toggleExpShare,
  newer,
  newGame,
  parseSave,
  PLAYER_KEY,
  playerId,
  recruit,
  reunite,
  save,
  see,
  setFlag,
  settleBattle,
  unsetFlag,
  take,
  holdItem,
  takeHeld,
  toGroupChat,
  type StoryState,
} from '@/lib/story/state';
import {
  DELTA,
  doorIndex,
  crowdAt,
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
  type Stall,
  type Step,
} from '@/lib/story/world';
import type { Foe } from '@/lib/ui/playback';
import type { Result } from '@/lib/ui/session';
import { LIMEPASS, notice, TABLET, TAKE_TABLET } from '@/lib/story/keys';
import { LimepassPanel } from './LimepassPanel';
import { rollShiny } from '@/lib/story/shiny';
import { rollVariant } from '@/lib/battle/variants';
import { hasUkForm, UK } from '@/lib/battle/uk';
import { NEESON_LINES, UK_LEVEL } from '@/content/story/london';
import { UK_STARTER } from '@/content/story/kneecap';
import { Overworld, type Held, type Position } from './Overworld';
import { TownMapPanel } from './TownMap';
import { FLEE_MS, type Flight } from './walk';
import { COLLINS, ELITE } from '@/content/story/galway';

/** The 3D overworld and its WebGL library load only when the 3D look is picked. */
const Overworld3D = dynamic(() => import('./Overworld3D'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-ink" />,
});
import {
  BagPanel,
  Choice,
  DeparturesPanel,
  EndingPanel,
  GroupChatPanel,
  JerseysPanel,
  MissionsPanel,
  PartyPanel,
  RanedexPanel,
  ShopPanel,
  SkinsPanel,
  type DexNav,
  StarterPanel,
} from './Panels';

/** Script steps plus the story screen's own: the pub's Group Chat question. */
type Run = Step | { do: 'offer-chat' };

/** What runs each time you come onto a map outdoors, such as someone running up to you. */
const arrival = (map: GameMap): Run[] => (map.inside ? [] : (map.arrive ?? []));

type Overlay =
  | 'menu'
  | 'party'
  | 'bag'
  | 'shop'
  | 'departures'
  | 'chat'
  | 'dex'
  | 'card'
  | 'skins'
  | 'missions'
  | 'map'
  | 'limepass'
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

/** The save server's address, when this build has one (see `save-api/`). */
function saveApi(): string | undefined {
  try {
    return process.env.NEXT_PUBLIC_SAVE_API || undefined;
  } catch {
    return undefined;
  }
}
const SAVE_API = saveApi();
if (SAVE_API && typeof window !== 'undefined') setCloudSaves(remoteSaves(SAVE_API));

/** Dua Lipa works the bar in McGrattans, and has a line for every visit. */
const DUA_LINES = [
  'DUA LIPA: Welcome to McGrattans! Sit down there and I’ll look after your lot.',
  'DUA LIPA: New rules. One: don’t pick up the phone. Two: hand me your Ranemon. Three: have a pint.',
  'DUA LIPA: Don’t start now, I’ve only just healed the last lot! Go on, give them here.',
  'DUA LIPA: Levitating? No, that’s just the Guinness. Leave your Ranemon with me.',
  'DUA LIPA: Physical, physical… they’re all in great shape now. Mind yourself out there.',
];

const TOO_TIRED = 'Your Ranemon are too tired. Heal them in McGrattans first!';

/** A wild Ranemon's look: a UK form in Britain, where every Ranemon is drawn, or any at home. */
function wildLook(mapId: string, species: string): string | undefined {
  if (outsideOf(mapById(mapId)).uk) return hasUkForm(species) ? UK : undefined;
  return rollVariant(species, Math.random());
}

const ghostFlag = (map: string, x: number, y: number) => `ghost:${map}:${x}:${y}`;
const challenge = (trainer: string): Run[] => [
  { do: 'say', text: trainerById(trainer).before },
  { do: 'battle', trainer },
];

/**
 * While the text announces an evolution: the two forms trading places in a white glow, in the
 * look of the party member it's about.
 */
function EvolutionScene({ text, party }: { text: string; party: Member[] }) {
  const evo = evolutionIn(text, party);
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

/**
 * The battlefield's backdrop: B&S, the legend and Michael Collins at night, gyms and the Hall of
 * Champions indoors, the streets of Dublin, Brighton, Ghent and Galway, or the fields.
 */
function sceneOf(map: GameMap, trainer: string | null, foe: string): Scene {
  if (trainer?.startsWith('bns') || foe === LEGEND.id) return 'night';
  if (trainer === COLLINS) return 'night';
  if (trainer && (map.gym?.trainer === trainer || ELITE.includes(trainer))) return 'gym';
  const outside = outsideOf(map).id;
  if (
    [
      'dublin',
      'trinity',
      'brighton',
      'belgium',
      'galway',
      'airport',
      'stansted',
      'london',
      'manchester',
      'leeds',
      'liverpool',
      'falmer',
      'birmingham',
      'newcastle',
      'tube',
    ].includes(outside)
  )
    return 'city';
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
  // The Online Champion, from the save server: whoever holds the crown wears the Champion's skin.
  const { champ } = useChampion(SAVE_API);
  const champion = !!game && !!champ && champ.id === playerId(player.current);
  const [pin, setPin] = useState('');
  const [title, setTitle] = useState<{
    busy: boolean;
    note: string | null;
    replace: boolean;
    /** The online save can't be opened: the next CONTINUE plays this browser's save alone. */
    localOnly?: boolean;
  }>({
    busy: false,
    note: null,
    replace: false,
  });
  /** The title screen's backups and save codes, with the trainer's save as it stands. */
  const [tools, setTools] = useState<{ current: StoryState | null } | null>(null);
  const [queue, setQueue] = useState<Run[]>([]);
  /** The line in the text box: `n` restarts the typing, `full` skips to the end of it. */
  const [line, setLine] = useState<{ text: string; n: number; full?: boolean } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  /** The question on screen while the overlay is 'ask'. */
  const [ask, setAsk] = useState<Extract<Step, { do: 'ask' }> | null>(null);
  /** Whose stall the shop is while the overlay is 'shop': null for Vapes. */
  const [stall, setStall] = useState<Stall | null>(null);
  /** The starter pick is Próvaí's UK Ranemon, not Michael D's. */
  const [ukStarter, setUkStarter] = useState(false);
  const [fight, setFight] = useState<Fight | null>(null);
  const [flash, setFlash] = useState<'plain' | 'shiny' | null>(null);
  const [exclaim, setExclaim] = useState<number | null>(null);
  const [faces, setFaces] = useState<Record<number, Dir>>({});
  const [flight, setFlight] = useState<Flight | null>(null);
  const held = useRef<Held>({ dir: null, b: false });
  const view = useView();
  /** On the bike lately: its theme plays until you've been off it a couple of seconds. */
  const [riding, setRiding] = useState(false);
  const offBike = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Music: the title, then the place you're in. Battles play their own.
  const here = game ? mapFor(game.map, game.flags) : null;
  // A map that's only drawn in 2D for now shows in 2D whichever look is picked.
  const World = view === '3d' && !(here && isFlat(here)) ? Overworld3D : Overworld;
  useMusic(
    !game || !here
      ? 'title'
      : fight
        ? undefined
        : flash
          ? 'wild'
          : riding
            ? 'bike'
            : here.party
              ? partySong(here.id)
              : areaSong(here.id, outsideOf(here).id),
  );
  // A door's sound going in or out of a room.
  const lastMap = useRef<string | null>(null);
  useEffect(() => {
    const before = lastMap.current ? mapById(lastMap.current) : null;
    lastMap.current = here?.id ?? null;
    if (before && here && before.id !== here.id && (before.inside || here.inside)) {
      playSfx('door');
    }
  }, [here]);
  // Each line's sound: items, levels, the pub, the dogs.
  useEffect(() => {
    if (line && !line.full) play(lineCues(line.text));
    // Once per line, not again when it's skipped to the end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line?.n]);

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
      for (;;) {
        // Once a script is done, any skin it earned is announced before you walk on.
        if (!q.length) {
          const unlocked = unlockSkins(g);
          if (!unlocked.lines.length) break;
          g = unlocked.state;
          q.push(...unlocked.lines.map((text) => ({ do: 'say' as const, text })));
        }
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
          case 'recruit': {
            const name = speciesById(s.species).name;
            const joined = recruit(g, s.species, s.level);
            g = joined.state;
            q.unshift(
              { do: 'say', text: `You got ${name}!` },
              ...(joined.line ? [{ do: 'say' as const, text: joined.line }] : []),
            );
            break;
          }
          case 'flag':
            g = setFlag(g, s.flag);
            break;
          case 'unflag':
            g = unsetFlag(g, s.flag);
            break;
          case 'if':
            q.unshift(...(hasFlag(g, s.flag) ? s.then : (s.else ?? [])));
            break;
          case 'flee': {
            const runner = npcsOf(mapFor(g.map, g.flags)).find((n) => n.item.hideIf === s.flag);
            if (!runner || !isPresent(runner.item, new Set(g.flags))) {
              g = setFlag(g, s.flag);
              break;
            }
            const gone = setFlag(g, s.flag);
            const dur = scaled(FLEE_MS);
            setGame(g);
            setQueue(q);
            setLine(null);
            setFlight({ index: runner.index, dir: s.dir, t0: performance.now(), dur });
            setTimeout(() => {
              setFlight(null);
              run(gone, q);
            }, dur);
            return;
          }
          case 'heal':
            g = healParty(g);
            break;
          case 'border':
            g = crossBorder(g, s.pub);
            break;
          case 'reunite':
            g = reunite(g);
            break;
          case 'pub': {
            g = { ...healParty(g), pub: { map: g.map, x: g.x, y: g.y } };
            // In Britain it's Liam Neeson behind the bar of W.B Yates.
            const pubOutside = outsideOf(mapById(g.map));
            const lines = pubOutside.uk || pubOutside.yates ? NEESON_LINES : DUA_LINES;
            q.unshift(
              { do: 'say', text: lines[g.steps % lines.length] },
              { do: 'say', text: 'Your Ranemon are fighting fit again!' },
              { do: 'offer-chat' },
            );
            break;
          }
          case 'ask':
            setGame(g);
            setQueue(q);
            setLine(null);
            setAsk(s);
            setOverlay('ask');
            return;
          case 'offer-chat':
          case 'shop':
          case 'departures':
          case 'starter':
          case 'ending':
            setGame(g);
            setQueue(q);
            setLine(null);
            if (s.do === 'shop') setStall(s.stall ?? null);
            if (s.do === 'starter') setUkStarter(!!s.uk);
            setOverlay(s.do === 'offer-chat' ? 'offer-chat' : s.do === 'shop' ? 'shop' : s.do);
            return;
          case 'travel': {
            g = setFlag({ ...g, map: s.map, x: s.x, y: s.y, face: s.face }, `visited:${s.map}`);
            // Whatever happens on arriving there comes once the rest of this script is done.
            q.push(...arrival(mapFor(s.map, g.flags)));
            break;
          }
          case 'wild': {
            const shiny = rollShiny(Math.random());
            const variant = wildLook(g.map, s.species);
            g = see(g, s.species);
            setGame(g);
            setQueue(q);
            setLine(null);
            setFight({
              teams: [
                g.party.map(toEntrant),
                [toEntrant({ ...makeMember(s.species, s.level, -1, variant), shiny, variant })],
              ],
              foe: { kind: 'wild' },
              ai: 'hard',
              trainer: null,
              key: Date.now(),
            });
            return;
          }
          case 'battle': {
            // A battle from a script, such as a rematch, still needs someone able to fight.
            if (!canFight(g)) {
              q.length = 0;
              q.unshift({ do: 'say', text: TOO_TIRED });
              break;
            }
            const t = trainerById(s.trainer);
            // Once you're Champion, every trainer scales up to your party; the Championship
            // in Galway always does, Champion or not. Britain is a new story line that starts
            // again from Lv5, so its trainers keep their own levels.
            const own = teamOf(t, t.uk ? g.ukStarter : g.starter);
            const team = (t.uk ? own : scaleTeam(own, g, t.above)).map(([id, level], i) =>
              toEntrant(makeMember(id, level, -1 - i, t.uk ? UK : undefined)),
            );
            for (const e of team) g = see(g, e.creature.id);
            setGame(g);
            setQueue(q);
            setLine(null);
            setFight({
              teams: [g.party.map(toEntrant), team],
              foe: { kind: 'trainer', name: t.name, line: t.line },
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
    playSfx('blip');
    if (!line.full && Date.now() - line.n < scaled(line.text.length * MS_PER_CHAR)) {
      setLine({ ...line, full: true });
      return;
    }
    run(game, queue);
  }, [game, line, queue, run]);

  const busy =
    !game ||
    line !== null ||
    overlay !== null ||
    fight !== null ||
    flash !== null ||
    exclaim !== null ||
    flight !== null;

  function startGame(g: StoryState, fresh: boolean) {
    const map = mapFor(g.map, g.flags);
    const intro =
      fresh && map.enter ? [...map.enter, { do: 'flag' as const, flag: `visited:${map.id}` }] : [];
    run(g, [...intro, ...arrival(map)]);
  }

  // ---------- walking ----------

  function onStep(to: Position) {
    if (!game) return;
    const map = mapFor(game.map, game.flags);
    const width = map.rows[0].length;
    if (to.x < 0 || to.x >= width) {
      const nextId = to.x < 0 ? map.west! : map.east!;
      const next = mapFor(nextId, game.flags);
      const at = marker(next, to.x < 0 ? '>' : '@');
      let g: StoryState = { ...game, map: nextId, ...at, face: to.face };
      const steps: Run[] = [];
      if (next.enter && !hasFlag(g, `visited:${nextId}`)) steps.push(...next.enter);
      steps.push(...arrival(next));
      g = setFlag(g, `visited:${nextId}`);
      persist(g);
      run(g, steps);
      return;
    }
    let g: StoryState = { ...game, ...to, steps: game.steps + 1 };
    // Hold B on a bike and its theme kicks in, with a ring of the bell.
    if ((hasFlag(game, 'bike') || hasFlag(game, LIMEPASS)) && held.current.b) {
      if (!riding) playSfx('bell');
      setRiding(true);
      if (offBike.current) clearTimeout(offBike.current);
      offBike.current = setTimeout(() => setRiding(false), 2500);
    }

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
      playSfx('exclaim');
      setExclaim(spotter.index);
      setTimeout(() => {
        setExclaim(null);
        run(g, challenge(spotter.item.trainer!));
      }, scaled(700));
      return;
    }

    // Norm and Elvis have a nose for things: every so often the dog turns something up.
    const dog = companionOf(g.flags);
    if (dog && finds(g.steps, g.foundAt, Math.random())) {
      g = { ...g, foundAt: g.steps };
      run(g, [
        { do: 'say', text: `${COMPANIONS[dog].name} found something!` },
        { do: 'give', item: pickFind(Math.random()) },
      ]);
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
      // In Britain every Ranemon is a drawn UK form, evolved ones included.
      const species = formAt(wild.species, level);
      const shiny = rollShiny(Math.random());
      const variant = wildLook(map.id, species);
      g = see(g, species);
      setGame(g);
      playSfx('encounter');
      setFlash(shiny ? 'shiny' : 'plain');
      setTimeout(() => {
        setFlash(null);
        setFight({
          teams: [
            g.party.map(toEntrant),
            [toEntrant({ ...makeMember(species, level, -1, variant), shiny, variant })],
          ],
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
    const map = mapFor(game.map, game.flags);
    const tile = tileAt(map, x, y);
    const flags = new Set(game.flags);
    const npc = npcsOf(map).find((n) => n.x === x && n.y === y && isPresent(n.item, flags));
    if (npc && !bumped) {
      setFaces({ [npc.index]: OPPOSITE[face] });
      const t = npc.item.trainer;
      const ready = !npc.item.readyIf || hasFlag(game, npc.item.readyIf);
      if (t && ready && !hasFlag(game, beatFlag(t))) {
        if (!canFight(game)) {
          return run(game, [{ do: 'say', text: TOO_TIRED }]);
        }
        return run(game, challenge(t));
      }
      if (npc.item.talk) return run(game, npc.item.talk);
      if (t) return run(game, [{ do: 'say', text: trainerById(t).after }]);
      return;
    }
    const dancer = crowdAt(map, x, y);
    if (dancer >= 0) {
      if (bumped) return;
      const lines = map.party?.lines ?? [];
      return run(game, [{ do: 'say', text: lines[dancer % lines.length] ?? '♪ ♪ ♪' }]);
    }
    if (!bumped && map.things?.[tile]) return run(game, [{ do: 'say', text: map.things[tile] }]);
    if (DOORS.has(tile)) return goInside(map, x, y, tile);
    switch (tile) {
      case 'S':
        if (!bumped) run(game, [{ do: 'say', text: map.signs?.[doorIndex(map, x, y)] ?? '…' }]);
        return;
      case EXIT: {
        if (!map.inside) return;
        const outside = mapFor(map.inside.map, game.flags);
        const g: StoryState = {
          ...game,
          map: outside.id,
          ...doorStep(outside, map.inside.x, map.inside.y),
        };
        return run(g, arrival(outside));
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
    const lock =
      kind === 'G'
        ? map.gym?.lock
        : kind === 'L'
          ? map.landmarkLocks?.[doorIndex(map, x, y)]
          : undefined;
    if (lock && !hasFlag(game, lock.flag)) return run(game, [{ do: 'say', text: lock.locked }]);
    const room = mapFor(interiorId(map.id, kind, doorIndex(map, x, y)), game.flags);
    let g: StoryState = { ...game, map: room.id, ...marker(room, '@'), face: 'up' };
    const steps: Run[] = [...(room.arrive ?? [])];
    // The first time through a locked door, say how it opened.
    const opened = `unlocked:${room.id}`;
    if (lock && !hasFlag(g, opened)) {
      g = setFlag(g, opened);
      steps.unshift({ do: 'say', text: lock.opened });
    }
    run(g, steps);
  }

  /** The Ranedex's own D-pad, A and B while it's open (see `RanedexPanel`). */
  const dexNav = useRef<DexNav | null>(null);

  function pressA() {
    if (line) return advance();
    if (overlay === 'dex' && dexNav.current) return dexNav.current.a();
    if (!game || busy) return;
    const [dx, dy] = DELTA[game.face];
    const map = mapFor(game.map, game.flags);
    // Talk across a counter to whoever is behind it.
    const across = tileAt(map, game.x + dx, game.y + dy) === 'C' ? 2 : 1;
    interact(game.x + dx * across, game.y + dy * across, game.face, false);
  }

  function pressB() {
    if (line) return advance();
    if (overlay === 'dex' && dexNav.current?.b()) return playSfx('back');
    if (overlay && overlay !== 'starter' && overlay !== 'ending' && overlay !== 'offer-chat') {
      playSfx('back');
      closeOverlay();
    }
  }

  function pressStart() {
    if (!game || line || fight) return;
    if (overlay === 'menu') {
      playSfx('back');
      setOverlay(null);
    } else if (!overlay && !busy) {
      playSfx('select');
      setOverlay('menu');
    }
  }

  /** The Town Map, from the place name or the M key, whenever you could open the START menu. */
  function openMap() {
    if (!game || line || fight || flash || exclaim !== null || flight !== null) return;
    if (overlay === 'map') setOverlay(null);
    else if (!overlay || overlay === 'menu') setOverlay('map');
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

  /** A D-pad press a menu takes instead of walking. False when no menu wants it. */
  function menuDir(dir: Dir): boolean {
    if (overlay !== 'dex' || !dexNav.current || line) return false;
    dexNav.current.dir(dir);
    return true;
  }

  // Keyboard: arrows or WASD walk, Z/Space is A, X/Escape is B, Enter is START, M is the map.
  const keys = useRef({ pressA, pressB, pressStart, openMap, menuDir });
  useEffect(() => {
    keys.current = { pressA, pressB, pressStart, openMap, menuDir };
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
      if (dir && keys.current.menuDir(dir)) e.preventDefault();
      else if (dir) {
        held.current.dir = dir;
        if (!e.repeat) held.current.tapped = dir;
        e.preventDefault();
      } else if (e.repeat) return;
      else if (e.key === 'z' || e.key === ' ') keys.current.pressA();
      else if (e.key === 'x' || e.key === 'Escape') {
        held.current.b = true;
        keys.current.pressB();
      } else if (e.key === 'Enter') keys.current.pressStart();
      else if (e.key === 'm') keys.current.openMap();
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
    const pounds = outsideOf(mapById(game.map)).uk;
    const prize =
      result === 'win' && trainer
        ? `You got ${pounds ? '£' : '€'}${trainer.prize} for winning!`
        : undefined;
    const settled = settleBattle(game, state, result, fought, trainer !== null, trainer?.id, prize);
    let g = settled.state;
    // Scripts ask whether a particular Ranemon was befriended, such as the legend.
    if (result === 'caught') g = setFlag(g, `caught:${fight.teams[1][0].creature.id}`);
    if (result === 'win' && trainer) g = { ...g, money: g.money + trainer.prize };
    const steps: Run[] = settled.lines.map((text) => ({ do: 'say' as const, text }));
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

  /**
   * Finds the trainer's save: the newer of this browser's and the online one. `blocked` says why
   * the online one couldn't be opened, if it couldn't.
   */
  async function findSave(trainer: string) {
    const local = load(storage(), trainer);
    const online = await loadOnline(trainer, cloudNeedsPin() ? pin : undefined);
    if ('error' in online) {
      const blocked =
        online.error === 'pin'
          ? `That PIN doesn’t match the online save for “${trainer.trim()}”.`
          : online.error === 'locked'
            ? 'Too many wrong PINs for that name. Try again in 15 minutes.'
            : 'Couldn’t reach online saves just now.';
      return { save: local, blocked, offline: online.error === 'offline' };
    }
    return { save: newer(local, parseSave(online.raw)), blocked: null, offline: false };
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
    if (title.localOnly) {
      const local = load(storage(), name);
      if (local) return begin(name, local, false);
    }
    setTitle({ busy: true, note: null, replace: false });
    const { save: found, blocked, offline } = await findSave(name);
    if (blocked)
      setTitle({
        busy: false,
        note: found
          ? `${blocked} ${offline ? 'Try again in a minute' : 'Check it'}, or tap CONTINUE again to play this browser’s save without saving online.`
          : `${blocked} ${offline ? 'Try again in a minute.' : 'Check it, or pick another name.'}`,
        replace: false,
        localOnly: !!found,
      });
    else if (found) begin(name, found, false);
    // The developer save starts with everything unlocked.
    else if (await isDevName(name)) begin(name, devSave(), false);
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
      const { save: found, blocked, offline } = await findSave(name);
      if (blocked) {
        // Offline, a new game could later replace an online save it couldn't see.
        setTitle({
          busy: false,
          note: `${blocked} ${offline ? 'Try again in a minute.' : 'Check it, or pick another name.'}`,
          replace: false,
        });
        return;
      }
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
    if (await isDevName(name)) begin(name, devSave(), false);
    else begin(name, newGame(), true);
  }

  async function openTools() {
    const { save: current } = await findSave(name);
    setTools({ current: current ?? load(storage(), name) });
  }

  if (!game && tools) {
    return (
      <SaveTools
        name={name}
        storage={storage()}
        current={tools.current}
        onUse={(g, why) => {
          replace(storage(), g, name, why);
          setTools(null);
          begin(name, g, false);
        }}
        onClose={() => setTools(null)}
      />
    );
  }

  if (!game) {
    const needsPin = cloudNeedsPin();
    const ready = playerId(name).length > 0 && !title.busy && (!needsPin || isPin(pin));
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center text-ink">
        <SoundButton className="absolute right-2 top-2" />
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
          {needsPin && (
            <label className="flex flex-col gap-1 text-left text-[12px]">
              PIN (4 TO 8 NUMBERS)
              <input
                className="dialog px-3 py-2 text-[16px] outline-none focus:border-accent2"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setTitle({ busy: false, note: null, replace: false });
                }}
                data-testid="trainer-pin"
              />
            </label>
          )}
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
          <button
            type="button"
            className="pixel-btn menu-item text-[12px]"
            disabled={!ready}
            onClick={openTools}
            data-testid="open-save-tools"
          >
            BACKUPS AND SAVE CODES
          </button>
          <p className="text-[10px] leading-relaxed text-frame" aria-live="polite">
            {title.busy
              ? 'Looking for your save…'
              : (title.note ??
                (needsPin
                  ? 'Your save follows this name and PIN, so you can carry on from any device. A new name’s PIN is set by its first save.'
                  : hasCloudSaves()
                    ? 'Your save follows this name, so you can carry on from any device.'
                    : 'Your save is kept in this browser under this name. A save code carries it to another device.'))}
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
    const scene = sceneOf(mapById(game.map), fight.trainer, fight.teams[1][0].creature.id);
    return (
      <BattleScreen
        key={fight.key}
        teams={fight.teams}
        difficulty={fight.ai}
        foe={fight.foe}
        scene={scene}
        music={battleSong(scene, wild, fight.trainer)}
        flat={isFlat(mapFor(game.map, game.flags))}
        story={{
          bag,
          rate: wild ? catchRate(fight.teams[1][0].creature.id) : 0,
          caught: wild && caughtBefore(game, fight.teams[1][0].creature.id),
          onUse: (id) => setGame((g) => (g ? take(g, id as ItemId) : g)),
          expOf: (i) => (game.party[i] ? expProgress(game.party[i]) : 0),
        }}
        onFinish={finishBattle}
      />
    );
  }

  const map = mapFor(game.map, game.flags);
  const flags = new Set(game.flags);
  const walker = follower(game);
  const dog = companionOf(flags);
  const ghosts = find(map, '*').filter((p) => !flags.has(ghostFlag(map.id, p.x, p.y)));

  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div
        className="relative overflow-hidden rounded-md border-4 border-bezel bg-bezel"
        style={{ aspectRatio: '10 / 9' }}
      >
        <World
          map={map}
          pos={{ x: game.x, y: game.y, face: game.face }}
          flags={flags}
          follower={dog ? null : (walker?.species ?? null)}
          followerShiny={!!walker?.shiny}
          followerVariant={walker?.variant}
          dog={dog}
          frozen={busy}
          bike={hasFlag(game, LIMEPASS) ? 'lime' : hasFlag(game, 'bike') ? 'nelly' : null}
          look={lookOf(game, champion)}
          exclaim={exclaim}
          faces={faces}
          flight={flight}
          ghosts={ghosts}
          held={held}
          onStep={onStep}
          onTurn={(face) => setGame((g) => (g ? { ...g, face } : g))}
          onBump={(x, y, face) => {
            const tile = tileAt(map, x, y);
            if (DOORS.has(tile) || tile === EXIT) interact(x, y, face, true);
          }}
        />
        <button
          type="button"
          className="absolute left-1 top-1 rounded bg-panel/85 px-1.5 text-[9px] text-paper"
          onClick={openMap}
          aria-label={`${map.name}. Open the Town Map.`}
          data-testid="place"
        >
          {map.name} ▸
        </button>
        <div className="absolute right-1 top-1 flex gap-1">
          <SoundButton />
          <ViewButton />
          <SpeedButton />
        </div>
        {flash && (
          <div className={`encounter-flash absolute inset-0 ${flash === 'shiny' ? 'shiny' : ''}`} />
        )}
        {line && <EvolutionScene text={line.text} party={game.party} />}
        {line && (
          <button
            type="button"
            className="dialog absolute inset-x-0 bottom-0 z-10 min-h-[38%] whitespace-pre-line px-3 py-2 text-left text-[13px] leading-[1.8]"
            onClick={advance}
            data-sound="none"
            data-testid="story-text"
          >
            <TypedText key={line.n} text={line.text} instant={line.full} />
            <span className="blink ml-1 inline-block">▼</span>
          </button>
        )}
        {overlay === 'menu' && (
          <StartMenu
            expShare={!!game.expShare}
            limepass={hasFlag(game, LIMEPASS)}
            onPick={(o) => {
              if (o === 'share') {
                const g = toggleExpShare(game);
                persist(g);
                setGame(g);
              } else if (o === 'save') {
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
            onSwap={(i, slot, move) => {
              const g = {
                ...game,
                party: game.party.map((m, j) => (j === i ? swapMove(m, slot, move) : m)),
              };
              persist(g);
              setGame(g);
            }}
            onTakeHeld={(i) => {
              const g = takeHeld(game, i);
              persist(g);
              setGame(g);
            }}
            onClose={closeOverlay}
          />
        )}
        {overlay === 'bag' && (
          <BagPanel
            game={game}
            onClose={closeOverlay}
            onUseKey={(flag) => {
              setOverlay(null);
              if (flag === TABLET) return run(game, TAKE_TABLET);
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
                const r = blueGhost(m, game.party, levelCap(game));
                g = { ...g, party: g.party.map((x, j) => (j === i ? r.member : x)) };
                lines = r.lines;
              } else if (item.use.kind === 'hold') {
                g = holdItem(game, i, id);
                const back = m.held ? ` and gave back the ${itemById(m.held).name}` : '';
                lines = [
                  `${name} is now holding the ${item.name}${back}!`,
                  `Its ${item.use.stat.toUpperCase()} goes up ${Math.round((item.use.factor - 1) * 100)}% in every battle.`,
                ];
              } else if (item.use.kind === 'evolve') {
                const r = itemEvolve(m, id);
                const into = r.member.species;
                // Its new form goes in the Ranedex as befriended.
                g = befriend(
                  see({ ...g, party: g.party.map((x, j) => (j === i ? r.member : x)) }, into),
                  into,
                );
                lines = [`${name} put on the ${item.name}!`, ...r.lines];
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
            stall={stall}
            onClose={closeOverlay}
            onBuy={(id) => {
              const price = priceOf(id, stall);
              if (game.money >= price) setGame(give({ ...game, money: game.money - price }, id));
            }}
          />
        )}
        {overlay === 'departures' && (
          <DeparturesPanel game={game} onPick={(d) => answer(ticket(d))} onClose={closeOverlay} />
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
        {overlay === 'dex' && <RanedexPanel game={game} onClose={closeOverlay} navRef={dexNav} />}
        {overlay === 'card' && (
          <JerseysPanel game={game} champion={champion} onClose={closeOverlay} />
        )}
        {overlay === 'skins' && (
          <SkinsPanel
            game={game}
            champion={champion}
            onWear={(id) => {
              const g = wearSkin(game, id, champion);
              persist(g);
              setGame(g);
            }}
            onClose={closeOverlay}
          />
        )}
        {overlay === 'missions' && <MissionsPanel game={game} onClose={closeOverlay} />}
        {overlay === 'map' && <TownMapPanel game={game} onClose={closeOverlay} />}
        {overlay === 'limepass' && (
          <LimepassPanel
            flags={flags}
            here={outsideOf(map).id}
            uk={!!outsideOf(map).uk}
            onGo={(stop) => {
              setOverlay(null);
              run(game, [
                { do: 'travel', map: stop.map, x: stop.x, y: stop.y, face: stop.face },
                { do: 'say', text: `You hop on a Lime and zip over to ${stop.town}.` },
              ]);
            }}
            onClose={closeOverlay}
          />
        )}
        {overlay === 'starter' && (
          <StarterPanel
            uk={ukStarter}
            onChoose={(species) => {
              const g = ukStarter
                ? setFlag(
                    {
                      ...recruit(game, species, UK_LEVEL, { variant: UK }).state,
                      ukStarter: species,
                    },
                    UK_STARTER,
                  )
                : setFlag({ ...recruit(game, species, 5).state, starter: species }, 'starter');
              setOverlay(null);
              run(g, [
                {
                  do: 'say',
                  text: ukStarter
                    ? `You chose ${speciesById(species).name}! It finished the pint, even though it was poured badly.`
                    : `You chose ${speciesById(species).name}! It finished the pint in one go.`,
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
          if (on && menuDir(dir)) return;
          if (on) held.current.dir = held.current.tapped = dir;
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
  expShare,
  limepass,
  onPick,
  onClose,
}: {
  expShare: boolean;
  /** Whether you have the Limepass, which adds LIMEPASS to the menu. */
  limepass: boolean;
  onPick: (
    o:
      | 'party'
      | 'bag'
      | 'dex'
      | 'map'
      | 'missions'
      | 'limepass'
      | 'card'
      | 'skins'
      | 'share'
      | 'save',
  ) => void;
  onClose: () => void;
}) {
  const items = [
    ['party', 'PARTY'],
    ['bag', 'BAG'],
    ['dex', 'RANEDEX'],
    ['map', 'MAP'],
    ['missions', 'MISSIONS'],
    ...(limepass ? ([['limepass', 'LIMEPASS']] as const) : []),
    ['card', 'JERSEYS'],
    ['skins', 'SKINS'],
    ['share', `EXP SHARE: ${expShare ? 'ON' : 'OFF'}`],
    ['save', 'SAVE'],
  ] as const;
  return (
    <div className="dialog absolute right-0 top-0 z-20 flex max-h-full w-[55%] flex-col gap-1 overflow-y-auto p-2">
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
      data-sound="none"
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
