import type { CSSProperties } from 'react';

/** The 10 stars of a shiny's entrance burst, as angles (deg) and distances (% of the sprite). */
const BURST = Array.from({ length: 10 }, (_, i) => ({
  angle: i * 36 + (i % 2) * 12,
  far: 42 + (i % 3) * 8,
}));
/** Where the stars that keep twinkling round a shiny sit, in % of the sprite, with a delay. */
const GLINTS = [
  { x: 14, y: 18, delay: 0 },
  { x: 84, y: 28, delay: 0.7 },
  { x: 22, y: 74, delay: 1.3 },
  { x: 78, y: 70, delay: 1.9 },
];

/**
 * A shiny Ranemon's sparkle: a gold flash and a burst of stars as it comes in (keyed on its
 * entrance so it plays every time), then a few stars that keep twinkling round it.
 */
export function ShinySparkle() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      data-testid="shiny-sparkle"
      aria-hidden
    >
      <span className="shiny-flash" />
      {BURST.map((b, i) => (
        <span
          key={i}
          className="shiny-star shiny-burst"
          style={
            {
              '--dx': `${Math.cos((b.angle * Math.PI) / 180) * b.far}%`,
              '--dy': `${Math.sin((b.angle * Math.PI) / 180) * b.far}%`,
            } as CSSProperties
          }
        >
          ✦
        </span>
      ))}
      {GLINTS.map((g, i) => (
        <span
          key={`g${i}`}
          className="shiny-star shiny-glint"
          style={{ left: `${g.x}%`, top: `${g.y}%`, animationDelay: `${0.9 + g.delay}s` }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

/** Catching a shiny: gold rays, falling stars and a banner over the battlefield. */
export function ShinyCelebration({ name }: { name: string }) {
  return (
    <div
      className="shiny-party pointer-events-none absolute inset-0 z-30 grid place-items-center overflow-hidden"
      data-testid="shiny-caught"
    >
      <span className="shiny-rays" aria-hidden />
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="shiny-star shiny-fall"
          aria-hidden
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.25}s` }}
        >
          ★
        </span>
      ))}
      <div className="shiny-banner relative px-4 py-2 text-center">
        <div className="text-[22px] font-bold leading-tight">★ SHINY! ★</div>
        <div className="text-[12px]">{name} is yours</div>
      </div>
    </div>
  );
}
