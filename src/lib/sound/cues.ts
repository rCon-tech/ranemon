import type { BattleState } from '../battle/engine';
import { moveById } from '../battle/moves';
import type { QueueItem } from '../ui/session';
import type { View } from '../ui/playback';
import { moveSfx, type SfxId } from './sfx';
import type { JingleId, SongId } from './songs';

/**
 * Which sound goes with what: the battle's events, story lines, and where you are. Kept apart
 * from the audio itself so it can be tested.
 */
export type Cue =
  | { sfx: SfxId; delay?: number }
  | { cry: string; low?: boolean; delay?: number }
  | { jingle: JingleId };

/** The sounds for one step of a battle's playback. `view` is the view after it. */
export function battleCues(item: QueueItem, state: BattleState, view: View): Cue[] {
  switch (item.kind) {
    case 'say':
      return lineCues(item.text);
    case 'end':
    case 'win':
      return [];
    case 'send-out': {
      const c = state.teams[item.side].battlers[item.index].creature;
      return [
        { sfx: 'send' },
        { cry: c.id, delay: 0.25 },
        ...(c.shiny ? [{ sfx: 'shiny' as const, delay: 0.7 }] : []),
      ];
    }
    case 'wild-partner':
      return [{ cry: state.teams[item.side].battlers[item.index].creature.id }];
    case 'withdraw':
      return [{ sfx: 'withdraw' }];
    case 'move': {
      const m = moveById(item.moveId);
      return [{ sfx: moveSfx(m.type, m.category === 'status', !!m.signature) }];
    }
    case 'miss':
      return [{ sfx: 'miss' }];
    case 'damage':
      if (item.crit) return [{ sfx: 'crit' }];
      return [
        { sfx: item.effectiveness > 1 ? 'hit-super' : item.effectiveness < 1 ? 'hit-weak' : 'hit' },
      ];
    case 'recoil':
    case 'status-damage':
    case 'self-damage':
      return [{ sfx: 'hit-weak' }];
    case 'heal':
      return item.amount > 0 ? [{ sfx: 'heal' }] : [];
    case 'status':
      return [{ sfx: item.status }];
    case 'fluster-skip':
      return [{ sfx: 'flustered' }];
    case 'asleep':
      return [{ sfx: 'asleep' }];
    case 'wake':
      return [{ sfx: 'wake' }];
    case 'stat':
      return [{ sfx: item.change > 0 ? 'stat-up' : 'stat-down' }];
    case 'boost':
      return [{ sfx: item.factor > 1 ? 'stat-up' : 'stat-down' }];
    case 'status-failed':
    case 'stat-limit':
      return [{ sfx: 'fail' }];
    case 'swap-hp':
      return [{ sfx: 'swap' }];
    case 'hits':
      return [];
    case 'faint': {
      const c = state.teams[item.side].battlers[view[item.side].active].creature;
      return [
        { cry: c.id, low: true },
        { sfx: 'faint', delay: 0.4 },
      ];
    }
  }
}

/** Sounds for a line of text, in battle or out: items, levels, the pub, pints and Norm. */
export function lineCues(text: string): Cue[] {
  if (/^You got /.test(text)) return [{ jingle: 'item' }];
  if (/ grew to Lv\d+!$/.test(text)) return [{ jingle: 'level' }];
  if (/ learned .+!/.test(text)) return [{ sfx: 'stat-up' }];
  if (/ is evolving!$/.test(text)) return [{ sfx: 'evolving' }];
  if (/ evolved into .+!$/.test(text)) return [{ jingle: 'evolved' }];
  if (/fighting fit again/.test(text)) return [{ jingle: 'heal' }];
  if (/^Gotcha!/.test(text)) return [{ jingle: 'caught' }];
  if (/^You threw a /.test(text)) return [{ sfx: 'throw' }];
  if (/^Sip…/.test(text)) return [{ sfx: 'sip' }];
  if (/^(Oh no|Aww|Argh)!/.test(text)) return [{ sfx: 'fail' }];
  if (/^Got away safely/.test(text)) return [{ sfx: 'run' }];
  if (/^Can’t escape/.test(text)) return [{ sfx: 'fail' }];
  if (/^You used a /.test(text)) return [{ sfx: 'heal' }];
  if (/^Norm found something/.test(text)) return [{ sfx: 'bark' }];
  if (/^Something glints/.test(text)) return [{ sfx: 'sparkle' }];
  if (/^You hop on a Lime/.test(text)) return [{ sfx: 'bell' }];
  if (/^Saved\./.test(text)) return [{ sfx: 'save' }];
  return [];
}

/** The kind of room behind a door, from its id: `clare-P0` is a McGrattans. */
const roomKind = (id: string) => /-([PMGHL])\d+$/.exec(id)?.[1] ?? null;

/** Where the city's music plays instead of the road's. */
const CITIES = ['dublin', 'trinity', 'brighton'];

/**
 * The music for a map: McGrattans has its reel, the gyms their own theme, homes and shops a quiet
 * one, Dublin, Trinity and Brighton the city's, and the road its jig. Landmarks keep the music
 * outside.
 */
export function areaSong(mapId: string, outsideId: string): SongId {
  const kind = roomKind(mapId);
  if (kind === 'P') return 'pub';
  if (kind === 'G') return 'gym';
  if (kind === 'H' || kind === 'M') return 'home';
  return CITIES.includes(outsideId) ? 'city' : 'route';
}

/**
 * The battle music: night scenes, Poseidon, the Happy Pear Twins and the Arcade King are bosses,
 * a gym's leader has their own.
 */
export function battleSong(
  scene: 'field' | 'city' | 'gym' | 'night',
  wild: boolean,
  trainer: string | null,
): SongId {
  if (
    scene === 'night' ||
    trainer === 'poseidon' ||
    trainer === 'arcade-king' ||
    trainer?.startsWith('pear-')
  )
    return 'boss';
  if (scene === 'gym') return 'leader';
  return wild ? 'wild' : 'trainer';
}
