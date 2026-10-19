import type { Creature } from '@/lib/battle/creature';

/**
 * Placeholder art: a chunky outlined blob in the creature's colour, until Creature Studio
 * gives each one a cut-out from a friend's photo. `back` draws it from behind, as your own
 * creature is shown in battle.
 */
export function Sprite({ creature, back = false }: { creature: Creature; back?: boolean }) {
  const initial = creature.name[0];
  return (
    <svg
      viewBox="0 0 96 96"
      className="h-full w-full"
      role="img"
      aria-label={creature.name}
      shapeRendering="crispEdges"
    >
      <ellipse
        cx="30"
        cy="86"
        rx="11"
        ry="6"
        fill={creature.colour}
        stroke="#1d2433"
        strokeWidth="4"
      />
      <ellipse
        cx="66"
        cy="86"
        rx="11"
        ry="6"
        fill={creature.colour}
        stroke="#1d2433"
        strokeWidth="4"
      />
      <path
        d="M14 62 C10 30 28 10 48 10 C68 10 86 30 82 62 C80 80 64 86 48 86 C32 86 16 80 14 62 Z"
        fill={creature.colour}
        stroke="#1d2433"
        strokeWidth="4"
      />
      {/* A soft highlight so the flat colour reads as a rounded body. */}
      <ellipse cx="34" cy="30" rx="10" ry="6" fill="#fff" opacity="0.35" />
      {back ? (
        <text
          x="48"
          y="66"
          textAnchor="middle"
          fontSize="22"
          fill="#1d2433"
          opacity="0.35"
          fontFamily="'Press Start 2P', monospace"
        >
          {initial}
        </text>
      ) : (
        <g>
          <rect x="32" y="38" width="8" height="12" rx="2" fill="#1d2433" />
          <rect x="56" y="38" width="8" height="12" rx="2" fill="#1d2433" />
          <rect x="34" y="40" width="3" height="4" fill="#fff" />
          <rect x="58" y="40" width="3" height="4" fill="#fff" />
          <path d="M40 60 Q48 68 56 60" fill="none" stroke="#1d2433" strokeWidth="4" />
        </g>
      )}
    </svg>
  );
}
