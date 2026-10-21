'use client';

import { useEffect, useState } from 'react';
import { COAST_PATH, MAP_HEIGHT, MAP_WIDTH, stopsOf } from '@/content/story/townmap';
import type { StoryState } from '@/lib/story/state';
import { Panel } from './Panels';

const SEA = '#3a74c4';
const SEA_LINE = '#4a86d4';
const LAND = '#7cc468';
const LAND_DARK = '#4f9a4a';
const COAST = '#24502c';
const ROAD = '#f8e8a8';
const ROAD_EDGE = '#6a5428';
const VISITED = '#e0403a';
const UNVISITED = '#a4acb6';

/**
 * The Town Map, from the START menu or by tapping the place name: the road from Clare to
 * Dublin, where you've been, which jerseys you've won, and where you are now. Left and right
 * step through the stops.
 */
export function TownMapPanel({ game, onClose }: { game: StoryState; onClose: () => void }) {
  const stops = stopsOf(game);
  const here = Math.max(
    0,
    stops.findIndex((s) => s.here),
  );
  const [pick, setPick] = useState(here);
  const stop = stops[pick];

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (step) setPick((p) => (p + step + stops.length) % stops.length);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [stops.length]);

  const road = stops
    .filter((s) => s.id !== 'donegal')
    .map((s) => `${s.x},${s.y}`)
    .join(' ');
  // The train to Donegal, once you've taken it: a railway line from Dublin.
  const dublin = stops.find((s) => s.id === 'dublin')!;
  const donegal = stops.find((s) => s.id === 'donegal');
  return (
    <Panel title="TOWN MAP" onClose={onClose}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-[170px] w-full shrink-0 rounded-lg border-2 border-frame"
        style={{ background: SEA }}
        role="img"
        aria-label={`Map of Ireland. You are in ${stops[here].town}.`}
        data-testid="town-map"
      >
        <defs>
          <pattern id="sea" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={SEA} />
            <rect width="4" height="0.6" fill={SEA_LINE} />
          </pattern>
        </defs>
        <rect x="-100" width={MAP_WIDTH + 200} height={MAP_HEIGHT} fill="url(#sea)" />
        <path d={COAST_PATH} fill={LAND_DARK} transform="translate(0.8 1.2)" />
        <path d={COAST_PATH} fill={LAND} stroke={COAST} strokeWidth="0.7" strokeLinejoin="round" />
        <polyline
          points={road}
          fill="none"
          stroke={ROAD_EDGE}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <polyline
          points={road}
          fill="none"
          stroke={ROAD}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {donegal && (
          <g data-testid="railway">
            <line
              x1={dublin.x}
              y1={dublin.y}
              x2={donegal.x}
              y2={donegal.y}
              stroke={ROAD_EDGE}
              strokeWidth="1.6"
            />
            <line
              x1={dublin.x}
              y1={dublin.y}
              x2={donegal.x}
              y2={donegal.y}
              stroke={ROAD}
              strokeWidth="0.8"
              strokeDasharray="1.4 1"
            />
          </g>
        )}
        {stops.map((s, i) => (
          <g
            key={s.id}
            onClick={() => setPick(i)}
            className="cursor-pointer"
            data-testid={`stop-${s.id}`}
            data-visited={s.visited}
          >
            <rect x={s.x - 4} y={s.y - 4} width="8" height="8" fill="transparent" />
            <rect
              x={s.x - 2.2}
              y={s.y - 2.2}
              width="4.4"
              height="4.4"
              rx="0.6"
              fill={s.visited ? VISITED : UNVISITED}
              stroke="#fff"
              strokeWidth="0.8"
            />
            {s.gym?.won && (
              <path
                d={star(s.x + 3, s.y - 3.2, 1.9)}
                fill="var(--color-gold)"
                stroke={ROAD_EDGE}
                strokeWidth="0.35"
              />
            )}
            {i === pick && (
              <rect
                x={s.x - 3.6}
                y={s.y - 3.6}
                width="7.2"
                height="7.2"
                rx="1"
                fill="none"
                stroke="var(--color-paper)"
                strokeWidth="0.7"
                strokeDasharray="1.2 0.8"
              />
            )}
          </g>
        ))}
        {/* You: a red cap that blinks over the town you're in. */}
        <g className="blink" pointerEvents="none" data-testid="you-are-here">
          <circle
            cx={stops[here].x}
            cy={stops[here].y - 6.5}
            r="2.4"
            fill={VISITED}
            stroke="#fff"
            strokeWidth="0.6"
          />
          <rect
            x={stops[here].x - 0.9}
            y={stops[here].y - 7.3}
            width="1.8"
            height="1.4"
            fill="#fff"
          />
          <path
            d={`M${stops[here].x - 1.2} ${stops[here].y - 4.4}L${stops[here].x} ${stops[here].y - 2.8}L${stops[here].x + 1.2} ${stops[here].y - 4.4}Z`}
            fill={VISITED}
          />
        </g>
      </svg>

      <div className="flex items-center justify-between gap-2" data-testid="town-info">
        <button
          type="button"
          className="pixel-btn px-2 py-1 text-[11px]"
          onClick={() => setPick((p) => (p - 1 + stops.length) % stops.length)}
          aria-label="Previous town"
        >
          ◀
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center text-center text-[11px] leading-relaxed">
          <b className="text-[13px]">
            {stop.town}
            {stop.here && ' (you)'}
          </b>
          <span className="opacity-70">{stop.county || 'County Clare'}</span>
          <span>
            {!stop.visited
              ? 'Not visited yet'
              : stop.gym
                ? `${stop.gym.place}: ${stop.gym.won ? (stop.id === 'dublin' ? 'Champion!' : 'jersey won ★') : stop.id === 'dublin' ? 'B&S await' : 'jersey not won'}`
                : ''}
          </span>
        </div>
        <button
          type="button"
          className="pixel-btn px-2 py-1 text-[11px]"
          onClick={() => setPick((p) => (p + 1) % stops.length)}
          aria-label="Next town"
        >
          ▶
        </button>
      </div>

      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px]" aria-hidden>
        <li className="flex items-center gap-1">
          <span className="inline-block h-2 w-2" style={{ background: VISITED }} /> Visited
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-2 w-2" style={{ background: UNVISITED }} /> Not yet
        </li>
        <li className="flex items-center gap-1">
          <span className="text-gold">★</span> Jersey won
        </li>
      </ul>
    </Panel>
  );
}

/** A five-pointed star centred on (x, y). */
function star(x: number, y: number, r: number): string {
  return (
    Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const d = i % 2 ? r * 0.45 : r;
      return `${i ? 'L' : 'M'}${(x + d * Math.cos(a)).toFixed(2)} ${(y + d * Math.sin(a)).toFixed(2)}`;
    }).join('') + 'Z'
  );
}
