"""A body kit for drawn Ranemon: pixel-art figures from a short description of each friend.

Every figure is the same chibi body (a big head on a small body), described on a 96-pixel grid and
drawn at twice that, 192 pixels, like the game's HD looks, dressed from a `Look`: skin, hair,
facial hair, eyes, mouth, a hat, the top and its pattern, trousers, a pose and a prop. Each part is
a shape with a colour ramp. The kit shades every part as a rounded form lit from the top left, in
five hue-shifted tones (warm lights, cool shadows, skin into red), with shadows cast by the parts in
front and the deep tone for the inner lines; it combs strands into hair and beards, draws the face
at full size (irises, catchlights, lids, brows, a shaded nose) and finishes with an outline coloured
from what it wraps, a back light on the right and a dark outer ring. `front` is the foe's view and
`back` your own.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import sprites  # noqa: E402  (the game's outline and shiny palette)

SIZE = 96  # the grid every shape is described on
SCALE = 2  # and drawn at twice that: 192 pixels, the size of the game's HD looks
N = SIZE * SCALE
CX = 48
INK = (40, 40, 48)

Ramp = tuple[tuple[int, int, int], tuple[int, int, int], tuple[int, int, int]]
Paint = Callable[[int, int], Ramp]


def ramp(mid, light=None, dark=None) -> Ramp:
    """A light, mid and dark tone from a mid colour."""
    m = np.array(mid, float)
    lo = np.clip(m * 1.16 + 22, 0, 255) if light is None else np.array(light, float)
    hi = np.clip(m * 0.66, 0, 255) if dark is None else np.array(dark, float)
    return tuple(int(v) for v in lo), tuple(int(v) for v in m), tuple(int(v) for v in hi)


def solid(mid) -> Paint:
    r = ramp(mid)
    return lambda x, y: r


def plaid(base, dark, light, cream=None, size=8) -> Paint:
    """A check: dark bands, a pale stripe between them and a fine thread where they cross."""
    b, d, l = ramp(base), ramp(dark), ramp(light)
    c = ramp(cream) if cream else l

    def paint(x, y, size=size):
        u, v = x % size, y % size
        band = range(max(1, size // 6))
        if u in band or v in band:
            return d
        if u == size // 2 or v == size // 2:
            return c if u == v else l
        return b

    return paint


def stripes(a, b, period=6, width=3) -> Paint:
    ra, rb = ramp(a), ramp(b)
    return lambda x, y: rb if y % period < width else ra


def speckle(base, fleck, every=5) -> Paint:
    """A patterned shirt: little flecks on a ground."""
    rb, rf = ramp(base), ramp(fleck)
    return lambda x, y: rf if (x * 3 + y * 7) % every == 0 and (x + y) % 2 else rb


SKIN = ramp((236, 178, 140), (250, 214, 178), (196, 128, 100))
SKIN_RUDDY = ramp((230, 160, 128), (248, 200, 168), (188, 112, 90))
# More skin tones, for the London Ranemon: they're London, so they're everyone.
SKIN_PALE = ramp((244, 204, 176), (255, 228, 206), (206, 156, 128))
SKIN_OLIVE = ramp((214, 160, 112), (236, 194, 150), (168, 112, 74))
SKIN_BROWN = ramp((170, 112, 72), (204, 148, 104), (120, 72, 44))
SKIN_DEEP = ramp((116, 72, 48), (152, 102, 70), (78, 44, 30))


# --- Shapes ---------------------------------------------------------------------------------


class Scaled:
    """An ImageDraw that takes the 96-pixel grid's coordinates and draws them at full size."""

    def __init__(self, im):
        self.im = im
        self.d = ImageDraw.Draw(im)

    def text(self, xy, s, fill=None, **kw):
        """Text in the grid's own pixel font, blown up: the same lettering, just bigger."""
        t = Image.new("RGBA", (SIZE, SIZE))
        ImageDraw.Draw(t).text(xy, s, fill=fill, **kw)
        self.im.alpha_composite(t.resize((N, N), Image.NEAREST))

    @staticmethod
    def _pts(xy):
        if len(xy) and np.isscalar(xy[0]):
            xy = list(zip(xy[::2], xy[1::2]))
        return [(x * SCALE + 0.5, y * SCALE + 0.5) for x, y in xy]

    @staticmethod
    def _box(b):
        x0, y0, x1, y1 = b if len(b) == 4 else (*b[0], *b[1])
        return [x0 * SCALE, y0 * SCALE, x1 * SCALE + SCALE - 1, y1 * SCALE + SCALE - 1]

    def rectangle(self, b, **kw):
        self.d.rectangle(self._box(b), **kw)

    def ellipse(self, b, **kw):
        self.d.ellipse(self._box(b), **kw)

    def rounded_rectangle(self, b, r=0, **kw):
        self.d.rounded_rectangle(self._box(b), r * SCALE, **kw)

    def arc(self, b, a0, a1, fill=None, width=1):
        self.d.arc(self._box(b), a0, a1, fill=fill, width=width * SCALE)

    def polygon(self, xy, **kw):
        self.d.polygon(self._pts(xy), **kw)

    def line(self, xy, fill=None, width=1, **kw):
        self.d.line(self._pts(xy), fill=fill, width=width * SCALE, joint="curve")

    def point(self, xy, fill=None):
        for x, y in self._pts(xy if isinstance(xy, list) else [xy]):
            self.d.rectangle([x - 0.5, y - 0.5, x + SCALE - 1.5, y + SCALE - 1.5], fill=fill)


def draw(im: Image.Image):
    """Something to draw on a figure with, in the grid's coordinates whatever size it is."""
    return Scaled(im) if im.width == N else ImageDraw.Draw(im)


def _mask(fn) -> np.ndarray:
    m = Image.new("L", (N, N))
    fn(Scaled(m))
    return np.array(m) > 0


def ellipse(x0, y0, x1, y1):
    return _mask(lambda d: d.ellipse([x0, y0, x1, y1], fill=255))


def poly(*pts):
    return _mask(lambda d: d.polygon(list(pts), fill=255))


def rect(x0, y0, x1, y1):
    return _mask(lambda d: d.rectangle([x0, y0, x1, y1], fill=255))


def capsule(a, b, w):
    def draw(d):
        d.line([a, b], fill=255, width=w)
        r = w / 2 - 0.5
        for x, y in (a, b):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)

    return _mask(draw)


# Every pixel's place on the grid, in grid pixels (halves at double size).
Y, X = np.mgrid[0:N, 0:N] / SCALE


