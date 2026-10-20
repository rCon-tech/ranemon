import type { CSSProperties, ReactNode } from 'react';
import type { Side } from '@/lib/battle/engine';

/**
 * A hand-made animation for each friend's special move, acting out the joke in its name.
 * Drawn over the whole battlefield, because many of them travel between the two Ranemon.
 * All shapes are original pixel-style art. Give it a new `key` each time a move is used.
 */

interface Point {
  x: number;
  y: number;
}

// Centres of the two sprite slots in the battlefield's 150 × 100 drawing space.
const SLOT: Record<Side, Point> = { 0: { x: 35, y: 68 }, 1: { x: 111, y: 25 } };
const INK = '#1d2433';

type Anim = 'pop' | 'travel' | 'fly' | 'drop' | 'rise' | 'spin' | 'puff' | 'blink' | 'flash';

/** An animated group. `to` is where `travel` and `drop` move it, relative to where it starts. */
function A({
  anim,
  delay = 0,
  to,
  repeat,
  children,
}: {
  anim: Anim;
  delay?: number;
  to?: Point;
  repeat?: boolean;
  children: ReactNode;
}) {
  const style = {
    animationDelay: `${delay}s`,
    ...(to && { '--tx': `${to.x}px`, '--ty': `${to.y}px` }),
  } as CSSProperties;
  return (
    <g className={`sfx sfx-${anim}${repeat ? ' sfx-repeat' : ''}`} style={style}>
      {children}
    </g>
  );
}

