import type { ClubId } from '@/lib/story/world';

/**
 * The twelve Premier League clubs' crests (premier.ts), drawn in code in the game's own simple
 * style: each one's shape, colours and the thing you'd know it by (Brighton's seagull, the
 * cannon, the Liver bird, the red devil). Drawn on a 32 × 32 grid centred on the crest, then
 * scaled to whatever size the map or a panel wants.
 */

type Ctx = CanvasRenderingContext2D;

const NAVY = '#132257';

function fill(c: Ctx, colour: string, draw: () => void) {
  c.fillStyle = colour;
  c.beginPath();
  draw();
  c.fill();
}

function stroke(c: Ctx, colour: string, width: number, draw: () => void) {
  c.strokeStyle = colour;
  c.lineWidth = width;
  c.beginPath();
  draw();
  c.stroke();
}

const disc = (c: Ctx, x: number, y: number, r: number) => {
  c.moveTo(x + r, y);
  c.arc(x, y, r, 0, Math.PI * 2);
};

/** A heater shield, `w` half-wide, from `top` down to a point at `bottom`. */
const shield = (c: Ctx, w = 13, top = -14, bottom = 16) => {
  c.moveTo(-w, top);
  c.lineTo(w, top);
  c.lineTo(w, top + (bottom - top) * 0.5);
  c.quadraticCurveTo(w, bottom - 3, 0, bottom);
  c.quadraticCurveTo(-w, bottom - 3, -w, top + (bottom - top) * 0.5);
  c.closePath();
};

const poly = (c: Ctx, pts: number[]) => {
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
};

/** A lion standing on its hind legs, facing left, for Villa and Chelsea. */
function lion(c: Ctx, colour: string, s = 1) {
  fill(c, colour, () =>
    poly(
      c,
      [
        -2, -10, 2, -11, 4, -8, 3, -5, 6, -3, 7, 3, 5, 6, 7, 11, 4, 11, 2, 7, -1, 7, -3, 11, -6, 11,
        -4, 5, -3, 0, -6, -2, -9, -5, -7, -6, -4, -4, -4, -7,
      ].map((v) => v * s),
    ),
  );
  // The tail, curling up behind.
  stroke(c, colour, 1.5 * s, () => {
    c.moveTo(6 * s, 4 * s);
    c.quadraticCurveTo(11 * s, 2 * s, 9 * s, -3 * s);
  });
}

/** A galleon under sail, for both Manchester clubs. */
function ship(c: Ctx, hull: string, sail: string, x: number, y: number, s = 1) {
  fill(c, hull, () =>
    poly(c, [x - 7 * s, y, x + 7 * s, y, x + 5 * s, y + 3 * s, x - 5 * s, y + 3 * s]),
  );
  fill(c, sail, () => {
    poly(c, [x - 1 * s, y - 1, x - 1 * s, y - 9 * s, x - 6 * s, y - 1]);
    poly(c, [x + 1 * s, y - 1, x + 1 * s, y - 8 * s, x + 5 * s, y - 1]);
  });
}