def shift(mask, dx, dy):
    """mask at (x + dx, y + dy), False off the edge."""
    out = np.zeros_like(mask)
    h, w = mask.shape
    ys, yd = (slice(dy, h), slice(0, h - dy)) if dy >= 0 else (slice(0, h + dy), slice(-dy, h))
    xs, xd = (slice(dx, w), slice(0, w - dx)) if dx >= 0 else (slice(0, w + dx), slice(-dx, w))
    out[yd, xd] = mask[ys, xs]
    return out


def moved(a, dx, dy):
    """An array (of any depth) read at (x + dx, y + dy), zero off the edge."""
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    out[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)] = \
        a[max(0, dy):h - max(0, -dy), max(0, dx):w - max(0, -dx)]
    return out


def _mix(a, b, t):
    return np.asarray(a, float) * (1 - t) + np.asarray(b, float) * t


WARM, COOL, NIGHT = (255, 236, 190), (70, 56, 130), (34, 26, 58)


def tones(r: Ramp) -> list[np.ndarray]:
    """A ramp as five hue-shifted tones: glint, light (warmer), mid, shadow (cooler) and deep.
    Skin shades warm, into red; everything else cools into blue-violet."""
    l, m, d = (np.array(c, float) for c in r)
    skin = m[0] > 150 and m[0] > m[1] + 25 and m[1] > m[2] + 10
    shadow = _mix(d, (150, 60, 66), 0.18) if skin else _mix(d, COOL, 0.22)
    return [np.clip(c, 0, 255) for c in (
        _mix(l, (255, 250, 230), 0.45), _mix(l, WARM, 0.18), m, shadow, _mix(shadow * 0.72, NIGHT, 0.3))]


def _depth(mask, cap):
    """How far in from the edge each pixel of a mask is, up to cap."""
    d = np.zeros(mask.shape, float)
    m = mask.copy()
    for _ in range(cap):
        d[m] += 1
        m = m & moved(m, 1, 0) & moved(m, -1, 0) & moved(m, 0, 1) & moved(m, 0, -1)
        if not m.any():
            break
    return d


def _blur(a, n):
    for _ in range(n):
        a = (a + moved(a, 1, 0) + moved(a, -1, 0) + moved(a, 0, 1) + moved(a, 0, -1)) / 5
    return a


LIGHT = np.array((-0.55, -0.7, 0.75)) / np.linalg.norm((-0.55, -0.7, 0.75))