function Label({
  at,
  text,
  colour = '#f8d030',
  size = 5,
}: {
  at: Point;
  text: string;
  colour?: string;
  size?: number;
}) {
  return (
    <text
      x={at.x}
      y={at.y}
      fontSize={size}
      textAnchor="middle"
      fontFamily="'Pixelify Sans', sans-serif"
      fill={colour}
      stroke={INK}
      strokeWidth={size / 3.5}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

const heart = (c: Point, r: number) =>
  `M${c.x} ${c.y + r} L${c.x - r} ${c.y} A${r / 2} ${r / 2} 0 0 1 ${c.x} ${c.y - r / 2.2} A${r / 2} ${r / 2} 0 0 1 ${c.x + r} ${c.y} Z`;

function star(c: Point, outer: number, inner: number, points: number) {
  const pts = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(c.x + r * Math.cos(a)).toFixed(1)},${(c.y + r * Math.sin(a)).toFixed(1)}`;
  });
  return pts.join(' ');
}

function Boom({ at, delay = 0, size = 10 }: { at: Point; delay?: number; size?: number }) {
  return (
    <A anim="pop" delay={delay}>
      <polygon
        points={star(at, size, size * 0.45, 8)}
        fill="#f08a5d"
        stroke={INK}
        strokeWidth="0.8"
      />
      <polygon points={star(at, size * 0.55, size * 0.25, 8)} fill="#ffd166" />
    </A>
  );
}

const up = (p: Point, d: number): Point => ({ x: p.x, y: Math.max(14, p.y - d) });
const off = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });
const between = (a: Point, b: Point): Point => ({ x: b.x - a.x, y: b.y - a.y });

type Scene = (u: Point, o: Point, userSide: Side) => ReactNode;

const SCENES: Record<string, Scene> = {
  // A phone ringing off the hook, then off he goes.
  'nozzy-call': (u, o) => (
    <>
      <A anim="pop">
        <g className="sfx sfx-wiggle sfx-repeat">
          <rect x={u.x - 5} y={up(u, 22).y - 8} width="10" height="16" rx="1.5" fill={INK} />
          <rect x={u.x - 3.5} y={up(u, 22).y - 6} width="7" height="10" fill="#6cc4e8" />
          <circle cx={u.x} cy={up(u, 22).y + 6} r="0.9" fill="#f8f8f0" />
        </g>
      </A>
      <A anim="blink" repeat>
        <path
          d={`M${u.x + 8} ${up(u, 22).y - 4} q3 4 0 8 M${u.x + 11} ${up(u, 22).y - 6} q4 6 0 12`}
          stroke="#f8d030"
          strokeWidth="1.2"
          fill="none"
        />
      </A>
      <A anim="pop" delay={0.2}>
        <Label at={up(u, 34)} text="RING RING!" />
      </A>
      {[-6, 0, 6].map((dy, i) => (
        <A key={i} anim="travel" delay={0.6 + i * 0.08} to={between(u, o)}>
          <rect x={u.x - 10} y={u.y + dy} width="14" height="1.5" fill="#f8f8f0" />
        </A>
      ))}
      <Boom at={o} delay={1} />
    </>
  ),

  // The ruler of Ranelads.com rewrites reality: the two HP bars trade places.
  'ranelads-com': (u, o) => {
    const c = { x: 75, y: 48 };
    return (
      <>
        <A anim="pop">
          <rect
            x={c.x - 32}
            y={c.y - 15}
            width="64"
            height="30"
            rx="1.5"
            fill="#f8f8f0"
            stroke={INK}
            strokeWidth="1"
          />
          <rect
            x={c.x - 32}
            y={c.y - 15}
            width="64"
            height="7"
            fill="#9b7be8"
            stroke={INK}
            strokeWidth="1"
          />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={c.x - 28 + i * 3.5} cy={c.y - 11.5} r="1" fill="#f8f8f0" />
          ))}
          <rect x={c.x - 16} y={c.y - 13.5} width="44" height="4" fill="#f8f8f0" />
          <text
            x={c.x - 14}
            y={c.y - 10.4}
            fontSize="3"
            fontFamily="'Pixelify Sans', sans-serif"
            fill={INK}
          >
            ranelads.com
          </text>
          <Label at={off(c, 0, 4)} text="NEW RULES:" colour="#9b7be8" size={4} />
          <Label at={off(c, 0, 11)} text="SWAP HP!" colour="#d94fa8" size={4.5} />
        </A>
        <A anim="travel" delay={0.5} to={between(u, o)}>
          <path d={heart(u, 7)} fill="#40c060" stroke={INK} strokeWidth="0.8" />
        </A>
        <A anim="travel" delay={0.5} to={between(o, u)}>
          <path d={heart(o, 7)} fill="#e04848" stroke={INK} strokeWidth="0.8" />
        </A>
      </>
    );
  },

  // A big heart sails over, and the foe is suddenly a best friend.
  'fierce-friendship': (u, o) => (
    <>
      <A anim="travel" to={between(u, o)}>
        <path d={heart(u, 10)} fill="#f59ac2" stroke={INK} strokeWidth="0.9" />
      </A>
      <A anim="pop" delay={0.7}>
        <Label at={up(o, 18)} text="BFF!" colour="#f59ac2" size={7} />
      </A>
      {[-12, -4, 5, 12].map((dx, i) => (
        <A key={i} anim="rise" delay={0.8 + i * 0.1}>
          <path d={heart(off(o, dx, 6), 3)} fill="#ff5d8f" stroke={INK} strokeWidth="0.5" />
        </A>
      ))}
    </>
  ),

  // An energy drink is thrown in from the bench.
  'helping-hand-ois': (u, _o, side) => energyDrink(u, side),
  'helping-hand-ollie': (u, _o, side) => energyDrink(u, side),

  // Hooded, eyes glowing, with green code raining down. Then a hit from the shadows.
  'dark-web': (u, o) => (
    <>
      <A anim="flash">
        <rect x="0" y="0" width="150" height="100" fill="#0b0f18" />
      </A>
      {Array.from({ length: 10 }, (_, i) => (
        <A key={i} anim="drop" delay={(i % 4) * 0.12} to={{ x: 0, y: 70 }}>
          <text
            x={8 + i * 15}
            y={-6 - (i % 3) * 8}
            fontSize="4"
            fontFamily="'Pixelify Sans', sans-serif"
            fill="#3ef07a"
          >
            {i % 2 ? '1011' : '0110'}
          </text>
        </A>
      ))}
      <A anim="pop" delay={0.2}>
        <path
          d={`M${u.x} ${u.y - 22} q14 2 14 20 v14 h-28 v-14 q0 -18 14 -20 z`}
          fill={INK}
          stroke="#3ef07a"
          strokeWidth="0.8"
        />
        <ellipse cx={u.x} cy={u.y - 3} rx="9" ry="7" fill="#05070c" />
        <rect x={u.x - 5} y={u.y - 5} width="3" height="2" fill="#3ef07a" />
        <rect x={u.x + 2} y={u.y - 5} width="3" height="2" fill="#3ef07a" />
      </A>
      <A anim="pop" delay={0.6}>
        <Label at={up(u, 28)} text="ANONYMOUS" colour="#3ef07a" size={4} />
      </A>
      <Boom at={o} delay={1.1} />
    </>
  ),

  // Bombers fly over and drop their load.
  'military-force': (_u, o) => (
    <>
      {[10, 17, 24].map((y, i) => (
        <A key={i} anim="fly" delay={i * 0.15}>
          <path
            d={`M0 ${y} l10 0 l3 -1 l-3 -1 l-4 0 l-3 -4 l-2 0 l1 4 l-3 0 l-1 -2 l-1 0 l0 4 z`}
            fill="#7d8b4f"
            stroke={INK}
            strokeWidth="0.5"
          />
        </A>
      ))}
      {[-10, 0, 10].map((dx, i) => (
        <A key={i} anim="drop" delay={0.45 + i * 0.18} to={{ x: 0, y: o.y + 4 }}>
          <ellipse cx={o.x + dx} cy={0} rx="1.6" ry="2.6" fill={INK} />
        </A>
      ))}
      {[-10, 0, 10].map((dx, i) => (
        <Boom key={i} at={off(o, dx, 4)} delay={0.9 + i * 0.18} size={8} />
      ))}
    </>
  ),

  // A speech bubble making demands, then a shield goes up.
  jamanding: (u) => {
    const b = up(u, 30);
    return (
      <>
        <A anim="pop">
          <rect
            x={b.x - 30}
            y={b.y - 7}
            width="60"
            height="13"
            rx="3"
            fill="#f8f8f0"
            stroke={INK}
            strokeWidth="1"
          />
          <path
            d={`M${b.x - 4} ${b.y + 6} l3 5 l3 -5`}
            fill="#f8f8f0"
            stroke={INK}
            strokeWidth="1"
          />
          <text
            x={b.x}
            y={b.y + 1.5}
            fontSize="3.6"
            textAnchor="middle"
            fontFamily="'Pixelify Sans', sans-serif"
            fill={INK}
          >
            I DESERVE IT!
          </text>
        </A>
        <A anim="pop" delay={0.7}>
          <path
            d={`M${u.x} ${u.y - 14} l12 4 v8 q0 10 -12 16 q-12 -6 -12 -16 v-8 z`}
            fill="#6cc4e8"
            fillOpacity="0.75"
            stroke={INK}
            strokeWidth="1"
          />
          <path d={`M${u.x} ${u.y - 10} v24`} stroke="#f8f8f0" strokeWidth="1.5" />
        </A>
      </>
    );
  },

  // Into the cage: a flurry of gloves.
  'paddy-pimblett': (u, o) => (
    <>
      <A anim="pop">
        <polygon
          points={star(o, 22, 22 * Math.cos(Math.PI / 8), 4)}
          fill="none"
          stroke="#c94f4f"
          strokeWidth="1.6"
        />
      </A>
      {[0, 1, 2].map((i) => (
        <A
          key={i}
          anim="travel"
          delay={0.25 + i * 0.22}
          to={between(u, off(o, (i - 1) * 6, (i - 1) * 4))}
        >
          <rect
            x={u.x - 4}
            y={u.y - 4}
            width="8"
            height="7"
            rx="2.5"
            fill="#e04848"
            stroke={INK}
            strokeWidth="0.8"
          />
          <rect
            x={u.x - 4}
            y={u.y + 2}
            width="8"
            height="2"
            fill="#f8f8f0"
            stroke={INK}
            strokeWidth="0.5"
          />
        </A>
      ))}
      <Boom at={o} delay={0.95} size={13} />
      <A anim="pop" delay={1}>
        <Label at={up(o, 16)} text="POW!" size={7} />
      </A>
    </>
  ),

  // Drums and a rising sun for the dance.
  'this-ones-for-africa': (u) => (
    <>
      <A anim="rise">
        <circle cx={u.x} cy={Math.max(22, u.y - 6)} r="15" fill="#f2a541" fillOpacity="0.85" />
        <polygon
          points={star({ x: u.x, y: Math.max(22, u.y - 6) }, 22, 15, 12)}
          fill="#f8d030"
          fillOpacity="0.4"
        />
      </A>
      {[-13, 13].map((dx, i) => (
        <A key={i} anim="pop" delay={0.1 * i}>
          <g className="sfx sfx-bounce sfx-repeat" style={{ animationDelay: `${i * 0.15}s` }}>
            <path
              d={`M${u.x + dx - 5} ${u.y + 4} h10 l-2 12 h-6 z`}
              fill="#8b5a2b"
              stroke={INK}
              strokeWidth="0.8"
            />
            <ellipse
              cx={u.x + dx}
              cy={u.y + 4}
              rx="5"
              ry="1.6"
              fill="#e8d0a0"
              stroke={INK}
              strokeWidth="0.6"
            />
          </g>
        </A>
      ))}
      {[-8, 2, 10].map((dx, i) => (
        <A key={i} anim="rise" delay={0.4 + i * 0.15}>
          <circle cx={u.x + dx} cy={Math.max(26, u.y - 10)} r="1.6" fill={INK} />
          <path
            d={`M${u.x + dx + 1.4} ${Math.max(26, u.y - 10)} v-7 l3 2`}
            stroke={INK}
            strokeWidth="0.9"
            fill="none"
          />
        </A>
      ))}
    </>
  ),

  // Two pints: his is 0%, the one he slides over isn't.
  'rounds-on-me': (u, o) => (
    <>
      <A anim="pop">
        <path
          d={`M${u.x - 9} ${u.y - 16} h7 l-1 12 h-5 z`}
          fill="#e8f6ff"
          stroke={INK}
          strokeWidth="0.7"
        />
        <Label at={off(u, -5.5, -8)} text="0%" colour={INK} size={2.6} />
      </A>
      <A anim="travel" delay={0.3} to={between(u, o)}>
        <path
          d={`M${u.x + 2} ${u.y - 16} h8 l-1 13 h-6 z`}
          fill="#f2a541"
          stroke={INK}
          strokeWidth="0.7"
        />
        <rect
          x={u.x + 1.5}
          y={u.y - 18}
          width="9"
          height="3"
          rx="1.2"
          fill="#f8f8f0"
          stroke={INK}
          strokeWidth="0.5"
        />
      </A>
      <A anim="pop" delay={0.9}>
        <Label at={up(o, 18)} text="HIC!" colour="#f8f8f0" size={5} />
      </A>
      {[0, 1].map((i) => (
        <A key={i} anim="pop" delay={1 + i * 0.1}>
          <g className="sfx sfx-spin sfx-repeat">
            <circle
              cx={o.x + (i ? 6 : -6)}
              cy={o.y - 8}
              r="2.5"
              fill="none"
              stroke="#f8d030"
              strokeWidth="0.9"
              strokeDasharray="4 2"
            />
          </g>
        </A>
      ))}
      <A anim="pop" delay={0.2}>
        <Label at={{ x: 75, y: 48 }} text="CHEERS!" size={5} />
      </A>
    </>
  ),

  // The flag goes up, and a star comes down on the foe.
  usa: (_u, o) => {
    const f = { x: 52, y: 26 };
    return (
      <>
        <A anim="pop">
          <g className="sfx sfx-wave sfx-repeat">
            {Array.from({ length: 7 }, (_, i) => (
              <rect
                key={i}
                x={f.x}
                y={f.y + i * 3}
                width="40"
                height="3"
                fill={i % 2 ? '#f8f8f0' : '#c94f4f'}
              />
            ))}
            <rect x={f.x} y={f.y} width="16" height="12" fill="#3060b0" />
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={f.x + 2 + (i % 4) * 3.5}
                y={f.y + 1.5 + Math.floor(i / 4) * 3.5}
                width="1.2"
                height="1.2"
                fill="#f8f8f0"
              />
            ))}
            <rect
              x={f.x}
              y={f.y}
              width="40"
              height="21"
              fill="none"
              stroke={INK}
              strokeWidth="0.8"
            />
          </g>
          <rect x={f.x - 2} y={f.y - 2} width="2" height="40" fill={INK} />
        </A>
        <A anim="pop" delay={0.4}>
          <Label at={{ x: 72, y: 56 }} text="USA! USA!" size={5} />
        </A>
        <A anim="travel" delay={0.6} to={between({ x: 72, y: 36 }, o)}>
          <polygon
            points={star({ x: 72, y: 36 }, 7, 3, 5)}
            fill="#f8f8f0"
            stroke="#3060b0"
            strokeWidth="1"
          />
        </A>
        <Boom at={o} delay={1.1} size={12} />
      </>
    );
  },

  // Sweating buckets, trying far too hard.
  'try-hard': (u, o) => (
    <>
      <A anim="flash">
        <circle cx={u.x} cy={u.y} r="20" fill="#e04848" />
      </A>
      {[
        { x: -16, y: -10 },
        { x: 16, y: -12 },
        { x: -12, y: 4 },
        { x: 14, y: 2 },
        { x: 0, y: -18 },
      ].map((d, i) => (
        <A key={i} anim="travel" delay={0.1 + i * 0.08} to={d}>
          <path
            d={`M${u.x} ${u.y - 10} q2.5 3.5 0 5.5 q-2.5 -2 0 -5.5 z`}
            fill="#6cc4e8"
            stroke={INK}
            strokeWidth="0.4"
          />
        </A>
      ))}
      <A anim="pop" delay={0.3}>
        <Label at={up(u, 26)} text="TRY HARD!" size={5} />
      </A>
      <Boom at={o} delay={0.95} />
    </>
  ),

  // Filming it all, and the likes pour in.
  'content-creation': (u) => {
    const p = off(up(u, 20), 14, 0);
    return (
      <>
        <A anim="pop">
          <rect x={p.x - 9} y={p.y - 6} width="18" height="12" rx="1.5" fill={INK} />
          <circle cx={p.x} cy={p.y} r="3.5" fill="#6cc4e8" stroke="#f8f8f0" strokeWidth="0.6" />
        </A>
        <A anim="blink" repeat>
          <circle cx={p.x - 6} cy={p.y - 3.5} r="1.2" fill="#e04848" />
        </A>
        <A anim="pop" delay={0.1}>
          <Label at={off(p, -1, -9)} text="REC" colour="#e04848" size={3} />
        </A>
        {[-14, -6, 2, 10, -10, 6].map((dx, i) => (
          <A key={i} anim="rise" delay={0.3 + i * 0.12}>
            {i % 2 ? (
              <path d={heart(off(u, dx, 4), 3.2)} fill="#ff5d8f" stroke={INK} strokeWidth="0.5" />
            ) : (
              <Label at={off(u, dx, 6)} text="+1" colour="#f8f8f0" size={3.5} />
            )}
          </A>
        ))}
      </>
    );
  },

  // Slow clouds of smoke, and nothing gets to him.
  'blaze-up': (u) => (
    <>
      {[
        { x: -8, y: -6, r: 7 },
        { x: 6, y: -10, r: 8 },
        { x: -2, y: -18, r: 9 },
        { x: 10, y: -2, r: 6 },
        { x: -12, y: -14, r: 6 },
      ].map((c, i) => (
        <A key={i} anim="puff" delay={i * 0.22}>
          <circle
            cx={u.x + c.x}
            cy={u.y + c.y}
            r={c.r}
            fill="#c8d4c0"
            stroke="#8a9a88"
            strokeWidth="0.6"
          />
        </A>
      ))}
      <A anim="pop" delay={0.5}>
        <Label at={up(u, 30)} text="CHILL..." colour="#b8e890" size={5} />
      </A>
    </>
  ),

  // Two decks spinning back to back, then he's off.
  b2b: (u, _o, side) => (
    <>
      {[-10, 10].map((dx, i) => (
        <A key={i} anim="pop" delay={i * 0.1}>
          <g className="sfx sfx-spin sfx-repeat">
            <circle cx={u.x + dx} cy={up(u, 16).y} r="8" fill={INK} />
            <circle
              cx={u.x + dx}
              cy={up(u, 16).y}
              r="5.5"
              fill="none"
              stroke="#3a4560"
              strokeWidth="0.5"
            />
            <circle cx={u.x + dx} cy={up(u, 16).y} r="2.8" fill="#d94fa8" />
            <rect
              x={u.x + dx - 0.6}
              y={up(u, 16).y - 2.8}
              width="1.2"
              height="1.5"
              fill="#f8f8f0"
            />
          </g>
        </A>
      ))}
      <A anim="pop" delay={0.3}>
        <Label at={side === 0 ? up(u, 30) : off(u, 0, 18)} text="B2B" colour="#d94fa8" size={7} />
      </A>
      <A anim="travel" delay={0.9} to={{ x: side === 0 ? -40 : 40, y: 0 }}>
        <Label at={off(u, 0, 4)} text={side === 0 ? '<<' : '>>'} colour="#f8f8f0" size={7} />
      </A>
    </>
  ),
};

/** An energy drink thrown in from the user's bench, for Helping Hand. */
function energyDrink(u: Point, side: Side) {
  const from = { x: side === 0 ? -15 : 165, y: u.y - 20 };
  return (
    <>
      <A anim="travel" to={between(from, off(u, 0, -6))}>
        <g>
          <rect
            x={from.x - 4}
            y={from.y - 8}
            width="8"
            height="15"
            rx="1"
            fill={INK}
            stroke="#f8f8f0"
            strokeWidth="0.5"
          />
          <rect x={from.x - 3} y={from.y - 9.5} width="6" height="2" fill="#c8d0e0" />
          <path
            d={`M${from.x + 1} ${from.y - 5} l-3 5 h2.5 l-1.5 5 l4 -6 h-2.5 l1.5 -4 z`}
            fill="#58e858"
          />
        </g>
      </A>
      <A anim="pop" delay={0.75}>
        <Label at={up(u, 26)} text="ENERGY!" colour="#58e858" size={5} />
      </A>
      {[
        { x: -12, y: -4 },
        { x: 12, y: -8 },
        { x: -6, y: 8 },
        { x: 10, y: 6 },
      ].map((d, i) => (
        <A key={i} anim="pop" delay={0.8 + i * 0.08}>
          <polygon
            points={star(off(u, d.x, d.y), 3.5, 1.5, 4)}
            fill="#f8f8f0"
            stroke={INK}
            strokeWidth="0.4"
          />
        </A>
      ))}
    </>
  );
}

/** Whether a move has its own animation. */
export const hasSpecialEffect = (moveId: string) => moveId in SCENES;

export function SpecialEffect({ moveId, user }: { moveId: string; user: Side }) {
  const scene = SCENES[moveId];
  if (!scene) return null;
  const foe: Side = user === 0 ? 1 : 0;
  return (
    <svg
      viewBox="0 0 150 100"
      className="special-fx"
      aria-hidden="true"
      data-testid="special-effect"
      data-move={moveId}
    >
      {scene(SLOT[user], SLOT[foe], user)}
    </svg>
  );
}
