"""An experiment, not in the game: how far the drawn Ranemon's graphics could go, shown on Carlizard.

Four levels, each a renderer for the same body kit, so whichever is picked works for every drawn
Ranemon by swapping `Figure.render` and the outline (the costumes and looks stay as they are):

  0  today: three-tone ramps, a dithered half-shadow, a grey outline;
  1  polish: hue-shifted four-tone ramps (warm lights, cool shadows), clean bands in place of the
     dither, inner lines and outline coloured from the part they sit on (selective outline);
  2  rich: level 1 plus rounded volume shading from each part's shape, shadows cast by the parts
     in front, a rim light in the type colour, specular glints, and Carlizard's costume redrawn
     with more detail (wing bones, a cream belly on the tail, a four-colour flame, ridged horns);
  3  alive: level 2 with an eight-frame idle: wings flap, the head breathes, the flame flickers,
     he blinks and the glow pulses.

    python3 scripts/drawn/upgrade_experiment.py <out dir>
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import costumes  # noqa: E402
import kit  # noqa: E402
import roster  # noqa: E402
from costumes import BX, ORANGE, TEAL, pair, mirror  # noqa: E402
from kit import CX, SIZE, Figure, capsule, ellipse, poly, ramp, shift  # noqa: E402
from dataclasses import replace  # noqa: E402

sprites = kit.sprites
HYPE = sprites.TYPE_COLOUR["hype"]
WARM, COOL, NIGHT = np.array((255, 236, 190.0)), np.array((70, 56, 130.0)), np.array((34, 26, 58.0))


def mix(a, b, t):
    return np.asarray(a, float) * (1 - t) + np.asarray(b, float) * t


def tones(r):
    """A kit ramp (light, mid, dark) as five hue-shifted tones: glint, light, mid, shadow, deep."""
    l, m, d = (np.array(c, float) for c in r)
    glint = mix(l, (255, 250, 230), 0.45)
    light = mix(l, WARM, 0.18)
    # Skin shades warm (into red, not purple), everything else cools into its shadow.
    skin = m[0] > 150 and m[0] > m[1] + 25 and m[1] > m[2] + 10
    shadow = mix(d, (150, 60, 66), 0.18) if skin else mix(d, COOL, 0.22)
    deep = mix(shadow * 0.72, NIGHT, 0.3)
    return [np.clip(c, 0, 255) for c in (glint, light, m, shadow, deep)]


def distance(mask, cap=12):
    """How many pixels in from the edge each pixel of a mask is, up to cap."""
    d = np.zeros(mask.shape, float)
    m = mask.copy()
    for i in range(cap):
        d[m] += 1
        m = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
        if not m.any():
            break
    return d


def moved(a, dx, dy):
    """An array (of any depth) read at (x + dx, y + dy), zero off the edge: no wrapping round."""
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    out[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)] = a[max(0, dy):h - max(0, -dy), max(0, dx):w - max(0, -dx)]
    return out


def blur(a, n=1):
    for _ in range(n):
        a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
    return a


LIGHT = np.array((-0.55, -0.7, 0.75))
LIGHT /= np.linalg.norm(LIGHT)
ORIGINAL = Figure.render
BAYER = np.array([[0, 2], [3, 1]]) / 4 - 0.375


def render(fig: Figure, level: int) -> Image.Image:
    if level == 0:
        return ORIGINAL(fig)
    n = fig.layers[0][0].shape[0]
    k = n // SIZE  # 2 when drawn at double resolution: offsets in 96ths of the figure
    z = np.full((n, n), -1)
    for i, (mask, _, _) in enumerate(fig.layers):
        z[mask] = i
    out = np.zeros((n, n, 4), np.uint8)
    deep = np.zeros((n, n, 3))
    for i, (mask, paint, line) in enumerate(fig.layers):
        own = z == i
        if not own.any():
            continue
        if level == 1:
            shadow = own & ~shift(mask, 3 * k, 3 * k)
            half = own & ~shift(mask, 6 * k, 6 * k) & ~shadow
            light = own & ~shift(mask, -3 * k, -3 * k) & ~shadow & ~half
            step = np.where(shadow, 3, np.where(half, 2.5, np.where(light, 1, 2)))
        else:
            # A dome over the part: its height rises from the edge, its slope faces the light.
            h = blur(np.sqrt(np.minimum(distance(mask, 12 * k), 9 * k) / (9 * k)), k)
            gy, gx = np.gradient(h * 5 * k)
            n = np.stack((-gx, -gy, np.ones_like(h)), -1)
            n /= np.linalg.norm(n, axis=-1, keepdims=True)
            lit = n @ LIGHT
            step = np.select([lit > 0.93, lit > 0.8, lit > 0.6, lit > 0.38], [0.6, 1, 2, 2.5], 3).astype(float)
            # Shadows cast by whatever is in front, down and to the right.
            front = np.zeros_like(mask)
            for m, _, l in fig.layers[i + 1:]:
                if l:
                    front |= m
            cast = own & shift(front, -2 * k, -3 * k) & ~front
            step = np.where(cast, np.maximum(step, 2.5) + 0.5, step)
        for y, x in zip(*np.nonzero(own)):
            t = tones(paint(x // k, y // k))
            s = step[y, x]
            if s == 0.6:  # a glint only on the very top of a dome
                c = t[0] if (x + y) % 3 == 0 else t[1]
            elif s % 1:  # between two tones: a tone of its own, half way, never a dither
                lo, hi = int(s), int(s) + 1
                c = mix(t[lo], t[hi], 0.5)
            else:
                c = t[int(min(s, 4))]
            out[y, x, :3] = np.clip(c, 0, 255)
            out[y, x, 3] = 255
            deep[y, x] = t[4]
        if line:
            behind = np.zeros_like(own)
            for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                nb = np.roll(z, (dy, dx), (0, 1))
                behind |= own & (nb >= 0) & (nb < i)
            out[behind, :3] = deep[behind].astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    im.info["deep"] = deep
    return im


def selout(im: Image.Image, level: int) -> Image.Image:
    """The outline coloured from the pixel it wraps: dark on the shadow side, softer on the lit side."""
    if level == 0:
        return sprites.outline(im)
    a = np.asarray(im).astype(float)
    op = a[..., 3] > 0
    out = a.copy()
    for (dy, dx), lit in (((1, 0), True), ((0, 1), True), ((-1, 0), False), ((0, -1), False)):
        # (dy, dx) is the step from the ring pixel to the body pixel it hugs.
        ring = ~op & moved(op, dx, dy) & (out[..., 3] == 0)
        src = moved(a[..., :3], dx, dy)
        dark = mix(src * 0.32, NIGHT, 0.55)
        c = mix(dark, src, 0.22) if lit and level >= 2 else dark
        out[ring, :3] = c[ring]
        out[ring, 3] = 255
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")


def rim(im: Image.Image, body: np.ndarray, colour, strength=0.4) -> Image.Image:
    """A back light in the type colour on the body pixel just inside the outline, facing right."""
    a = np.asarray(im).astype(float)
    edge = body & ~moved(body, 1, 0) & moved(body, -1, 0)
    a[edge, :3] = mix(a[edge, :3], colour, strength)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


# --- Carlizard's costume, redrawn for level 2 and up -------------------------------------------

def turn(pts, root, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [(round(root[0] + (x - root[0]) * c - (y - root[1]) * s),
             round(root[1] + (x - root[0]) * s + (y - root[1]) * c)) for x, y in pts]


BONE = ramp((214, 92, 40))
CREAM = ramp((246, 214, 140))
HORN = ramp((240, 226, 190))


def wing(f, pts, root, view, flap, bone=2):
    """A wing on each side: an orange frame, teal webbing, and three bones out to its points."""
    pts = turn(pts, root, -flap)
    for side, r in ((pts, root), (mirror(pts, view), mirror([root], view)[0])):
        f.part(poly(*side), ORANGE)
        f.part(poly(*costumes.shrink(side, 0.64)), TEAL, line=False)
        tips = [side[3], side[5], side[8]]
        for t in tips:
            f.part(capsule(r, t, bone), BONE, line=False)


def flame(f, x, y, s, k):
    """Four nested flames, red to white, each frame a slightly different lick."""
    j = [(0, 0), (1, -2), (-1, 1), (0, -1)][k % 4]
    sx = s * (1 + 0.08 * ((k % 3) - 1))
    tip = (x + j[0], y - 15 * s + j[1])
    for scale, col in ((1.0, (206, 56, 36)), (0.78, (242, 112, 40)), (0.55, (252, 196, 64)), (0.28, (255, 246, 196))):
        p = [(x - 7 * sx, y + 4 * s), (x - 5 * sx, y - 5 * s), (x - 1, y - 9 * s),
             (tip[0], tip[1]), (x + 3 * sx, y - 7 * s), (x + 6 * sx, y - 11 * s + j[1]),
             (x + 8 * sx, y + 3 * s), (x, y + 8 * s)]
        cy = y + 2 * s
        p = [(x + (px - x) * scale, cy + (py - cy) * scale) for px, py in p]
        f.part(poly(*p), ramp(col), line=scale == 1.0)


def carlizard2(flap=0, flick=0, bone=2):
    def extras(f, look, stage, view):
        if view == "front":
            if stage == "behind":
                wing(f, [(58, 60), (62, 46), (74, 32), (93, 10), (95, 24), (93, 40), (86, 45), (89, 55),
                         (80, 55), (78, 64), (66, 66)], (58, 60), view, flap, bone)
                tail = capsule((58, 84), (78, 86), 7) | capsule((78, 86), (86, 74), 6)
                f.part(tail, ORANGE)
                f.part(tail & (kit.Y > 86) | capsule((62, 87), (77, 89), 2), CREAM, line=False)
                for hx, tip in ((30, 26), (66, 70)):
                    f.part(poly((hx, 12), (tip, 0), (hx + 6 if hx < CX else hx - 6, 8)), HORN)
                    f.part(poly((hx + (1 if hx < CX else -1), 8), (hx + (4 if hx < CX else -4), 7),
                                (hx + (3 if hx < CX else -3), 9)), ramp((190, 170, 140)), line=False)
            if stage == "front":
                flame(f, 87, 68, 0.95, flick)
        else:
            if stage == "body":
                tail = capsule((58, 96), (80, 92), 9) | capsule((80, 92), (88, 80), 7)
                f.part(tail, ORANGE)
                f.part(capsule((62, 96), (80, 95), 3), CREAM, line=False)
                wing(f, [(54, 76), (60, 62), (72, 46), (93, 20), (96, 34), (95, 50), (88, 56), (91, 66),
                         (82, 66), (80, 74), (64, 80)], (54, 76), view, flap, bone)
                f.part(ellipse(40, 68, 58, 82), ORANGE)
            if stage == "head":
                f.part(poly((30, 16), (26, 3), (38, 12)) | poly((68, 16), (72, 3), (60, 12)), HORN)
            if stage == "front":
                flame(f, 88, 72, 1.05, flick)
    return extras


# --- Drawing each level ------------------------------------------------------------------------

def figure(view, level, flap=0, flick=0, blink=False):
    look = roster.LOOKS["carlmon"]
    extras = costumes.carlizard if level < 2 else carlizard2(flap, flick)
    look = replace(look, extras=extras)
    old = Figure.render
    Figure.render = lambda f: render(f, level)
    try:
        im = (kit.front if view == "front" else kit.back)(look, outlined=False)
    finally:
        Figure.render = old
    if level >= 2 and view == "front":
        d = ImageDraw.Draw(im)
        if blink:
            for x in (36, 55):
                d.rectangle([x, 25, x + 4, 28], fill=look.skin[1])
                d.line([(x, 27), (x + 4, 27)], fill=kit.INK)
        else:
            for x in (36, 55):
                d.point((x + 3, 26), fill=(255, 255, 255))  # a catchlight
    body = np.asarray(im)[..., 3] > 0
    im = selout(im, level)
    if level >= 2:
        im = rim(im, body, HYPE)
    return im


def glow(im, pulse=0):
    if pulse:
        a = sprites.aura(im, HYPE)
        arr = np.asarray(a).copy()
        arr[..., 3] = (arr[..., 3].astype(float) * (1 + 0.12 * pulse)).clip(0, 255).astype(np.uint8)
        out = Image.fromarray(arr, "RGBA")
    else:
        out = sprites.aura(im, HYPE)
    out.alpha_composite(im)
    return out


def breathe(im, b):
    """The top of him one pixel lower on the in-breath: the head and wings settle."""
    if not b:
        return im
    out = im.copy()
    top = im.crop((0, 0, SIZE, 62))
    out.paste((0, 0, 0, 0), (0, 0, SIZE, 62))
    out.alpha_composite(top, (0, b))
    return out


def frames(view):
    flaps = [0, 4, 8, 10, 8, 4, 0, -2]
    out = []
    for k, fl in enumerate(flaps):
        im = figure(view, 3, flap=fl, flick=k, blink=(k == 6 and view == "front"))
        im = breathe(im, 1 if k in (2, 3, 4) else 0)
        out.append(glow(im, [0, 1, 2, 2, 1, 0, -1, -1][k] / 2))
    return out


# --- The comparison sheet ----------------------------------------------------------------------

BG = (226, 232, 240)
GRASS = (168, 208, 128)


def font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


TITLES = ["0  Today", "1  Polish", "2  Rich", "3  Alive (frame 1 of 8)"]
NOTES = ["3 tones, dither, grey outline", "hue-shifted tones, clean bands,\ncoloured outline",
         "rounded shading, cast shadows,\nrim light, detailed costume", "level 2 + wing flap, breath,\nflame flicker, blink"]


def sheet(statics, out_dir):
    big, small, pad = 4, 2, 16
    colw = SIZE * big + pad
    w = pad + 4 * colw
    h = 70 + SIZE * big * 2 + SIZE * small + 120
    s = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(s)
    for c in range(4):
        x = pad + c * colw
        d.text((x, 14), TITLES[c], fill=(30, 30, 40), font=font(22))
        d.multiline_text((x, 40), NOTES[c], fill=(80, 80, 96), font=font(13), spacing=2)
        f, b = statics[c]
        y = 80
        for im in (f, b):
            e = im.resize((SIZE * big, SIZE * big), Image.NEAREST)
            s.paste(e, (x, y), e)
            y += SIZE * big
        # At the game's size, on the battle's grass.
        d.rectangle([x, y + 8, x + SIZE * big - 1, y + 8 + SIZE * small + 16], fill=GRASS)
        g = f.resize((SIZE * small, SIZE * small), Image.NEAREST)
        s.paste(g, (x + 8, y + 16), g)
        g1 = f
        s.paste(g1, (x + SIZE * small + 40, y + 16 + SIZE), g1)
        d.text((x + SIZE * small + 40, y + 16 + SIZE - 18), "1x", fill=(40, 60, 30), font=font(12))
        d.text((x + 12, y + 18), "2x", fill=(40, 60, 30), font=font(12))
    s.save(out_dir / "carlizard-levels.png")


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    statics = []
    for level in range(4):
        if level < 3:
            f, b = glow(figure("front", level)), glow(figure("back", level))
        else:
            f, b = frames("front")[0], frames("back")[0]
        statics.append((f, b))
        f.save(out_dir / f"carlizard-L{level}.png")
        b.save(out_dir / f"carlizard-L{level}-back.png")
    sheet(statics, out_dir)
    for view in ("front", "back"):
        fs = frames(view)
        scale = 4
        big = [Image.new("RGBA", (SIZE * scale, SIZE * scale), BG + (255,)) for _ in fs]
        for bg, fr in zip(big, fs):
            bg.alpha_composite(fr.resize((SIZE * scale,) * 2, Image.NEAREST))
        big[0].save(out_dir / f"carlizard-idle-{view}.gif", save_all=True, append_images=big[1:],
                    duration=110, loop=0, disposal=2)
        strip = Image.new("RGBA", (SIZE * len(fs), SIZE))
        for k, fr in enumerate(fs):
            strip.alpha_composite(fr, (k * SIZE, 0))
        strip.save(out_dir / f"carlizard-idle-{view}-strip.png")
    # Before and after, side by side: today against the recommended level.
    pair_im = Image.new("RGB", (SIZE * 6 * 2 + 48, SIZE * 6 + 48), BG)
    for k, lv in enumerate((0, 2)):
        e = statics[lv][0].resize((SIZE * 6,) * 2, Image.NEAREST)
        pair_im.paste(e, (16 + k * (SIZE * 6 + 16), 32), e)
    ImageDraw.Draw(pair_im).text((16, 8), "Today", fill=(30, 30, 40), font=font(18))
    ImageDraw.Draw(pair_im).text((SIZE * 6 + 32, 8), "Level 2 (rich)", fill=(30, 30, 40), font=font(18))
    pair_im.save(out_dir / "carlizard-before-after.png")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("art/drawn/upgrade"))
