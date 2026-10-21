import { hasFlag, type StoryState } from '@/lib/story/state';
import { MAPS, mapById, outsideOf } from './maps';

/**
 * The Town Map: Ireland from Clare to Dublin, drawn flat in the 5th generation's style.
 * Coordinates are longitude and latitude, projected onto a box 100 high.
 */

/** Ireland's coast, simplified, clockwise from Malin Head. */
const COAST: [number, number][] = [
  [-7.37, 55.38],
  [-7.0, 55.25],
  [-6.95, 55.15],
  [-6.65, 55.21],
  [-6.15, 55.23],
  [-5.8, 54.85],
  [-5.9, 54.65],
  [-5.45, 54.5],
  [-5.55, 54.3],
  [-5.85, 54.25],
  [-6.1, 54.03],
  [-6.35, 54.0],
  [-6.25, 53.72],
  [-6.1, 53.58],
  [-6.05, 53.38],
  [-6.1, 53.27],
  [-5.99, 52.96],
  [-6.13, 52.8],
  [-6.2, 52.55],
  [-6.35, 52.25],
  [-6.36, 52.17],
  [-6.93, 52.12],
  [-7.6, 52.08],
  [-7.85, 51.95],
  [-8.25, 51.8],
  [-8.5, 51.68],
  [-8.95, 51.53],
  [-9.8, 51.45],
  [-10.15, 51.6],
  [-10.4, 51.88],
  [-10.5, 52.1],
  [-9.9, 52.4],
  [-9.93, 52.56],
  [-9.4, 53.0],
  [-9.1, 53.15],
  [-9.05, 53.27],
  [-9.9, 53.4],
  [-10.2, 53.4],
  [-9.9, 53.6],
  [-10.2, 53.95],
  [-10.0, 54.3],
  [-9.2, 54.25],
  [-8.6, 54.3],
  [-8.3, 54.6],
  [-8.8, 54.65],
  [-8.25, 55.15],
  [-7.65, 55.27],
];

/** Where each stop on the road is: its town, as longitude and latitude. */
const WHERE: Record<string, [number, number]> = {
  clare: [-8.89, 52.76],
  limerick: [-8.63, 52.66],
  tipperary: [-7.81, 52.68],
  kilkenny: [-7.25, 52.65],
  laois: [-7.15, 53.01],
  offaly: [-7.99, 53.33],
  westmeath: [-7.65, 53.47],
  meath: [-6.48, 53.69],
  kildare: [-6.83, 53.15],
  dublin: [-6.26, 53.35],
  // By train from Dublin, once you've been.
  donegal: [-8.28, 54.48],
};

/** The view: the whole island. */
const WEST = -10.7;
const EAST = -5.3;
const NORTH = 55.5;
const SOUTH = 51.3;
/** Degrees of longitude are shorter than latitude this far north. */
const SQUASH = Math.cos((53 * Math.PI) / 180);
const SCALE = 100 / (NORTH - SOUTH);

export const project = ([lon, lat]: [number, number]) => ({
  x: Math.round((lon - WEST) * SQUASH * SCALE * 10) / 10,
  y: Math.round((NORTH - lat) * SCALE * 10) / 10,
});

export const MAP_WIDTH = Math.round((EAST - WEST) * SQUASH * SCALE);
export const MAP_HEIGHT = 100;

export const COAST_PATH =
  COAST.map((p, i) => {
    const { x, y } = project(p);
    return `${i ? 'L' : 'M'}${x} ${y}`;
  }).join('') + 'Z';

export interface Stop {
  id: string;
  /** The town, then the county: "Thurles", "Co. Tipperary". */
  town: string;
  county: string;
  x: number;
  y: number;
  visited: boolean;
  here: boolean;
  /** The gym's venue and whether its jersey is won. Dublin's is Trinity, the last stop. */
  gym: { place: string; won: boolean } | null;
}

/** Every stop on the road, west to east, as this save knows it. */
export function stopsOf(game: StoryState): Stop[] {
  const here = outsideOf(mapById(game.map)).id;
  const at = here === 'trinity' ? 'dublin' : here;
  return MAPS.filter(
    (m) =>
      WHERE[m.id] && (m.id !== 'donegal' || here === 'donegal' || hasFlag(game, 'visited:donegal')),
  ).map((m) => {
    const [town, county = m.id === 'dublin' ? 'Co. Dublin' : ''] = m.name.split(', ');
    return {
      id: m.id,
      town,
      county,
      ...project(WHERE[m.id]),
      // You wake up in Clare, so it's always been visited.
      visited: m.id === at || hasFlag(game, `visited:${m.id}`) || m.id === 'clare',
      here: m.id === at,
      gym:
        m.id === 'dublin'
          ? { place: 'Trinity College', won: hasFlag(game, 'champion') }
          : m.gym
            ? { place: m.gym.place, won: hasFlag(game, `jersey:${m.id}`) }
            : null,
    };
  });
}
