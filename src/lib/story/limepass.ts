import { MAPS } from '@/content/story/maps';
import { find, marker, type Dir } from './world';

export { LIMEPASS } from './keys';

export interface LimeStop {
  map: string;
  town: string;
  x: number;
  y: number;
  face: Dir;
}

/**
 * Everywhere the Limepass can take you: every town you've been to, in the order of the road,
 * standing outside its McGrattans (or where you come in, if it has none). A Lime doesn't cross
 * the Irish Sea, so in Britain (`uk`) it only goes to towns in Britain, and at home only at home.
 */
export function limeStops(flags: ReadonlySet<string>, uk = false): LimeStop[] {
  const here = MAPS.filter((m) => !!m.uk === uk);
  return here
    .filter((m) => flags.has(`visited:${m.id}`))
    .map((m) => {
      const pub = find(m, 'P')[0];
      const at = pub ? { x: pub.x, y: pub.y + 1 } : marker(m, '@');
      return { map: m.id, town: m.name, ...at, face: 'down' };
    });
}