class Figure:
    """Parts drawn back to front, each with a mask, a paint and whether it gets a line."""

    def __init__(self):
        self.layers: list[tuple[np.ndarray, Paint, bool]] = []
        self.hair: set[int] = set()  # the layers that get strands

    def part(self, mask, paint, line=True, hair=False):
        if not callable(paint):
            r = paint
            paint = lambda x, y: r  # noqa: E731
        if hair:
            self.hair.add(len(self.layers))
        self.layers.append((mask, paint, line))

    def render(self) -> Image.Image:
        """Each part shaded as a rounded form lit from the top left: its height rises from its edge,
        the slope facing the light is lit and the far side falls into shadow, in five hue-shifted
        tones. The parts in front cast a shadow down and to the right; where a part sits in front
        of another its edge takes the deep tone for the inner lines."""
        k = SCALE
        z = np.full((N, N), -1)
        for i, (mask, _, _) in enumerate(self.layers):
            z[mask] = i
        out = np.zeros((N, N, 4), np.uint8)
        deep = np.zeros((N, N, 3))
        for i, (mask, paint, line) in enumerate(self.layers):
            own = z == i
            if not own.any():
                continue
            h = _blur(np.sqrt(np.minimum(_depth(mask, 12 * k), 9 * k) / (9 * k)), k)
            gy, gx = np.gradient(h * 5 * k)
            n = np.stack((-gx, -gy, np.ones_like(h)), -1)
            lit = (n / np.linalg.norm(n, axis=-1, keepdims=True)) @ LIGHT
            step = np.select([lit > 0.93, lit > 0.8, lit > 0.6, lit > 0.38], [0.6, 1, 2, 2.5], 3).astype(float)
            front = np.zeros_like(mask)
            for m, _, l in self.layers[i + 1:]:
                if l:
                    front |= m
            cast = own & moved(front, -2 * k, -3 * k) & ~front
            step = np.where(cast, np.maximum(step, 2.5) + 0.5, step)
            for y, x in zip(*np.nonzero(own)):
                t = tones(paint(x // k, y // k))
                s = step[y, x]
                if s == 0.6:  # a glint, only on the very top of a form
                    c = t[0] if (x + y) % 3 == 0 else t[1]
                elif s % 1:  # between two tones: a tone of its own, half way
                    c = _mix(t[int(s)], t[int(s) + 1], 0.5)
                else:
                    c = t[int(min(s, 4))]
                out[y, x, :3] = np.clip(c, 0, 255)
                out[y, x, 3] = 255
                deep[y, x] = t[4]
            if line:
                behind = np.zeros_like(own)
                for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                    nb = moved(z + 1, dx, dy) - 1
                    behind |= own & (nb >= 0) & (nb < i)
                out[behind, :3] = deep[behind].astype(np.uint8)
            if i in self.hair:
                strands(out, own, paint(CX, 10)[1], seed=i)
        return Image.fromarray(out, "RGBA")


def strands(out: np.ndarray, mask: np.ndarray, colour, seed=1, every=3, length=5):
    """Fine strands combed down and out from the parting, some darker, some catching the light."""
    rng = np.random.default_rng(seed)
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return
    dark, light = np.array(colour) * 0.62, np.minimum(np.array(colour) * 1.25 + 18, 255)
    for j in rng.choice(len(ys), len(ys) // (every * length), replace=False):
        y, x = ys[j], xs[j]
        lean = np.sign(x - CX * SCALE) * 0.35
        c = light if rng.random() < 0.35 else dark
        for t in range(length):
            yy, xx = y + t, int(round(x + lean * t))
            if 0 <= yy < N and 0 <= xx < N and mask[yy, xx]:
                out[yy, xx, :3] = (out[yy, xx, :3] * 0.4 + c * 0.6).astype(np.uint8)


def outline(im: Image.Image, rim=(255, 240, 200)) -> Image.Image:
    """The finish round a figure: an outline coloured from the pixel it wraps (darker on the shadow
    side, softer on the lit side), a back light just inside it on the right, and a second, darker
    ring outside so it reads as boldly at the game's size as the handhelds' 1-pixel line."""
    body = np.asarray(im)[..., 3] > 0
    out = _ring(np.asarray(im).astype(float), soft=True)
    edge = body & ~moved(body, 1, 0) & moved(body, -1, 0)
    out[edge, :3] = _mix(out[edge, :3], rim, 0.35)
    return Image.fromarray(_ring(out, soft=False).clip(0, 255).astype(np.uint8), "RGBA")


def _ring(a: np.ndarray, soft: bool) -> np.ndarray:
    op = a[..., 3] > 0
    out = a.copy()
    for (dy, dx), lit in (((1, 0), True), ((0, 1), True), ((-1, 0), False), ((0, -1), False)):
        # (dy, dx) is the step from the ring pixel to the body pixel it hugs.
        ring = ~op & moved(op, dx, dy) & (out[..., 3] == 0)
        src = moved(a[..., :3], dx, dy)
        dark = _mix(src * 0.32, NIGHT, 0.55)
        c = _mix(dark, src, 0.22) if lit and soft else dark
        out[ring, :3] = c[ring]
        out[ring, 3] = 255
    return out


# --- The look -------------------------------------------------------------------------------


@dataclass
class Look:
    skin: Ramp = SKIN
    # bald, short, slick, quiff, messy, long, curly, swept, bun, afro, bob, ponytail
    hair: str = "short"
    hair_colour: tuple = (120, 80, 48)
    # none, stubble, beard, bigbeard, goatee, moustache, bigmoustache, tache_stubble
    face_hair: str = "none"
    face_hair_colour: tuple | None = None
    # open, lids, happy, shades, glasses, round, down
    eyes: str = "open"
    eye_colour: tuple = (64, 92, 120)
    lens: tuple = (24, 24, 32)
    frame: tuple = (40, 40, 48)
    # smile, grin, smirk, flat, laugh
    mouth: str = "smile"
    # none, cap, trilby, fila, headphones, beanie, helmet
    hat: str = "none"
    hat_colour: tuple = (60, 60, 70)
    hat_band: tuple = (120, 200, 140)
    # The top: what's underneath, and what's over it, if anything.
    inner: Paint = field(default_factory=lambda: solid((240, 238, 230)))
    # none, open (an unbuttoned shirt), jacket (a zipped coat), blazer, gown, robe
    outer: str = "none"
    outer_paint: Paint | None = None
    # crew, collar, turtle, v, none
    neck: str = "crew"
    neck_colour: tuple | None = None
    sleeves: str = "long"  # long or short: short shows the forearms
    tie: tuple | None = None
    bowtie: tuple | None = None
    scarf: tuple | None = None  # two colours, stripes
    trim: tuple | None = None  # a gown's hood trim
    trousers: tuple = (44, 44, 56)
    shoes: tuple = (64, 54, 48)
    # point, hips, down, crossed, moustache, chin, hold, raise, both, guard
    pose: str = "down"
    # none, fish, stein, can, wine, fakemoustache, shades_collar, tricolour, chefbuttons,
    # beads, tattoo, logo, baguette; and for London: cup, tote, card, laptop, flowers, bagel, skateboard,
    # placard, vape, lanyard, apron, phone
    props: tuple = ()
    build: float = 1.0
    # Boxing gloves in this colour in place of hands.
    gloves: tuple | None = None
    # Extra parts, such as an evolution's costume: called as extras(figure, look, stage, view)
    # at each stage of the drawing (behind, body, head, front; then paint with the image).
    extras: Callable | None = None
    long_robe: bool = False


def _hair_ramp(look: Look) -> Ramp:
    return ramp(look.hair_colour)


def _hair_paint(look: Look) -> Paint:
    """Hair with strands: a darker line every few pixels, swept to one side."""
    r = ramp(look.hair_colour)
    strand = (r[1], r[2], r[2])
    curl = look.hair == "curly"
    def paint(x, y):
        if curl:
            return strand if (x * x + y * 3) % 7 == 0 else r
        # Combed strands: short vertical lines, staggered.
        return strand if (x + (y // 5) * 3) % 6 == 0 and y % 5 != 0 else r

    return paint


def bumps(cx, cy, rx, ry, r, a0=180, a1=360, n=12):
    """Little circles round the edge of an ellipse: curls."""
    m = np.zeros((N, N), bool)
    for i in range(n + 1):
        a = np.radians(a0 + (a1 - a0) * i / n)
        x, y = cx + rx * np.cos(a), cy + ry * np.sin(a)
        m |= ellipse(x - r, y - r, x + r, y + r)
    return m


def _face_hair_ramp(look: Look) -> Ramp:
    return ramp(look.face_hair_colour or look.hair_colour)


def hair_front(look: Look) -> np.ndarray | None:
    cap = ellipse(25, 2, 71, 48)
    side = np.abs(X - CX)
    h = look.hair
    if h == "bald":
        return None
    forehead = {"slick": 12, "swept": 14, "curly": 15, "quiff": 13}.get(h, 15)
    # A side parting: the fringe comes down a little lower on the left.
    fringe = forehead + (side // 7) + np.where(X < CX - 2, 2, 0) + (X // 3) % 2
    line = np.where(side > 20, 29, np.where(side > 16, 21, fringe))
    m = cap & (Y < line)
    if h == "quiff":
        m |= poly((32, 12), (36, 2), (46, -2), (60, -2), (68, 4), (66, 12), (54, 8), (42, 12))
    if h == "messy":
        for x in range(28, 70, 6):
            m |= poly((x, 10), (x + 6, 8), (x + 3, 0))
    if h == "swept":
        m |= poly((26, 18), (40, 2), (66, 4), (52, 12), (34, 20))
    if h == "curly":
        m |= bumps(CX, 24, 22, 21, 4, 160, 380, 14) & (Y < 32)
    if h == "long":
        m |= poly((25, 14), (31, 14), (31, 46), (26, 52), (22, 48), (23, 30))
        m |= poly((65, 14), (71, 14), (73, 30), (74, 48), (70, 52), (65, 46))
    if h == "bun":
        m |= ellipse(39, -6, 57, 9)
    if h == "afro":
        m |= bumps(CX, 20, 25, 20, 6, 150, 390, 16) & (Y < 34)
    if h == "bob":
        m |= poly((24, 14), (31, 14), (31, 40), (24, 42)) | poly((65, 14), (72, 14), (72, 42), (65, 40))
    if h == "ponytail":
        m |= ellipse(64, 6, 78, 20)
    return m


def hair_back(look: Look) -> np.ndarray | None:
    h = look.hair
    if h == "bald":
        return None
    m = ellipse(25, 7, 73, 55) & (Y < (50 if h != "long" else 60))
    if h == "long":
        m |= ellipse(22, 30, 76, 64) & (Y < 62)
    if h == "quiff":
        m |= poly((32, 16), (38, 6), (50, 2), (64, 4), (70, 10), (66, 18))
    if h == "messy":
        for x in range(28, 72, 6):
            m |= poly((x, 14), (x + 6, 12), (x + 3, 4))
    if h == "curly":
        m |= bumps(49, 30, 23, 23, 5, 150, 390, 16) & (Y < 52)
    if h == "bun":
        m |= ellipse(39, -2, 59, 16)
    if h == "afro":
        m |= bumps(49, 28, 26, 24, 7, 140, 400, 18) & (Y < 54)
    if h == "bob":
        m |= ellipse(22, 20, 76, 62) & (Y < 58)
    if h == "ponytail":
        m |= capsule((49, 40), (52, 66), 9)
    return m


def face_hair_mask(kind: str) -> np.ndarray | None:
    full = poly((27, 30), (31, 40), (40, 39), (48, 41), (56, 39), (65, 40), (69, 30),
                (68, 44), (60, 54), (48, 58), (36, 54), (28, 44))
    if kind == "beard":
        return full
    if kind == "bigbeard":
        return full | poly((30, 42), (66, 42), (62, 60), (48, 67), (34, 60))
    if kind == "goatee":
        return poly((42, 45), (54, 45), (53, 53), (48, 56), (43, 53)) | _tache()
    if kind in ("moustache",):
        return _tache()
    if kind == "bigmoustache":
        return poly((38, 39), (48, 37), (58, 39), (60, 46), (56, 45), (48, 42), (40, 45), (36, 46))
    return None


def _tache():
    return poly((40, 40), (48, 38), (56, 40), (55, 43), (48, 41), (41, 43))


@dataclass
class Arm:
    shoulder: tuple
    elbow: tuple
    hand: tuple
    late: bool = False  # in front of the face (a hand at the mouth)
    finger: tuple | None = None  # a pointing finger: its tip


def arms_front(look: Look, hw: int) -> list[Arm]:
    ls, rs = (CX - hw + 1, 57), (CX + hw - 1, 57)
    p = look.pose
    down_l = Arm(ls, (ls[0] - 4, 69), (ls[0] - 4, 79))
    down_r = Arm(rs, (rs[0] + 4, 69), (rs[0] + 4, 79))
    hip_r = Arm(rs, (rs[0] + 9, 66), (rs[0] + 4, 77))
    hip_l = Arm(ls, (ls[0] - 9, 66), (ls[0] - 4, 77))
    if p == "point":
        return [Arm(ls, (ls[0] - 7, 71), (13, 65), finger=(3, 63)), hip_r]
    if p == "hips":
        return [hip_l, hip_r]
    if p == "crossed":
        return [Arm(ls, (ls[0] - 3, 70), (CX + 12, 66)), Arm(rs, (rs[0] + 3, 71), (CX - 12, 70))]
    if p == "moustache":
        return [Arm(ls, (ls[0] - 9, 64), (CX - 8, 45), late=True),
                Arm(rs, (rs[0] + 9, 64), (CX + 8, 45), late=True)]
    if p == "chin":
        return [Arm(ls, (ls[0] - 4, 72), (CX - 6, 52), late=True), down_r]
    if p == "hold":
        return [down_l, Arm(rs, (rs[0] + 5, 72), (rs[0] - 4, 70))]
    if p == "raise":
        return [Arm(ls, (ls[0] - 9, 50), (ls[0] - 11, 38)), down_r]
    if p == "guard":  # fists up, like a boxer
        return [Arm(ls, (ls[0] - 6, 72), (CX - 9, 62)), Arm(rs, (rs[0] + 6, 72), (CX + 9, 60))]
    if p == "both":  # holding something across the body with both hands
        return [Arm(ls, (ls[0] - 6, 70), (CX - 20, 68), late=True),
                Arm(rs, (rs[0] + 6, 70), (CX + 20, 68), late=True)]
    return [down_l, down_r]


def _sleeve(look: Look) -> Paint:
    if look.outer != "none" and look.outer_paint:
        return look.outer_paint
    return look.inner


def draw_arm(f: Figure, look: Look, a: Arm, behind=False):
    sleeve = _sleeve(look)
    if look.sleeves == "short" and look.outer == "none":
        mid = ((a.shoulder[0] + a.elbow[0]) // 2 + 1, (a.shoulder[1] + a.elbow[1]) // 2 + 1)
        f.part(capsule(a.shoulder, a.elbow, 8), look.skin)
        f.part(capsule(a.elbow, a.hand, 7), look.skin)
        f.part(capsule(a.shoulder, mid, 10), sleeve)
    else:
        f.part(capsule(a.shoulder, a.elbow, 9), sleeve)
        f.part(capsule(a.elbow, a.hand, 8), sleeve)
    hx, hy = a.hand
    hand = ellipse(hx - 4, hy - 4, hx + 4, hy + 4)
    if a.finger:
        hand |= capsule((hx - 2, hy - 1), a.finger, 3)
    if look.gloves:
        f.part(ellipse(hx - 6, hy - 6, hx + 6, hy + 6), ramp(look.gloves))
        return
    f.part(hand, look.skin)


def torso_front(f: Figure, look: Look, hw: int):
    bottom = 92 if look.long_robe else 84
    body = poly((CX - hw, 54), (CX + hw, 54), (CX + hw + 4, bottom), (CX - hw - 4, bottom))
    body |= ellipse(CX - hw - 3, 52, CX - hw + 9, 64) | ellipse(CX + hw - 9, 52, CX + hw + 3, 64)
    o = look.outer
    if o == "none":
        f.part(body, look.inner)
    else:
        f.part(body, look.outer_paint)
        if o == "open":
            f.part(poly((CX - 3, 54), (CX + 3, 54), (CX + 12, bottom), (CX - 12, bottom)), look.inner)
        elif o in ("blazer", "gown"):
            f.part(poly((CX - 5, 54), (CX + 5, 54), (CX + 2, 74), (CX - 2, 74)), look.inner)
            lap = ramp(np.array(look.outer_paint(0, 0)[1]) * 0.8)
            f.part(poly((CX - 8, 53), (CX - 4, 54), (CX - 1, 72), (CX - 9, 62)), lap)
            f.part(poly((CX + 8, 53), (CX + 4, 54), (CX + 1, 72), (CX + 9, 62)), lap)
        elif o == "jacket":
            f.part(rect(CX, 58, CX, bottom - 1), ramp((150, 150, 160)), line=False)
        if look.trim:
            t = ramp(look.trim)
            f.part(poly((CX - 13, 53), (CX - 9, 53), (CX, 66), (CX + 9, 53), (CX + 13, 53),
                        (CX, 72)), t)
    neck = look.neck
    nc = ramp(look.neck_colour) if look.neck_colour else None
    if neck == "collar":
        c = nc or ramp((236, 236, 240))
        f.part(poly((CX - 9, 51), (CX - 1, 54), (CX - 4, 59)) | poly((CX + 9, 51), (CX + 1, 54), (CX + 4, 59)), c)
    elif neck == "turtle":
        f.part(rect(CX - 8, 49, CX + 8, 56), nc or look.inner)
    elif neck == "v":
        f.part(poly((CX - 7, 53), (CX + 7, 53), (CX, 64)), look.skin)
    elif neck == "hood":
        f.part((ellipse(CX - 17, 45, CX + 17, 62) & ~ellipse(CX - 9, 46, CX + 9, 60)) | rect(CX - 1, 58, CX + 1, 70), nc or look.inner)
    elif neck == "crew" and look.outer in ("none", "open", "jacket"):
        f.part(ellipse(CX - 7, 50, CX + 7, 57) & (Y > 53), look.skin)
    if look.tie:
        t = ramp(look.tie)
        f.part(poly((CX - 2, 54), (CX + 2, 54), (CX + 3, 70), (CX, 74), (CX - 3, 70)), t)
    if look.bowtie:
        b = ramp(look.bowtie)
        f.part(poly((CX - 7, 52), (CX, 55), (CX + 7, 52), (CX + 7, 58), (CX, 55), (CX - 7, 58)), b)
    if look.scarf:
        f.part(poly((CX - 12, 52), (CX + 12, 52), (CX + 9, 58), (CX - 9, 58)) | rect(CX + 2, 56, CX + 8, 76),
               stripes(look.scarf[0], look.scarf[1], 4, 2))


def legs_front(f: Figure, look: Look):
    if look.long_robe:
        f.part(ellipse(CX - 15, 88, CX - 1, 94) | ellipse(CX + 1, 88, CX + 15, 94), ramp(look.shoes))
        return
    f.part(rect(CX - 11, 78, CX - 2, 90) | rect(CX + 3, 78, CX + 12, 90), ramp(look.trousers))
    f.part(ellipse(CX - 15, 87, CX - 1, 94) | ellipse(CX + 2, 87, CX + 16, 94), ramp(look.shoes))


def head_front(f: Figure, look: Look):
    if look.hair != "long":
        f.part(ellipse(22, 26, 29, 37) | ellipse(67, 26, 74, 37), look.skin)
    f.part(ellipse(26, 4, 70, 50), look.skin)
    fh = face_hair_mask(look.face_hair)
    if fh is not None:
        f.part(fh, _face_hair_ramp(look), hair=True)
    hm = hair_front(look)
    if hm is not None:
        f.part(hm, _hair_paint(look), hair=True)
    hat_front(f, look)


def hat_front(f: Figure, look: Look):
    h, c = look.hat, ramp(look.hat_colour)
    if h == "cap":
        f.part(ellipse(25, 0, 71, 34) & (Y < 18), c)
        f.part(ellipse(30, 13, 72, 22), ramp(np.array(look.hat_colour) * 0.85))
    elif h == "trilby":
        f.part(ellipse(16, 11, 80, 23), c)
        f.part(poly((30, 14), (33, 1), (48, -1), (63, 1), (66, 14)), c)
        f.part(rect(31, 10, 65, 14), ramp(look.hat_band))
    elif h == "fila":
        f.part(poly((27, 18), (69, 18), (66, 8), (62, 0), (56, 0), (44, 3), (31, 9)), c)
        f.part(rect(27, 14, 69, 18), ramp(np.array(look.hat_colour) * 0.9))
    elif h == "headphones":
        f.part(capsule((25, 22), (48, 2), 4) | capsule((71, 22), (48, 2), 4), c)
        f.part(ellipse(20, 20, 30, 36) | ellipse(66, 20, 76, 36), c)
    elif h == "beanie":
        f.part(ellipse(25, -2, 71, 36) & (Y < 16), c)
        f.part(rect(25, 12, 71, 18), ramp(np.array(look.hat_colour) * 0.85))
    elif h == "helmet":
        f.part(ellipse(23, -4, 73, 34) & (Y < 18), c)
        f.part(rect(36, 0, 39, 9) | rect(47, -2, 50, 9) | rect(58, 0, 61, 9), ramp(look.hat_band), line=False)


def _eyes(hd: ImageDraw.ImageDraw, look: Look, ey: int):
    """Eyes at full size: white, an iris in the eye colour, a pupil, a catchlight, the lash line
    over the top, and for heavy lids the skin of the lid over the top third."""
    k = SCALE
    sk = [tuple(int(v) for v in c) for c in tones(look.skin)]
    iris = tuple(int(v) for v in look.eye_colour)
    rim = tuple(int(v * 0.7) for v in look.eye_colour)
    lash = (44, 30, 34)
    for x in (36, 55):
        ex, cx, cy = x * k, x * k + 5, ey * k + 3
        hd.ellipse([ex, cy - 4, ex + 10, cy + 4], fill=(246, 244, 240))
        hd.ellipse([cx - 3, cy - 3, cx + 3, cy + 4], fill=iris)
        hd.ellipse([cx - 2, cy - 2, cx + 2, cy + 3], fill=rim)
        hd.rectangle([cx - 1, cy - 1, cx + 1, cy + 1], fill=(20, 22, 30))
        hd.point((cx + 1, cy - 2), fill=(255, 255, 255))
        hd.point((cx - 2, cy + 2), fill=tuple(min(255, v + 80) for v in iris))
        if look.eyes == "lids":
            hd.chord([ex - 1, cy - 6, ex + 11, cy + 2], 180, 360, fill=sk[3])
            hd.chord([ex - 1, cy - 7, ex + 11, cy + 1], 180, 360, fill=sk[2])
            hd.line([(ex - 1, cy - 2), (ex + 11, cy - 2)], fill=lash, width=2)
        else:
            hd.arc([ex - 1, cy - 5, ex + 11, cy + 5], 195, 345, fill=lash, width=2)
        hd.line([(ex + 1, cy + 4), (ex + 9, cy + 4)], fill=sk[3])


def _fist(im: Image.Image, look: Look, hand):
    """A fist at the chin: curled fingers and a thumb."""
    hd = ImageDraw.Draw(im)
    sk = [tuple(int(v) for v in c) for c in tones(look.skin)]
    hx, hy = hand[0] * SCALE, hand[1] * SCALE
    for i in range(3):
        hd.arc([hx - 7, hy - 4 + i * 3, hx + 3, hy + 1 + i * 3], 20, 160, fill=sk[3], width=1)
    hd.line([(hx + 4, hy + 4), (hx + 6, hy - 4)], fill=sk[3], width=1)
    hd.line([(hx + 3, hy + 4), (hx + 5, hy - 4)], fill=sk[1], width=1)
    for x in (hx - 5, hx - 2, hx + 1):
        hd.point((x, hy - 4), fill=sk[0])


def face(im: Image.Image, look: Look):
    d = draw(im)
    hd = ImageDraw.Draw(im)
    k = SCALE
    brow = _face_hair_ramp(look)[2] if look.hair == "bald" else _hair_ramp(look)[2]
    sk = [tuple(int(v) for v in c) for c in tones(look.skin)]
    e = look.eyes
    ey = 26
    if e in ("open", "lids", "glasses", "round"):
        _eyes(hd, look, ey)
    if e == "happy":
        for x in (36, 55):
            d.line([(x, ey + 2), (x + 1, ey)], fill=INK)
            d.line([(x + 1, ey), (x + 3, ey)], fill=INK)
            d.line([(x + 3, ey), (x + 4, ey + 2)], fill=INK)
    if e == "down":
        for x in (36, 55):
            d.line([(x, ey + 2), (x + 4, ey + 2)], fill=INK)
            d.line([(x + 1, ey + 3), (x + 3, ey + 3)], fill=look.skin[2])
    if e in ("glasses", "round"):
        for x in (34, 53):
            if e == "round":
                d.ellipse([x, ey - 3, x + 8, ey + 5], outline=look.frame)
            else:
                d.rectangle([x, ey - 3, x + 8, ey + 4], outline=look.frame)
        d.line([(42, ey - 1), (53, ey - 1)], fill=look.frame)
        d.line([(28, ey - 1), (34, ey - 1)], fill=look.frame)
        d.line([(61, ey - 1), (68, ey - 1)], fill=look.frame)
    if e == "shades":
        lo = tuple(min(255, int(c * 1.6) + 40) for c in look.lens)
        for x in (33, 52):
            d.rounded_rectangle([x, ey - 3, x + 10, ey + 4], 2, fill=look.lens, outline=INK)
            d.line([(x + 2, ey - 1), (x + 4, ey - 1)], fill=lo)
            d.point((x + 2, ey), fill=lo)
        d.line([(43, ey - 2), (52, ey - 2)], fill=INK)
        d.line([(27, ey - 2), (33, ey - 2)], fill=INK)
        d.line([(63, ey - 2), (69, ey - 2)], fill=INK)
    if e != "shades":
        # Brows: thick at the inner end, thinning out to a tip; thinner under a hat's brim.
        w = 3 if look.hat not in ("cap", "trilby", "fila", "beanie", "helmet") else 2
        for inner, outer in ((40 * k + 1, 35 * k), (55 * k, 60 * k + 1)):
            tip = outer + (-2 if outer < inner else 2)
            hd.line([(inner, 21 * k + 1), (outer, 22 * k - 2)], fill=brow, width=w)
            hd.line([(outer, 22 * k - 2), (tip, 22 * k + 1)], fill=brow, width=w - 1)
    # The nose: a shadow down its far side and under it, a glint on the tip; colour in the cheeks.
    hd.line([(50 * k, 29 * k), (51 * k, 33 * k)], fill=sk[3], width=1)
    hd.line([(46 * k, 34 * k + 1), (50 * k, 34 * k + 1)], fill=sk[3], width=1)
    hd.point((46 * k, 34 * k), fill=sk[3])
    hd.point((48 * k - 1, 33 * k - 1), fill=sk[0])
    blush = tuple(int(v) for v in _mix(look.skin[1], (220, 110, 110), 0.35))
    for cx in (34 * k, 62 * k) if look.face_hair in ("none", "moustache", "goatee") else ():
        for y in range(33 * k, 36 * k, 2):
            for x in range(cx - 4, cx + 5, 2):
                hd.point((x + (y // 2) % 2, y), fill=blush)
    # Bare skin round the mouth when there's a beard, then the moustache over it.
    fh = look.face_hair
    fr = _face_hair_ramp(look)
    if fh in ("beard", "bigbeard"):
        d.ellipse([43, 41, 53, 47], fill=look.skin[1])
        d.polygon([(40, 40), (48, 38), (56, 40), (54, 42), (48, 41), (42, 42)], fill=fr[1])
    if fh in ("stubble", "tache_stubble"):
        for y in range(36, 52):
            for x in range(28, 69):
                inside = ((x - 48) / 21) ** 2 + ((y - 27) / 23) ** 2 < 1
                if inside and y > 38 - (0 if abs(x - 48) > 12 else -2) and (x + y) % 2 == 0:
                    d.point((x, y), fill=fr[1])
        if fh == "tache_stubble":
            d.polygon([(40, 40), (48, 38), (56, 40), (55, 43), (48, 41), (41, 43)], fill=fr[1])
    m = look.mouth
    my = 44 if fh not in ("bigmoustache",) else 47
    if m == "smirk":
        d.line([(44, my), (50, my - 1)], fill=(120, 60, 50))
        d.line([(45, my + 1), (49, my + 1)], fill=(200, 110, 100))
    elif m == "smile":
        d.line([(43, my - 1), (44, my)], fill=(120, 60, 50))
        d.line([(44, my), (52, my)], fill=(120, 60, 50))
        d.line([(52, my), (53, my - 1)], fill=(120, 60, 50))
    elif m in ("grin", "laugh"):
        h = 4 if m == "laugh" else 3
        d.rounded_rectangle([42, my - 2, 54, my + h], 2, fill=(120, 50, 50), outline=(110, 50, 44))
        d.rectangle([43, my - 1, 53, my], fill=(250, 250, 246))
    elif m == "flat":
        d.line([(44, my), (52, my)], fill=(130, 70, 60))


def props_front(f: Figure, look: Look, arms: list[Arm]):
    p = look.props
    hand = arms[-1].hand
    if "fish" in p:
        f.part(ellipse(16, 60, 74, 76) | poly((72, 68), (84, 58), (82, 78)),
               ramp((150, 170, 150), (196, 212, 190), (96, 116, 100)))
    if "stein" in p:
        x, y = hand[0] + 2, hand[1] - 10
        f.part(rect(x, y, x + 10, y + 18), ramp((236, 176, 48), (252, 214, 96), (190, 128, 28)))
        f.part(rect(x - 1, y - 4, x + 11, y + 1), ramp((250, 248, 236)))
        f.part(capsule((x + 11, y + 4), (x + 13, y + 12), 3), ramp((220, 230, 236)))
    if "can" in p:
        x, y = hand[0] - 2, hand[1] - 12
        f.part(rect(x, y, x + 6, y + 12), ramp((40, 44, 40)))
    if "wine" in p:
        x, y = arms[0].hand
        f.part(ellipse(x - 5, y - 15, x + 5, y - 4), ramp((150, 30, 50), (190, 60, 80), (100, 16, 34)))
        f.part(rect(x, y - 5, x + 1, y - 1), ramp((220, 230, 236)), line=False)
    if "baguette" in p:
        x, y = hand
        f.part(capsule((x - 4, y + 10), (x + 12, y - 28), 6), ramp((222, 160, 76), (246, 206, 132), (172, 108, 46)))
    if "fakemoustache" in p:
        f.part(poly((38, 41), (48, 39), (58, 41), (60, 46), (55, 44), (48, 43), (41, 44), (36, 46)),
               ramp((40, 36, 40)))
    london_props(f, look, arms)


def london_props(f: Figure, look: Look, arms: list[Arm]):
    """The London Ranemon's props, held in the last hand (or both, for the laptop)."""
    p = look.props
    hx, hy = arms[-1].hand
    lx, ly = arms[0].hand
    if "apron" in p:
        f.part(poly((CX - 13, 62), (CX + 13, 62), (CX + 15, 86), (CX - 15, 86)), ramp((60, 52, 46)))
    if "cup" in p:
        f.part(poly((hx - 4, hy - 13), (hx + 4, hy - 13), (hx + 3, hy - 2), (hx - 3, hy - 2)),
               ramp((236, 228, 212)))
        f.part(rect(hx - 5, hy - 15, hx + 5, hy - 13), ramp((70, 60, 54)))
        f.part(rect(hx - 4, hy - 9, hx + 4, hy - 6), ramp((150, 110, 74)), line=False)
    if "tote" in p:
        f.part(capsule((lx - 1, ly - 10), (lx - 1, ly - 2), 2), ramp((214, 200, 170)), line=False)
        f.part(rect(lx - 9, ly - 2, lx + 7, ly + 14), ramp((226, 214, 186)))
    if "card" in p:
        f.part(rect(hx - 4, hy - 10, hx + 4, hy - 4), ramp((60, 120, 200)))
    if "laptop" in p:
        f.part(rect(CX - 16, 60, CX + 16, 70), ramp((176, 180, 190)))
        f.part(rect(CX - 2, 63, CX + 2, 66), ramp((236, 236, 240)), line=False)
    if "flowers" in p:
        f.part(poly((hx - 2, hy), (hx + 2, hy), (hx + 1, hy - 12), (hx - 1, hy - 12)), ramp((80, 150, 70)))
        for i, (dx, dy) in enumerate(((-6, -18), (0, -22), (6, -18), (-3, -13), (4, -13))):
            col = ((232, 70, 100), (250, 200, 60), (240, 120, 180), (250, 250, 240), (200, 80, 200))[i]
            f.part(ellipse(hx + dx - 4, hy + dy - 4, hx + dx + 4, hy + dy + 4), ramp(col))
    if "bagel" in p:
        f.part(ellipse(hx - 7, hy - 14, hx + 7, hy - 2) & ~ellipse(hx - 2, hy - 10, hx + 2, hy - 6),
               ramp((214, 160, 90)))
    if "skateboard" in p:
        f.part(capsule((lx - 3, ly - 22), (lx - 3, ly + 14), 7), ramp((200, 70, 60)))
        f.part(ellipse(lx - 8, ly - 20, lx - 4, ly - 15) | ellipse(lx - 8, ly + 8, lx - 4, ly + 13),
               ramp((240, 236, 220)))
    if "placard" in p:
        f.part(rect(lx - 1, ly - 30, lx + 1, ly + 2), ramp((150, 110, 70)))
        f.part(rect(lx - 14, ly - 46, lx + 14, ly - 28), ramp((246, 240, 224)))
    if "vape" in p:
        f.part(rect(hx - 2, hy - 12, hx + 2, hy - 3), ramp((80, 170, 220)))
    if "phone" in p:
        f.part(rect(hx - 3, hy - 13, hx + 3, hy - 2), ramp((40, 40, 48)))


def overlays_front(im: Image.Image, look: Look, arms: list[Arm]):
    d = draw(im)
    p = look.props
    if "shades_collar" in p:
        d.rectangle([CX - 6, 58, CX - 1, 61], fill=(30, 30, 36))
        d.rectangle([CX + 1, 58, CX + 6, 61], fill=(30, 30, 36))
        d.line([(CX - 1, 59), (CX + 1, 59)], fill=(30, 30, 36))
    if "tricolour" in p:
        x, y = CX + 9, 62
        for i, c in enumerate(((22, 155, 98), (250, 250, 250), (255, 136, 62))):
            d.rectangle([x + i * 2, y, x + i * 2 + 1, y + 2], fill=c)
    if "chefbuttons" in p:
        for y in (60, 67, 74):
            d.point((CX - 6, y), fill=(160, 160, 170))
            d.point((CX + 6, y), fill=(160, 160, 170))
    if "beads" in p:
        for i, y in enumerate(range(56, 74, 3)):
            d.point((CX - 8 + i // 2, y), fill=(232, 110, 40))
            d.point((CX + 8 - i // 2, y), fill=(232, 110, 40))
    if "tattoo" in p:
        x, y = arms[0].hand
        d.point((x + 8, y - 1), fill=(40, 40, 48))
        d.point((x + 9, y), fill=(40, 40, 48))
    if "logo" in p:
        d.line([(CX + 8, 61), (CX + 13, 61)], fill=(220, 60, 60))
    if "baguette" in p:
        x, y = arms[-1].hand
        for i in range(4):
            d.line([(x + i * 4 - 3, y - 4 - i * 8), (x + i * 4 + 3, y - 8 - i * 8)], fill=(156, 98, 40))
    if "monster" in p:
        x, y = arms[-1].hand
        for i in range(3):
            d.line([(x - 1 + i * 2, y - 10), (x - 1 + i * 2, y - 3)], fill=(120, 220, 60))
    if "fish" in p:
        d.point((22, 66), fill=INK)
        d.line([(26, 64), (26, 71)], fill=(96, 116, 100))
    if "lanyard" in p:
        d.line([(CX - 7, 54), (CX - 1, 66)], fill=(200, 40, 60))
        d.line([(CX + 7, 54), (CX + 1, 66)], fill=(200, 40, 60))
        d.rectangle([CX - 3, 66, CX + 3, 71], fill=(246, 246, 246), outline=(120, 120, 130))
    if "placard" in p:
        x, y = arms[0].hand
        for i, row in enumerate((y - 42, y - 37, y - 32)):
            d.line([(x - 10, row), (x + 10 - i * 4, row)], fill=(40, 40, 48))
    for a in arms:
        if a.finger:
            pass


def front(look: Look, outlined: bool = True) -> Image.Image:
    hw = round(18 * look.build)
    f = Figure()
    x = look.extras or (lambda *a: None)
    x(f, look, "behind", "front")
    legs_front(f, look)
    arms = arms_front(look, hw)
    behind = [a for a in arms if look.pose in ("down", "hips") or a.hand[1] > 74 and not a.late]
    for a in behind:
        draw_arm(f, look, a)
    torso_front(f, look, hw)
    for a in arms:
        if a not in behind and not a.late:
            draw_arm(f, look, a)
    x(f, look, "body", "front")
    head_front(f, look)
    x(f, look, "head", "front")
    props_front(f, look, arms)
    for a in arms:
        if a.late:
            draw_arm(f, look, a)
    if "fakemoustache" in look.props:
        props_front(f, Look(props=("fakemoustache",)), arms)
    x(f, look, "front", "front")
    im = f.render()
    face(im, look)
    overlays_front(im, look, arms)
    if look.pose == "chin" and not look.gloves:
        _fist(im, look, arms[0].hand)
    x(im, look, "paint", "front")
    return outline(im) if outlined else im


def back(look: Look, outlined: bool = True) -> Image.Image:
    """From behind and a bit to the left, bigger and cut off at the bottom."""
    f = Figure()
    x = look.extras or (lambda *a: None)
    x(f, look, "behind", "back")
    w = round(6 * (look.build - 1) * 4)
    body = look.outer_paint if look.outer != "none" and look.outer_paint else look.inner
    big = lambda paint: (lambda x, y: paint(x * 8 // 10, y * 8 // 10))  # noqa: E731
    sleeve = big(_sleeve(look))
    raised = look.pose in ("point", "raise")
    f.part(poly((2 - w, 96), (8 - w, 62), (28, 54), (68, 54), (86 + w, 62), (94 + w, 96)), big(body))
    if raised:
        f.part(poly((76, 58), (86, 54), (94, 42), (88, 38), (80, 46), (70, 56)), sleeve)
        f.part(ellipse(84, 32, 94, 42), look.skin)
    else:
        f.part(capsule((12 - w, 66), (8 - w, 96), 12), sleeve)
        f.part(capsule((84 + w, 66), (88 + w, 96), 12), sleeve)
        if look.sleeves == "short" and look.outer == "none":
            f.part(capsule((9 - w, 82), (8 - w, 96), 10), look.skin)
            f.part(capsule((87 + w, 82), (88 + w, 96), 10), look.skin)
    if look.trim:
        f.part(poly((26, 54), (70, 54), (60, 74), (48, 80), (36, 74)), ramp(look.trim))
        f.part(poly((32, 56), (64, 56), (56, 70), (48, 74), (40, 70)), big(body))
    elif look.outer in ("jacket",) or look.neck == "collar":
        f.part(poly((30, 54), (40, 47), (48, 50), (56, 47), (66, 54), (48, 59)),
               ramp(look.neck_colour) if look.neck_colour else big(body))
    elif look.neck == "turtle":
        f.part(rect(36, 44, 60, 58), ramp(look.neck_colour) if look.neck_colour else big(body))
    elif look.neck == "hood":
        f.part(poly((22, 56), (34, 46), (62, 46), (74, 56), (62, 76), (48, 80), (34, 76)),
               ramp(look.neck_colour) if look.neck_colour else big(body))
    if look.scarf:
        f.part(poly((28, 52), (68, 52), (64, 60), (32, 60)), stripes(look.scarf[0], look.scarf[1], 4, 2))
    x(f, look, "body", "back")
    if look.face_hair in ("beard", "bigbeard"):
        f.part(ellipse(28, 36, 70, 62 if look.face_hair == "bigbeard" else 58), _face_hair_ramp(look))
    if look.hair != "long":
        f.part(ellipse(22, 26, 30, 40) | ellipse(68, 26, 76, 40), look.skin)
    f.part(ellipse(26, 8, 72, 56), look.skin)
    hm = hair_back(look)
    if hm is not None:
        f.part(hm, _hair_paint(look), hair=True)
    if look.eyes == "shades" or look.eyes in ("glasses", "round"):
        f.part(rect(22, 28, 28, 29) | rect(70, 28, 76, 29), ramp(look.frame), line=False)
    h, c = look.hat, ramp(look.hat_colour)
    if h == "cap":
        f.part(ellipse(25, 4, 73, 40) & (Y < 26), c)
        f.part(rect(42, 22, 56, 26), ramp(np.array(look.hat_colour) * 0.7))
    elif h == "trilby":
        f.part(ellipse(14, 18, 84, 32), c)
        f.part(poly((28, 22), (32, 4), (49, 1), (66, 4), (70, 22)), c)
        f.part(rect(29, 16, 69, 21), ramp(look.hat_band))
    elif h == "fila":
        f.part(poly((25, 26), (73, 26), (70, 12), (64, 0), (58, 0), (44, 4), (28, 12)), c)
        f.part(rect(25, 22, 73, 26), ramp(np.array(look.hat_colour) * 0.9))
    elif h == "headphones":
        f.part(capsule((24, 28), (49, 6), 4) | capsule((74, 28), (49, 6), 4), c)
        f.part(ellipse(19, 24, 30, 40) | ellipse(68, 24, 79, 40), c)
    elif h == "beanie":
        f.part(ellipse(25, 2, 73, 42) & (Y < 24), c)
        f.part(rect(25, 20, 73, 26), ramp(np.array(look.hat_colour) * 0.85))
    elif h == "helmet":
        f.part(ellipse(23, 0, 75, 40) & (Y < 26), c)
        f.part(rect(36, 4, 39, 16) | rect(48, 2, 51, 16) | rect(60, 4, 63, 16), ramp(look.hat_band), line=False)
    x(f, look, "head", "back")
    x(f, look, "front", "back")
    im = f.render()
    d = draw(im)
    if look.hair == "bald":
        d.ellipse([35, 13, 46, 19], fill=tuple(min(255, v + 18) for v in look.skin[0]))
        d.arc([40, 44, 58, 54], 20, 160, fill=look.skin[2])
    x(im, look, "paint", "back")
    return outline(im) if outlined else im


def mini(im: Image.Image) -> Image.Image:
    """The follower in story mode: the front, shrunk."""
    return sprites.outline(sprites.pixelate(im, 40, 28))
