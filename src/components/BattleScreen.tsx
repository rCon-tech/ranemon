'use client';

import { useEffect, useReducer, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import {
  legalActions,
  startBattle,
  switchTargets,
  type Action,
  type BattleState,
  type Entrant,
} from '@/lib/battle/engine';
import { FLAIL, moveById, type Move } from '@/lib/battle/moves';
import { matchup, TYPE_COLOR, TYPE_LABEL, type RaneType } from '@/lib/battle/types';
import { canUse, type ItemUse } from '@/lib/story/items';
import type { Foe } from '@/lib/ui/playback';
import { scaled } from '@/lib/speed';
import {
  isChoosing,
  reduce,
  startSession,
  type Outgoing,
  type QueueItem,
  type Result,
} from '@/lib/ui/session';
import { battleCues } from '@/lib/sound/cues';
import { playJingle, playSfx } from '@/lib/sound/engine';
import type { SongId } from '@/lib/sound/songs';
import { play, SoundButton, useMusic } from './Sound';
import { InfoBox } from './InfoBox';
import { MoveEffect } from './MoveEffect';
import { hasSpecialEffect, SpecialEffect } from './SpecialEffect';
import { Backdrop } from './Backdrop';
import { SpeedButton, useAnimationSpeed } from './SpeedButton';
import { useView, ViewButton } from './ViewButton';

/** The 3D battlefield and its WebGL library load only when the 3D look is picked. */
const Backdrop3D = dynamic(() => import('./Backdrop3D'), { ssr: false, loading: () => null });
import { TypedText } from './TypedText';
import { Sprite } from './Sprite';
import { ShinyCelebration, ShinySparkle } from './ShinySparkle';

/** One kind of item in the story bag, as the battle screen shows it. */
export interface BagEntry {
  id: string;
  name: string;
  count: number;
  use: ItemUse;
}

/** What story mode adds to a battle: the bag, catching, and EXP bars. */
export interface StoryBattle {
  bag: BagEntry[];
  /** The befriend rate of the wild Ranemon. */
  rate: number;
  /** Called when an item is used, so the story can take it out of the bag. */
  onUse: (id: string) => void;
  /** How far through its level each of your Ranemon is, 0 to 1. */
  expOf: (index: number) => number;
}

export type Scene = 'field' | 'city' | 'gym' | 'night';

/** A live battle against a friend: the save server plays the turns (`lib/online/link.ts`). */
export interface RemoteBattle {
  /** The battle as the server started it (or as it stands, when coming back to it). */
  start: { state: BattleState; events: QueueItem[] };
  send: (out: Outgoing) => void;
  /** Hears what happened next. Returns a function that stops listening. */
  listen: (fn: (state: BattleState, items: QueueItem[]) => void) => () => void;
}

interface Props {
  /** The teams for a battle played here; a remote battle brings its own. */
  teams?: [(Creature | Entrant)[], (Creature | Entrant)[]];
  remote?: RemoteBattle;
  difficulty: Difficulty;
  /** Battle mode fights the rival; story mode passes the trainer or a wild Ranemon. */
  foe?: Foe;
  story?: StoryBattle;
  /** Where the fight is, for the battlefield's backdrop. */
  scene?: Scene;
  /** The battle theme; battle mode's rival gets the trainers' one. */
  music?: SongId;
  onFinish: (result: Result, state: BattleState, fought: number[]) => void;
}

/** Items only used from the bag outside battle: a Blue Ghost, or one that sets off an evolution. */
const OUTSIDE_BATTLE: ItemUse['kind'][] = ['level', 'evolve', 'hold'];

const CATEGORY_LABEL: Record<Move['category'], string> = {
  physical: 'Physical',
  spirit: 'Spirit',
  status: 'Status',
};

/** What a move does, shown in the text box when it's picked and before it's used. */
function MoveInfo({
  move,
  pp,
  foe,
}: {
  move: Move;
  pp: number | null;
  foe: { name: string; types: readonly RaneType[] };
}) {
  const m = move.category === 'status' ? null : matchup(move.type, foe.types);
  return (
    <span className="flex flex-col gap-1.5 text-[11px] leading-relaxed" data-testid="move-info">
      <span className="text-[14px]">
        {move.signature && <span className="text-accent">★ </span>}
        {move.name}
      </span>
      <span>
        {move.type ? TYPE_LABEL[move.type] : 'No type'} · {CATEGORY_LABEL[move.category]}
        {move.priority > 0 ? ' · Goes first' : ''}
      </span>
      <span>
        POW {move.power || '—'} · ACC {move.accuracy === null ? '—' : `${move.accuracy}%`}
        {pp !== null && ` · PP ${pp}/${move.pp}`}
      </span>
      {m && (
        <span data-testid="move-matchup" data-tone={m.tone}>
          <span className={`matchup matchup-${m.tone}`}>{m.short}</span> {m.label} against{' '}
          {foe.name}.
        </span>
      )}
      <span className="opacity-80">{move.flavour}</span>
    </span>
  );
}

/** A fresh random number for actions that need one; the reducer itself stays pure. */
const roll = () => Math.random();

function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] | 0;
}