function paint(c: Ctx, club: ClubId) {
  switch (club) {
    case 'brighton': {
      // A blue ring round a white roundel, and the seagull across it.
      fill(c, '#0057b8', () => disc(c, 0, 0, 15));
      fill(c, '#ffffff', () => disc(c, 0, 0, 11.5));
      // Wings swept up from the body, the head forward, and a yellow beak.
      fill(c, '#0057b8', () => {
        poly(c, [-1, 1, -6, -2, -11, -7, -9, -2, -4, 3]);
        poly(c, [1, 1, 6, -2, 11, -7, 9, -2, 4, 3]);
        c.ellipse(0, 2.5, 4, 2.2, 0, 0, Math.PI * 2);
        disc(c, -4, 0.5, 1.8);
      });
      fill(c, '#f5a800', () => poly(c, [-5.5, 0, -8, 1, -5.5, 1.5]));
      break;
    }
    case 'palace': {
      // Red and blue halves, the old Crystal Palace along the bottom, the eagle on its ball.
      fill(c, '#ffffff', () => shield(c, 14, -15, 16));
      c.save();
      c.beginPath();
      shield(c, 12.5, -13.5, 14.5);
      c.clip();
      c.fillStyle = '#c4122e';
      c.fillRect(-13, -14, 13, 30);
      c.fillStyle = '#1b458f';
      c.fillRect(0, -14, 13, 30);
      c.restore();
      fill(c, '#ffffff', () => {
        c.rect(-9, 3, 18, 2);
        c.rect(-4, 0, 8, 3);
      });
      for (let i = -8; i <= 8; i += 2.4) fill(c, '#ffffff', () => c.rect(i, 5, 1.2, 4));
      fill(c, '#f2b705', () => disc(c, 0, -3, 2));
      fill(c, '#f2b705', () =>
        poly(c, [0, -12, 2, -9, 10, -12, 7, -6, 2, -5, 0, -4, -2, -5, -7, -6, -10, -12, -2, -9]),
      );
      break;
    }
    case 'villa': {
      // A claret shield edged in sky blue, the lion rampant and a star.
      fill(c, '#95bfe5', () => shield(c, 14, -15, 16));
      fill(c, '#670e36', () => shield(c, 12, -13, 14));
      c.save();
      c.translate(0, 2);
      lion(c, '#fee505', 0.95);
      c.restore();
      fill(c, '#ffffff', () => {
        const pts: number[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 1.3 : 3;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push(Math.cos(a) * r, -9.5 + Math.sin(a) * r);
        }
        poly(c, pts);
      });
      break;
    }
    case 'everton': {
      // Prince Rupert's Tower on royal blue, inside two gold laurels.
      fill(c, '#ffffff', () => shield(c, 14, -15, 16));
      fill(c, '#003399', () => shield(c, 12.5, -13.5, 14.5));
      stroke(c, '#e0b84a', 1.6, () => {
        c.arc(0, 2, 10, Math.PI * 0.6, Math.PI * 1.25);
        c.moveTo(Math.cos(Math.PI * 0.4) * 10, 2 + Math.sin(Math.PI * 0.4) * 10);
        c.arc(0, 2, 10, Math.PI * 0.4, -Math.PI * 0.25, true);
      });
      fill(c, '#efe1b8', () => {
        c.rect(-4, -5, 8, 14);
        c.rect(-5, -8, 10, 3);
      });
      fill(c, '#efe1b8', () => {
        for (let i = -5; i < 5; i += 2.5) c.rect(i, -10, 1.5, 2);
      });
      fill(c, '#7a3b1a', () => {
        c.rect(-1.5, 3, 3, 6);
        c.rect(-2.5, -3, 1.2, 2.5);
        c.rect(1.3, -3, 1.2, 2.5);
      });
      break;
    }
    case 'leeds': {
      // The white rose of Yorkshire on blue, edged in yellow.
      fill(c, '#ffcd00', () => shield(c, 14, -15, 16));
      fill(c, '#1d428a', () => shield(c, 12, -13, 14));
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        fill(c, '#ffffff', () => disc(c, Math.cos(a) * 4.5, -1 + Math.sin(a) * 4.5, 4));
      }
      fill(c, '#ffcd00', () => disc(c, 0, -1, 2.6));
      fill(c, '#ffcd00', () => c.rect(-12, 8, 24, 2));
      break;
    }
    case 'newcastle': {
      // A round crest: the castle over the Tyne, with a seahorse each side, in black and white.
      fill(c, '#000000', () => disc(c, 0, 0, 15));
      fill(c, '#ffffff', () => disc(c, 0, 0, 13));
      c.save();
      c.beginPath();
      disc(c, 0, 0, 13);
      c.clip();
      c.fillStyle = '#000000';
      for (let i = -12; i < 13; i += 6) c.fillRect(i, -13, 3, 10);
      c.fillStyle = '#41b6e6';
      c.fillRect(-13, 6, 26, 8);
      c.restore();
      stroke(c, '#ffffff', 1, () => {
        c.moveTo(-10, 9);
        c.quadraticCurveTo(-5, 7, 0, 9);
        c.quadraticCurveTo(5, 11, 10, 9);
      });
      fill(c, '#a7a8aa', () => {
        c.rect(-5, -4, 10, 10);
        for (let i = -5; i < 5; i += 3) c.rect(i, -6, 2, 2);
      });
      fill(c, '#000000', () => c.rect(-1.2, 1, 2.4, 5));
      for (const side of [-1, 1]) {
        stroke(c, '#d4a017', 2, () => {
          c.moveTo(side * 9, -4);
          c.quadraticCurveTo(side * 12, 0, side * 8, 3);
          c.quadraticCurveTo(side * 6, 6, side * 9, 8);
        });
      }
      break;
    }
    case 'spurs': {
      // The cockerel standing on a ball, in navy on white.
      fill(c, '#ffffff', () => disc(c, 0, 0, 15));
      stroke(c, NAVY, 1.8, () => disc(c, 0, 10, 4.5));
      stroke(c, NAVY, 1, () => {
        c.moveTo(-4.5, 10);
        c.lineTo(4.5, 10);
        c.moveTo(0, 5.5);
        c.lineTo(0, 14.5);
      });
      fill(c, NAVY, () => {
        c.ellipse(-1, -1, 6, 4.5, 0.2, 0, Math.PI * 2);
        disc(c, 5, -8, 2.6);
        poly(c, [3, -6, 7, -6, 5, -1]);
      });
      fill(c, NAVY, () => poly(c, [-6, -2, -13, -12, -10, -3, -13, -6, -8, 1]));
      fill(c, '#c8102e', () => {
        poly(c, [4, -10.5, 5, -13, 6, -10.5]);
        poly(c, [7.5, -8, 10, -7.5, 7.5, -7]);
      });
      stroke(c, NAVY, 1.4, () => {
        c.moveTo(-2, 3);
        c.lineTo(-1, 5.8);
        c.moveTo(1, 3);
        c.lineTo(1.5, 5.8);
      });
      break;
    }
    case 'city': {
      // A navy ring round sky blue: the golden ship, the three rivers and the red rose.
      fill(c, '#1c2c5b', () => disc(c, 0, 0, 15));
      fill(c, '#6cabdd', () => disc(c, 0, 0, 12));
      ship(c, '#f4c430', '#f4c430', 0, -2, 0.9);
      stroke(c, '#ffffff', 1.2, () => {
        for (const y of [2, 4.5, 7]) {
          c.moveTo(-9, y);
          c.lineTo(-2, y + 1);
        }
      });
      fill(c, '#da291c', () => {
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          disc(c, 4 + Math.cos(a) * 1.8, 5 + Math.sin(a) * 1.8, 1.6);
        }
      });
      fill(c, '#f4c430', () => disc(c, 4, 5, 0.9));
      break;
    }
    case 'chelsea': {
      // Royal blue, a gold ring, and the lion holding his staff, over red roses.
      fill(c, '#034694', () => disc(c, 0, 0, 15));
      stroke(c, '#dba111', 1.4, () => disc(c, 0, 0, 12.5));
      lion(c, '#ffffff', 0.9);
      stroke(c, '#dba111', 1.3, () => {
        c.moveTo(-6, 9);
        c.lineTo(-6, -11);
      });
      fill(c, '#dba111', () => disc(c, -6, -11, 1.5));
      fill(c, '#ee242c', () => {
        disc(c, -7, 11, 1.6);
        disc(c, 7, 11, 1.6);
      });
      break;
    }
    case 'arsenal': {
      // A gold-edged red shield with the cannon, pointing east.
      fill(c, '#d4af37', () => shield(c, 14, -15, 16));
      fill(c, '#ef0107', () => shield(c, 12, -13, 14));
      fill(c, '#d4af37', () => c.rect(-12, -7, 24, 1.2));
      fill(c, '#ffffff', () => {
        for (let i = -9; i <= 7; i += 3.2) c.rect(i, -11.5, 2, 3);
      });
      fill(c, '#d4af37', () => {
        poly(c, [-9, 2, 9, -1, 9, 2, -9, 5]);
        disc(c, -9, 3.5, 2);
        disc(c, -4, 7, 3);
        disc(c, 4, 6, 3);
      });
      fill(c, '#ef0107', () => {
        disc(c, -4, 7, 1);
        disc(c, 4, 6, 1);
      });
      fill(c, '#063672', () => c.rect(-12, 10.5, 24, 1.5));
      break;
    }
    case 'liverpool': {
      // The Liver bird with a sprig in its beak, between the two flames.
      fill(c, '#ffffff', () => shield(c, 14, -15, 16));
      stroke(c, '#c8102e', 1.6, () => shield(c, 12.5, -13.5, 14.5));
      fill(c, '#c8102e', () => {
        // Body, neck and head.
        c.ellipse(0, 3, 4.5, 6, 0, 0, Math.PI * 2);
        c.rect(-1, -7, 3, 8);
        disc(c, 1, -8, 2.5);
      });
      fill(c, '#c8102e', () => {
        poly(c, [3, -8, 7, -7.5, 3, -6.5]);
        // The raised wing.
        poly(c, [-2, 0, -9, -9, -8, -2, -4, 4]);
        // The tail and feet.
        poly(c, [-3, 8, -5, 12, 0, 10, 5, 12, 3, 8]);
      });
      stroke(c, '#00a398', 1, () => {
        c.moveTo(6, -7.5);
        c.lineTo(8, -4);
        c.moveTo(7, -6);
        c.lineTo(9, -6.5);
      });
      for (const side of [-1, 1])
        fill(c, '#f6a01a', () =>
          poly(c, [side * 9, 10, side * 11, 4, side * 10, 0, side * 8, 5, side * 7, 10]),
        );
      break;
    }
    case 'united': {
      // The gold scroll round the shield: the ship above, the red devil with his trident below.
      fill(c, '#000000', () => disc(c, 0, 0, 15.5));
      fill(c, '#fbe122', () => disc(c, 0, 0, 14.5));
      fill(c, '#000000', () => shield(c, 10.5, -10.5, 12.5));
      fill(c, '#da291c', () => shield(c, 9.5, -9.5, 11.5));
      fill(c, '#fbe122', () => {
        c.rect(-9.5, -2.5, 19, 1.2);
      });
      ship(c, '#fbe122', '#ffffff', 0, -4.5, 0.6);
      fill(c, '#fbe122', () => {
        // The devil: head with horns, body, a forked tail.
        disc(c, -1, 1.8, 1.8);
        poly(c, [-2.6, 0.5, -3.4, -1.2, -1.8, 0.2]);
        poly(c, [0.6, 0.5, 1.4, -1.2, -0.2, 0.2]);
        poly(c, [-2.5, 3.2, 0.5, 3.2, 1.5, 8, -3.5, 8]);
        poly(c, [-3, 8, -4, 10.5, -2, 8.5, 0, 10.5, 1, 8]);
      });
      stroke(c, '#fbe122', 0.8, () => {
        c.moveTo(1, 6);
        c.quadraticCurveTo(4, 7, 3, 9.5);
      });
      stroke(c, '#fbe122', 0.8, () => {
        c.moveTo(3.5, -0.5);
        c.lineTo(3.5, 9.5);
        c.moveTo(2.2, 1);
        c.lineTo(2.2, -0.5);
        c.lineTo(4.8, -0.5);
        c.lineTo(4.8, 1);
      });
      break;
    }
  }
}

/** A club's crest, `size` pixels high, centred on (x, y). */
export function paintCrest(c: Ctx, club: ClubId, x: number, y: number, size: number) {
  c.save();
  c.translate(x, y);
  c.scale(size / 32, size / 32);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  paint(c, club);
  c.restore();
}
