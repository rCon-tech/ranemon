import { useId, type CSSProperties } from 'react';
import { PUSHED_AWAY } from '@/lib/ui/session';

/**
 * Where a pint thrown at a wild Ranemon is up to, read from the line in the text box: flying in,
 * after each sip, knocked back in one go, empty once it's joined you, or pushed away.
 */
export type PintStage =
  | { kind: 'thrown' }
  | { kind: 'sip'; sips: number }
  | { kind: 'downed' }
  | { kind: 'empty' }
  | { kind: 'pushed'; sips: number };

export function pintStage(message: string): PintStage | null {
  if (/^You threw a /.test(message)) return { kind: 'thrown' };
  if (/^Sip…/.test(message)) return { kind: 'sip', sips: message.split('…').length - 1 };
  if (/glug, glug, glug!$/.test(message)) return { kind: 'downed' };
  if (/^Gotcha!/.test(message)) return { kind: 'empty' };
  const pushed = PUSHED_AWAY.indexOf(message);
  return pushed >= 0 ? { kind: 'pushed', sips: pushed } : null;
}

/** How full the glass is: each sip takes a quarter, and the last quarter goes in one. */
function level(stage: PintStage) {
  if (stage.kind === 'thrown') return 1;
  if (stage.kind === 'sip' || stage.kind === 'pushed') return 1 - stage.sips / 4;
  return 0;
}

/**
 * A pint of stout by the wild Ranemon, drawn over its sprite slot: thrown in from your side, a
 * quarter gone with each sip, then tipped up and drained in one before the Gotcha. 2D pixel art.
 */
export function PintDrink({ stage }: { stage: PintStage }) {
  const clip = useId();
  return (
    <div
      className="pint-drink pointer-events-none absolute inset-0 z-10"
      data-testid="pint-drink"
      data-stage={stage.kind}
      aria-hidden
    >
      <svg
        key={stage.kind === 'sip' ? `sip-${stage.sips}` : stage.kind}
        className={`pint-glass pint-${stage.kind}`}
        viewBox="0 0 20 30"
        shapeRendering="crispEdges"
        style={{ '--level': level(stage) } as CSSProperties}
      >
        <clipPath id={clip}>
          <path d="M3 2h14l-1 5 1 2-2 19H5L3 9l1-2z" />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="20" height="30" fill="rgb(255 255 255 / 0.22)" />
          <rect className="pint-stout" x="0" y="6" width="20" height="22" fill="#1b1210" />
          <rect className="pint-head" x="0" y="3" width="20" height="3" fill="#f3e3bf" />
          <rect x="5" y="9" width="2" height="15" fill="rgb(255 255 255 / 0.35)" />
        </g>
        <path
          d="M3 2h14l-1 5 1 2-2 19H5L3 9l1-2z"
          fill="none"
          stroke="#1d2433"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      {stage.kind === 'downed' &&
        ['GLUG', 'GLUG', 'GLUG!'].map((w, i) => (
          <span key={i} className={`pint-glug pint-glug-${i}`}>
            {w}
          </span>
        ))}
      {stage.kind === 'empty' &&
        [0, 1, 2].map((i) => (
          <span key={i} className={`pint-heart pint-heart-${i}`}>
            ♥
          </span>
        ))}
    </div>
  );
}
