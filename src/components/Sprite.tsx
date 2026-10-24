import { asset } from '@/lib/asset';
import type { Creature } from '@/lib/battle/creature';
import { SolidSprite } from './SolidSprite';

/**
 * The pixel sprite cut from a friend's photo, or a chunky outlined blob for creatures without
 * one. `back` is your own creature in battle: the sprite is mirrored to face the foe. `solid`
 * is a battle in the 3D look, where a Ranemon that has one stands as a solid figure instead.
 */
export function Sprite({
  creature,
  back = false,
  solid = false,
}: {
  creature: Creature;
  back?: boolean;
  solid?: boolean;
}) {
  if (solid && creature.solid && creature.sprite)
    return <SolidSprite sprite={creature.sprite} name={creature.name} back={back} />;
  if (back && creature.backSprite) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset(creature.backSprite)}
        alt={creature.name}
        draggable={false}
        className="h-full w-full object-contain [image-rendering:pixelated]"
      />
    );
  }
  if (creature.sprite) {
    return (
      // Sprites are tiny pixel art, so next/image's resizing would only blur them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset(creature.sprite)}
        alt={creature.name}
        draggable={false}
        className={`h-full w-full object-contain [image-rendering:pixelated] ${back ? '-scale-x-100' : ''}`}
      />
    );
  }
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
          fontFamily="'Pixelify Sans', sans-serif"
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