export function BattleScreen({
  teams,
  difficulty,
  foe: against,
  story,
  scene = 'field',
  music = 'trainer',
  remote,
  onFinish,
}: Props) {
  const [session, dispatch] = useReducer(reduce, null, () =>
    startSession(remote?.start ?? startBattle(teams!, newSeed()), difficulty, {
      foe: against,
      timer: !story,
      remote: !!remote,
    }),
  );
  // The bag item picked in the BAG menu, waiting for a Ranemon to use it on.
  const [bagPick, setBagPick] = useState<BagEntry | null>(null);
  const [bagNote, setBagNote] = useState<string | null>(null);
  const { state, view, mode, message, hits, entries, lunges, effect, line, timeLeft, result } =
    session;
  const { queue, pause } = session;
  // The move picked in the FIGHT menu, for the turn it was picked in. A second tap uses it.
  const [picked, setPicked] = useState<{ turn: number; index: number } | null>(null);

  // Playback: wait long enough to read the current line, then take the next step.
  useEffect(() => {
    if (mode !== 'playing') return;
    const id = setTimeout(() => dispatch({ type: 'step', random: roll() }), scaled(pause));
    return () => clearTimeout(id);
  }, [mode, queue, pause]);

  // Online: send each choice, and play back what the server says happened.
  const { outbox } = session;
  useEffect(() => {
    if (outbox) remote?.send(outbox);
    // Each choice once, by its number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outbox?.n]);
  useEffect(
    () => remote?.listen((state, items) => dispatch({ type: 'remote', state, items })),
    [remote],
  );

  // The turn timer: when it runs out, a random legal move is used.
  const choosing = isChoosing(mode);
  useEffect(() => {
    if (!choosing) return;
    const id = setTimeout(() => dispatch({ type: 'tick', random: roll() }), 1000);
    return () => clearTimeout(id);
  }, [choosing, timeLeft]);

  // Sound: each step of playback's effects, the last seconds of the timer, and the ending.
  useEffect(() => {
    if (session.last) play(battleCues(session.last, session.state, session.view));
    // Only once per step played.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.played]);
  useEffect(() => {
    if (choosing && session.timer && timeLeft <= 5) playSfx('tick');
  }, [choosing, session.timer, timeLeft]);
  useEffect(() => {
    if (result === 'loss') playJingle('lose');
  }, [result]);
  useMusic(result === 'win' || result === 'caught' ? 'victory' : result ? null : music);

  const act = (action: Action) => dispatch({ type: 'act', action, random: roll() });
  const advance = () => dispatch({ type: 'step', random: roll() });
  const replace = (to: number) => dispatch({ type: 'replace', to });
  const setMode = (m: 'menu' | 'fight' | 'switch' | 'bag' | 'confirm-run') => {
    setBagPick(null);
    setBagNote(null);
    dispatch({ type: 'open', mode: m });
  };
  const run = () => dispatch({ type: 'run', random: roll() });
  const spendEntry = (entry: BagEntry, target: number) => {
    if (entry.use.kind !== 'heal' && entry.use.kind !== 'vape') return;
    story?.onUse(entry.id);
    setBagPick(null);
    dispatch({ type: 'item', name: entry.name, effect: entry.use.effect, target, random: roll() });
  };
  const pickEntry = (entry: BagEntry) => {
    if (entry.use.kind === 'pint') {
      if (session.foe.kind !== 'wild') {
        setBagNote('That’s someone else’s Ranemon. Get your own round in.');
        return;
      }
      story?.onUse(entry.id);
      dispatch({ type: 'pint', pint: entry.use.pint, rate: story?.rate ?? 120, random: roll() });
      return;
    }
    // A vape is always for the Ranemon that's out.
    if (entry.use.kind === 'vape') {
      const out = state.teams[0].battlers[view[0].active];
      const { stat } = entry.use.effect;
      const ok = canUse(entry.use, {
        hp: out.hp,
        maxHp: out.stats.hp,
        status: out.status,
        level: out.level,
        active: true,
        stages: out.stages,
      });
      if (ok) spendEntry(entry, view[0].active);
      else setBagNote(`${out.creature.name}’s ${stat.toUpperCase()} won’t go any higher!`);
      return;
    }
    setBagNote(null);
    setBagPick(entry);
  };
  const forfeit = () => dispatch({ type: 'forfeit' });

  const me = state.teams[0].battlers[view[0].active];
  const foe = state.teams[1].battlers[view[1].active];
  const legal = legalActions(state, 0);
  // With every move out of PP, any move button uses Flail.
  const flail = me.pp.every((p) => p === 0);
  const canSwitch = switchTargets(state, 0).length > 0;
  const selected = mode === 'fight' && picked?.turn === state.turn ? picked.index : null;
  const use = (index: number) => {
    setPicked(null);
    act({ kind: 'move', index: flail ? 0 : index });
  };

  const special = effect !== null && hasSpecialEffect(effect.moveId);
  useAnimationSpeed();
  const look = useView();

  return (
    <div className="flex flex-1 flex-col">
      <div className="field" data-scene={scene} data-testid="battlefield">
        <div className="absolute right-1 top-1 z-20 flex gap-1">
          <SoundButton />
          <ViewButton />
          <SpeedButton />
        </div>
        {look === '3d' ? <Backdrop3D scene={scene} /> : <Backdrop scene={scene} />}
        <div className="sprite-slot slot-foe">
          {effect?.side === 1 && !special && <MoveEffect key={effect.n} moveId={effect.moveId} />}
          {view[1].shown ? (
            <div key={`in-${entries[1]}`} className="anim-in-foe h-full w-full">
              <div
                key={`lunge-${lunges[1]}`}
                className={lunges[1] > 0 ? 'anim-lunge-foe h-full w-full' : 'h-full w-full'}
              >
                <div
                  key={`hit-${hits[1]}`}
                  className={hits[1] > 0 ? 'anim-hit h-full w-full' : 'h-full w-full'}
                >
                  <Sprite creature={foe.creature} solid={look === '3d'} />
                </div>
              </div>
              {foe.creature.shiny && <ShinySparkle />}
            </div>
          ) : (
            foe.hp === 0 &&
            entries[1] > 0 && (
              <div key={`faint-${view[1].active}`} className="anim-faint h-full w-full">
                <Sprite creature={foe.creature} solid={look === '3d'} />
              </div>
            )
          )}
        </div>
        <div className="sprite-slot slot-you">
          {effect?.side === 0 && !special && <MoveEffect key={effect.n} moveId={effect.moveId} />}
          {view[0].shown ? (
            <div key={`in-${entries[0]}`} className="anim-in-you h-full w-full">
              <div
                key={`lunge-${lunges[0]}`}
                className={lunges[0] > 0 ? 'anim-lunge-you h-full w-full' : 'h-full w-full'}
              >
                <div
                  key={`hit-${hits[0]}`}
                  className={hits[0] > 0 ? 'anim-hit h-full w-full' : 'h-full w-full'}
                >
                  <Sprite creature={me.creature} back solid={look === '3d'} />
                </div>
              </div>
              {me.creature.shiny && <ShinySparkle />}
            </div>
          ) : (
            me.hp === 0 &&
            entries[0] > 0 && (
              <div key={`faint-${view[0].active}`} className="anim-faint h-full w-full">
                <Sprite creature={me.creature} back solid={look === '3d'} />
              </div>
            )
          )}
        </div>
        {view[1].shown && (
          <InfoBox
            battler={foe}
            hp={view[1].hp[view[1].active]}
            status={view[1].status[view[1].active]}
            mine={false}
          />
        )}
        {view[0].shown && (
          <InfoBox
            battler={me}
            hp={view[0].hp[view[0].active]}
            status={view[0].status[view[0].active]}
            mine
            exp={story?.expOf(view[0].active)}
          />
        )}
        {special && <SpecialEffect key={effect.n} moveId={effect.moveId} user={effect.user} />}
        {foe.creature.shiny && (result === 'caught' || message.startsWith('★ A SHINY')) && (
          <ShinyCelebration name={foe.creature.name} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 bg-shell p-3">
        <button
          type="button"
          className="dialog min-h-[76px] w-full px-4 py-3 text-left text-[15px] leading-[1.9]"
          onClick={mode === 'playing' ? advance : undefined}
          aria-live="polite"
          data-sound="none"
          data-testid="text-box"
        >
          {bagNote && mode === 'bag' ? (
            bagNote
          ) : bagPick && mode === 'bag' ? (
            `Use the ${bagPick.name} on which Ranemon?`
          ) : selected !== null ? (
            <MoveInfo
              move={flail ? FLAIL : moveById(me.creature.moves[selected])}
              pp={flail ? null : me.pp[selected]}
              foe={foe.creature}
            />
          ) : (
            <TypedText key={line} text={message} />
          )}
          {mode === 'playing' && <span className="blink ml-1 inline-block">▼</span>}
        </button>

        {choosing && (
          <div className="flex items-center justify-between text-[11px] text-ink">
            <span>Turn {state.turn}</span>
            {session.timer && <span aria-label="Time left this turn">⏱ {timeLeft}s</span>}
          </div>
        )}

        {mode === 'menu' && story && (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Actions">
            <button
              type="button"
              className="pixel-btn menu-item"
              data-cmd="fight"
              onClick={() => setMode('fight')}
            >
              FIGHT
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
              data-cmd="bag"
              onClick={() => setMode('bag')}
            >
              BAG
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
              data-cmd="party"
              disabled={!canSwitch}
              onClick={() => setMode('switch')}
            >
              RANEMON
            </button>
            <button type="button" className="pixel-btn menu-item" data-cmd="run" onClick={run}>
              RUN
            </button>
          </div>
        )}

        {mode === 'bag' && (
          <div className="flex flex-col gap-2" role="group" aria-label="Bag">
            {!bagPick &&
              (story?.bag ?? [])
                .filter((e) => e.count > 0 && !OUTSIDE_BATTLE.includes(e.use.kind))
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="pixel-btn menu-item flex justify-between text-[13px]"
                    onClick={() => pickEntry(e)}
                  >
                    <span>{e.name}</span>
                    <span>×{e.count}</span>
                  </button>
                ))}
            {bagPick &&
              state.teams[0].battlers.map((b, i) => {
                if (b.left) return null;
                const ok = canUse(bagPick.use, {
                  hp: b.hp,
                  maxHp: b.stats.hp,
                  status: b.status,
                  level: b.level,
                  active: i === view[0].active,
                  stages: b.stages,
                });
                return (
                  <button
                    key={i}
                    type="button"
                    className="pixel-btn flex items-center gap-3"
                    disabled={!ok}
                    onClick={() => spendEntry(bagPick, i)}
                  >
                    <span className="h-9 w-9 shrink-0">
                      <Sprite creature={b.creature} />
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="text-[13px]">
                        {b.creature.shiny && <span className="shiny-name">★</span>}
                        {b.creature.name} Lv{b.level}
                      </span>
                      <span className="text-[10px] opacity-75">
                        {b.hp === 0 ? 'Fainted' : `HP ${b.hp}/${b.stats.hp}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            {(story?.bag ?? []).every(
              (e) => e.count === 0 || OUTSIDE_BATTLE.includes(e.use.kind),
            ) && <p className="text-[13px] text-ink">The bag is empty.</p>}
            <button
              type="button"
              className="pixel-btn self-end text-[13px]"
              onClick={() => (bagPick ? setBagPick(null) : setMode('menu'))}
            >
              BACK
            </button>
          </div>
        )}

        {mode === 'menu' && !story && (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Actions">
            <button
              type="button"
              className="pixel-btn menu-item col-span-2"
              data-cmd="fight"
              onClick={() => setMode('fight')}
            >
              FIGHT
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
              data-cmd="party"
              disabled={!canSwitch}
              onClick={() => setMode('switch')}
            >
              RANEMON
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
              data-cmd="run"
              onClick={() => setMode('confirm-run')}
            >
              RUN
            </button>
          </div>
        )}

        {mode === 'fight' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Moves">
              {me.creature.moves.map((id, index) => {
                const move = moveById(id);
                const allowed = legal.some((a) => a.kind === 'move' && a.index === index);
                const m =
                  move.category === 'status' ? null : matchup(move.type, foe.creature.types);
                return (
                  <button
                    key={id}
                    type="button"
                    className="pixel-btn move-btn flex flex-col gap-1.5"
                    style={
                      { '--type': move.type ? TYPE_COLOR[move.type] : '#8890a0' } as CSSProperties
                    }
                    data-type={move.type ?? undefined}
                    disabled={!allowed && !flail}
                    aria-pressed={selected === index}
                    onClick={() =>
                      selected === index ? use(index) : setPicked({ turn: state.turn, index })
                    }
                    title={move.flavour}
                  >
                    <span className="flex items-start justify-between gap-1 text-[13px] leading-snug">
                      <span>
                        {move.signature && <span className="text-gold">★ </span>}
                        {move.name}
                      </span>
                      {m && (
                        <span className={`matchup matchup-${m.tone}`} title={m.label}>
                          {m.short}
                        </span>
                      )}
                    </span>
                    <span className="flex justify-between text-[10px] opacity-90">
                      <span>{move.type ? TYPE_LABEL[move.type] : '—'}</span>
                      <span>
                        PP {me.pp[index]}/{move.pp}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="pixel-btn text-[13px]"
                onClick={() => {
                  setPicked(null);
                  setMode('menu');
                }}
              >
                BACK
              </button>
              <button
                type="button"
                className="pixel-btn flex-1 text-[13px]"
                disabled={selected === null}
                onClick={() => selected !== null && use(selected)}
              >
                {selected === null
                  ? 'TAP A MOVE TO SEE IT'
                  : `USE ${(flail ? FLAIL : moveById(me.creature.moves[selected])).name.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}

        {(mode === 'switch' || mode === 'forced-switch') && (
          <div className="flex flex-col gap-2" role="group" aria-label="Your team">
            {state.teams[0].battlers.map((b, i) => {
              if (b.left) return null;
              const out = i === state.teams[0].active;
              const allowed = switchTargets(state, 0).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  className="pixel-btn flex items-center gap-3"
                  disabled={!allowed}
                  onClick={() =>
                    mode === 'forced-switch' ? replace(i) : act({ kind: 'switch', to: i })
                  }
                >
                  <span className="h-9 w-9 shrink-0">
                    <Sprite creature={b.creature} />
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="text-[13px]">
                      {b.creature.shiny && <span className="shiny-name">★</span>}
                      {b.creature.name}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {b.hp === 0 ? 'Fainted' : `HP ${b.hp}/${b.stats.hp}`}
                      {out && b.hp > 0 ? ' · In battle' : ''}
                    </span>
                  </span>
                </button>
              );
            })}
            {mode === 'switch' && (
              <button
                type="button"
                className="pixel-btn self-end text-[13px]"
                onClick={() => setMode('menu')}
              >
                BACK
              </button>
            )}
          </div>
        )}

        {mode === 'confirm-run' && (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] leading-relaxed text-ink">Forfeit? It counts as a loss.</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="pixel-btn menu-item" onClick={forfeit}>
                YES
              </button>
              <button type="button" className="pixel-btn menu-item" onClick={() => setMode('menu')}>
                NO
              </button>
            </div>
          </div>
        )}

        {mode === 'over' && result && (
          <button
            type="button"
            className="pixel-btn menu-item"
            onClick={() => onFinish(result, state, session.fought)}
          >
            CONTINUE
          </button>
        )}
      </div>
    </div>
  );
}
