import { moveById } from '@/lib/battle/moves';
import type { RaneType } from '@/lib/battle/types';

type Pattern = 'burst' | 'rise' | 'fall' | 'ring' | 'impact' | 'spin';

/** Each type's look: a pixel shape, its colours, and how the pieces move. */
const LOOK: Record<RaneType | 'none', { shape: string; colours: string[]; pattern: Pattern }> = {
  // Thought waves rippling out.
  brains: { shape: 'ring', colours: ['#9b7be8', '#d7c8ff'], pattern: 'ring' },
  // A big comic-book impact.
  brawn: { shape: 'star8', colours: ['#f08a5d', '#ffd166'], pattern: 'impact' },
  // Zigzag bolts spinning every which way.
  chaos: { shape: 'bolt', colours: ['#d94fa8', '#7d3cff'], pattern: 'spin' },
  // Snowflakes drifting down.
  chill: { shape: 'flake', colours: ['#6cc4e8', '#ffffff'], pattern: 'fall' },
  // Hearts floating up.
  charm: { shape: 'heart', colours: ['#f59ac2', '#ff5d8f'], pattern: 'rise' },
  // Stars and confetti flying out.
  hype: { shape: 'star5', colours: ['#f5cf3a', '#ff8c42'], pattern: 'burst' },
  none: { shape: 'star5', colours: ['#ffffff', '#c8d0e0'], pattern: 'burst' },
};

const SHAPES: Record<string, string> = {
  ring: 'M8 1h4v2h3v2h2v3h2v4h-2v3h-2v2h-3v2H8v-2H5v-2H3v-3H1V8h2V5h2V3h3z M8 5v2H6v2H5v2h1v2h2v2h4v-2h2v-2h1V9h-1V7h-2V5z',
  star8: 'M10 0l2 6 6-3-3 6 5 1-5 2 3 6-6-3-2 5-2-5-6 3 3-6-5-2 5-1-3-6 6 3z',
  bolt: 'M11 0h6l-5 8h5L7 20l3-9H5z',
  flake:
    'M9 0h2v4l2-2 1 1-3 3v3h3l3-3 1 1-2 2h4v2h-4l2 2-1 1-3-3h-3v3l3 3-1 1-2-2v4H9v-4l-2 2-1-1 3-3v-3H6l-3 3-1-1 2-2H0V9h4L2 7l1-1 3 3h3V6L6 3l1-1 2 2z',
  heart: 'M3 2h5v2h4V2h5v2h2v6h-2v2h-2v2h-2v2h-2v2H9v-2H7v-2H5v-2H3v-2H1V4h2z',
  star5: 'M10 0l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z',
};

/** Where each of the 8 pieces starts, as offsets from the middle of the sprite (in %). */
const PIECES = [
  [-30, -20],
  [25, -28],
  [-10, 20],
  [32, 10],
  [-34, 14],
  [5, -35],
  [18, 30],
  [-20, -2],
];

/**
 * The animation for a move, drawn over the Ranemon it lands on: original pixel shapes in the
 * move's type colours. Give it a new `key` each time a move is used.
 */
export function MoveEffect({ moveId }: { moveId: string }) {
  const move = moveById(moveId);
  const look = LOOK[move.type ?? 'none'];
  const pieces = look.pattern === 'impact' ? PIECES.slice(0, 3) : PIECES;
  return (
    <div
      className={`move-fx fx-${look.pattern}`}
      aria-hidden="true"
      data-testid="move-effect"
      data-type={move.type ?? 'none'}
    >
      {pieces.map(([dx, dy], i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="fx-piece"
          shapeRendering="crispEdges"
          style={
            {
              '--dx': dx,
              '--dy': dy,
              '--delay': `${i * 45}ms`,
              '--size': look.pattern === 'impact' ? `${42 - i * 10}%` : `${16 + (i % 3) * 5}%`,
            } as React.CSSProperties
          }
        >
          <path
            d={SHAPES[look.shape]}
            fill={look.colours[i % look.colours.length]}
            fillRule="evenodd"
            stroke="#1d2433"
            strokeWidth="1"
          />
        </svg>
      ))}
    </div>
  );
}
