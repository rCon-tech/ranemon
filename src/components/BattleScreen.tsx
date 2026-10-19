'use client';

import { useEffect, useReducer } from 'react';
import type { Difficulty } from '@/lib/battle/cpu';
import type { Creature } from '@/lib/battle/creature';
import { legalActions, startBattle, switchTargets, type Action } from '@/lib/battle/engine';
import { moveById } from '@/lib/battle/moves';
import { TYPE_COLOR, TYPE_LABEL } from '@/lib/battle/types';
import { isChoosing, reduce, startSession, type Result } from '@/lib/ui/session';
import { InfoBox } from './InfoBox';
import { Sprite } from './Sprite';

interface Props {
  teams: [Creature[], Creature[]];
  difficulty: Difficulty;
  onFinish: (result: Result) => void;
}

/** A fresh random number for actions that need one; the reducer itself stays pure. */
const roll = () => Math.random();

function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] | 0;
}

export function BattleScreen({ teams, difficulty, onFinish }: Props) {
  const [session, dispatch] = useReducer(reduce, null, () =>
    startSession(startBattle(teams, newSeed()), difficulty),
  );
  const { state, view, mode, message, hits, entries, timeLeft, result, queue, pause } = session;

  // Playback: wait long enough to read the current line, then take the next step.
  useEffect(() => {
    if (mode !== 'playing') return;
    const id = setTimeout(() => dispatch({ type: 'step', random: roll() }), pause);
    return () => clearTimeout(id);
  }, [mode, queue, pause]);

  // The turn timer: when it runs out, a random legal move is used.
  const choosing = isChoosing(mode);
  useEffect(() => {
    if (!choosing) return;
    const id = setTimeout(() => dispatch({ type: 'tick', random: roll() }), 1000);
    return () => clearTimeout(id);
  }, [choosing, timeLeft]);

  const act = (action: Action) => dispatch({ type: 'act', action, random: roll() });
  const advance = () => dispatch({ type: 'step', random: roll() });
  const replace = (to: number) => dispatch({ type: 'replace', to });
  const setMode = (m: 'menu' | 'fight' | 'switch' | 'confirm-run') =>
    dispatch({ type: 'open', mode: m });
  const forfeit = () => dispatch({ type: 'forfeit' });

  const me = state.teams[0].battlers[view[0].active];
  const foe = state.teams[1].battlers[view[1].active];
  const legal = legalActions(state, 0);
  // With every move out of PP, any move button uses Flail.
  const flail = me.pp.every((p) => p === 0);
  const canSwitch = switchTargets(state, 0).length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="field" data-testid="battlefield">
        <div className="platform platform-foe" />
        <div className="platform platform-you" />
        <div className="sprite-slot slot-foe">
          {view[1].shown ? (
            <div key={`in-${entries[1]}`} className="anim-in-foe h-full w-full">
              <div
                key={`hit-${hits[1]}`}
                className={hits[1] > 0 ? 'anim-hit h-full w-full' : 'h-full w-full'}
              >
                <Sprite creature={foe.creature} />
              </div>
            </div>
          ) : (
            foe.hp === 0 &&
            entries[1] > 0 && (
              <div key={`faint-${view[1].active}`} className="anim-faint h-full w-full">
                <Sprite creature={foe.creature} />
              </div>
            )
          )}
        </div>
        <div className="sprite-slot slot-you">
          {view[0].shown ? (
            <div key={`in-${entries[0]}`} className="anim-in-you h-full w-full">
              <div
                key={`hit-${hits[0]}`}
                className={hits[0] > 0 ? 'anim-hit h-full w-full' : 'h-full w-full'}
              >
                <Sprite creature={me.creature} back />
              </div>
            </div>
          ) : (
            me.hp === 0 &&
            entries[0] > 0 && (
              <div key={`faint-${view[0].active}`} className="anim-faint h-full w-full">
                <Sprite creature={me.creature} back />
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
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 bg-shell p-3">
        <button
          type="button"
          className="dialog min-h-[76px] w-full px-4 py-3 text-left text-[11px] leading-[1.9]"
          onClick={mode === 'playing' ? advance : undefined}
          aria-live="polite"
          data-testid="text-box"
        >
          {message}
          {mode === 'playing' && <span className="blink ml-1 inline-block">▼</span>}
        </button>

        {choosing && (
          <div className="flex items-center justify-between text-[8px] text-paper">
            <span>Turn {state.turn}</span>
            <span aria-label="Time left this turn">⏱ {timeLeft}s</span>
          </div>
        )}

        {mode === 'menu' && (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Actions">
            <button
              type="button"
              className="pixel-btn menu-item col-span-2"
              onClick={() => setMode('fight')}
            >
              FIGHT
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
              disabled={!canSwitch}
              onClick={() => setMode('switch')}
            >
              RANEMON
            </button>
            <button
              type="button"
              className="pixel-btn menu-item"
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
                return (
                  <button
                    key={id}
                    type="button"
                    className="pixel-btn flex flex-col gap-1.5"
                    style={{
                      borderLeft: `10px solid ${move.type ? TYPE_COLOR[move.type] : '#888'}`,
                    }}
                    disabled={!allowed && !flail}
                    onClick={() => act({ kind: 'move', index: flail ? 0 : index })}
                    title={move.flavour}
                  >
                    <span className="text-[9px] leading-snug">
                      {move.signature && <span className="text-[#d8a000]">* </span>}
                      {move.name}
                    </span>
                    <span className="flex justify-between text-[7px] opacity-75">
                      <span>{move.type ? TYPE_LABEL[move.type] : '—'}</span>
                      <span>
                        PP {me.pp[index]}/{move.pp}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="pixel-btn self-end text-[9px]"
              onClick={() => setMode('menu')}
            >
              BACK
            </button>
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
                    <span className="text-[9px]">{b.creature.name}</span>
                    <span className="text-[7px] opacity-75">
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
                className="pixel-btn self-end text-[9px]"
                onClick={() => setMode('menu')}
              >
                BACK
              </button>
            )}
          </div>
        )}

        {mode === 'confirm-run' && (
          <div className="flex flex-col gap-2">
            <p className="text-[9px] leading-relaxed text-paper">Forfeit? It counts as a loss.</p>
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
          <button type="button" className="pixel-btn menu-item" onClick={() => onFinish(result)}>
            CONTINUE
          </button>
        )}
      </div>
    </div>
  );
}
