import { playerId } from '../story/state';
import type { BattleInput } from './battle';
import type { SeshAction, SeshRun } from './run';

/**
 * The Sesh keeps its own saves, never touching a story save: in this browser under
 * `ranemon.sesh.v1:<name>`, for the trainer name typed on its start screen. A save is the run as
 * it stands and every choice that made it, so it can be replayed (for the leaderboard), plus
 * the choices so far in a battle that's still going.
 */
export interface SeshSave {
  v: 1;
  run: SeshRun;
  actions: SeshAction[];
  /** The battle in the node you're in, as far as it's got. */
  fight?: BattleInput[];
}

/** The trainer name last used for The Sesh. */
export const SESH_PLAYER_KEY = 'ranemon.sesh.player';
export const seshKey = (name: string) => `ranemon.sesh.v1:${playerId(name)}`;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSesh(name: string): SeshSave | null {
  try {
    const raw = storage()?.getItem(seshKey(name));
    if (!raw) return null;
    const save = JSON.parse(raw) as SeshSave;
    return save?.v === 1 && save.run && Array.isArray(save.actions) ? save : null;
  } catch {
    return null;
  }
}

export function storeSesh(name: string, save: SeshSave | null) {
  try {
    const s = storage();
    if (!s) return;
    if (save) s.setItem(seshKey(name), JSON.stringify(save));
    else s.removeItem(seshKey(name));
    s.setItem(SESH_PLAYER_KEY, name);
  } catch {
    // Storage full or blocked: the run carries on for this visit.
  }
}

export function lastSeshPlayer(): string {
  try {
    return storage()?.getItem(SESH_PLAYER_KEY) ?? storage()?.getItem('ranemon.player') ?? '';
  } catch {
    return '';
  }
}

/** Your best free runs, kept as your own record (each has a different party, so not ranked). */
export interface SeshBest {
  score: number;
  beaten: number;
  standing: number;
  at: string;
}

const bestKey = (name: string) => `ranemon.sesh.best:${playerId(name)}`;

export function loadBests(name: string): SeshBest[] {
  try {
    const list = JSON.parse(storage()?.getItem(bestKey(name)) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Keeps a finished run among your 5 best, highest first. */
export function recordBest(name: string, best: SeshBest): SeshBest[] {
  const list = [...loadBests(name), best].sort((a, b) => b.score - a.score).slice(0, 5);
  try {
    storage()?.setItem(bestKey(name), JSON.stringify(list));
  } catch {
    // Kept for this visit only.
  }
  return list;
}
