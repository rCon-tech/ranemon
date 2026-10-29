"""An experiment, not in the game: level 4, the drawn Ranemon at double resolution, on Carlizard.

The body kit draws at 96 pixels. Here the same kit, looks and costumes draw at 192 (the size of
the game's HD looks): every shape is drawn twice the size so curves come out smooth, the level 2
shading works on twice the pixels, and the things too small to draw at 96 get drawn: a face with
irises, catchlights, lids, lashes and a shaded nose; strands in the hair and the moustache;
creases in the jacket; veins in the wings; and the tail flame lighting up what's near it.

    python3 scripts/drawn/hd_experiment.py <out dir>
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kit  # noqa: E402
import upgrade_experiment as up  # noqa: E402
from kit import CX, Figure, capsule, ellipse, poly, ramp  # noqa: E402

K = 2
FACE = kit.face
HD = kit.SIZE * K
GRID_Y, GRID_X = np.mgrid[0:HD, 0:HD] / K


class Scaled:
    """An ImageDraw that takes the kit's 96-pixel coordinates and draws them at double size."""

    def __init__(self, im):
        self.d = ImageDraw.Draw(im)

    @staticmethod
    def _pts(xy):
        if len(xy) and isinstance(xy[0], (int, float, np.integer, np.floating)):
            xy = list(zip(xy[::2], xy[1::2]))
        return [(x * K, y * K) for x, y in xy]

    @staticmethod
    def _box(b):
        x0, y0, x1, y1 = b if len(b) == 4 else (*b[0], *b[1])
        return [x0 * K, y0 * K, x1 * K + K - 1, y1 * K + K - 1]

    def rectangle(self, b, **kw):
        self.d.rectangle(self._box(b), **kw)

    def ellipse(self, b, **kw):
        self.d.ellipse(self._box(b), **kw)

    def rounded_rectangle(self, b, r=0, **kw):
        self.d.rounded_rectangle(self._box(b), r * K, **kw)

    def arc(self, b, a0, a1, **kw):
        self.d.arc(self._box(b), a0, a1, width=K, **kw)

    def polygon(self, xy, **kw):
        self.d.polygon([(x + 0.5, y + 0.5) for x, y in self._pts(xy)], **kw)

    def line(self, xy, fill=None, width=1, **kw):
        pts = [(x + 0.5, y + 0.5) for x, y in self._pts(xy)]
        self.d.line(pts, fill=fill, width=width * K, joint="curve")

    def point(self, xy, fill=None):
        for x, y in self._pts(xy if isinstance(xy, list) else [xy]):
            self.d.rectangle([x, y, x + K - 1, y + K - 1], fill=fill)


class ScaledModule:
    Draw = staticmethod(lambda im, *a: Scaled(im) if im.size[0] == HD else ImageDraw.Draw(im, *a))


def hd_mask(fn):
    m = Image.new("L", (HD, HD))
    fn(Scaled(m))
    return np.array(m) > 0


class hd:
    """Inside, the kit draws at 192 pixels."""

    def __enter__(self):
        self.saved = kit.SIZE, kit.Y, kit.X, kit._mask, kit.ImageDraw
        kit.SIZE, kit.Y, kit.X, kit._mask, kit.ImageDraw = HD, GRID_Y, GRID_X, hd_mask, ScaledModule
        return self

    def __exit__(self, *a):
        kit.SIZE, kit.Y, kit.X, kit._mask, kit.ImageDraw = self.saved


# --- The details only double size has room for ---------------------------------------------------

def strands(im, mask, colour, every=3, length=5, seed=1):
    """Fine strands combed down and out: a darker and a lighter hair here and there."""
    rng = np.random.default_rng(seed)
    a = np.asarray(im).copy()
    ys, xs = np.nonzero(mask)
    dark, light = np.array(colour) * 0.62, np.minimum(np.array(colour) * 1.25 + 18, 255)
    for i in rng.choice(len(ys), len(ys) // (every * length), replace=False):
        y, x = ys[i], xs[i]
        lean = np.sign(x - CX * K) * 0.35
        c = light if rng.random() < 0.35 else dark
        for t in range(length):
            yy, xx = y + t, int(round(x + lean * t))
            if 0 <= yy < HD and 0 <= xx < HD and mask[yy, xx]:
                a[yy, xx, :3] = (a[yy, xx, :3] * 0.4 + c * 0.6).astype(np.uint8)
    return Image.fromarray(a, "RGBA")


def face_hd(im, look, blink=False):
    """Carl's face again at 192: heavy lids over blue irises, catchlights, brows, nose and lip."""
    d = ImageDraw.Draw(im)
    skin = [tuple(int(v) for v in c) for c in up.tones(look.skin)]
    ink, brow = (44, 30, 34), tuple(int(v) for v in np.array(kit.ramp(look.hair_colour)[2]) * 0.9)
    for ex in (36 * K, 55 * K):
        cx, cy = ex + 5, 26 * K + 3
        if blink:
            d.arc([ex - 1, cy - 4, ex + 11, cy + 3], 20, 160, fill=ink, width=2)
        else:
            d.ellipse([ex, cy - 4, ex + 10, cy + 4], fill=(246, 244, 240))
            d.ellipse([cx - 3, cy - 3, cx + 3, cy + 4], fill=(70, 110, 150))
            d.ellipse([cx - 2, cy - 2, cx + 2, cy + 3], fill=(48, 78, 112))
            d.rectangle([cx - 1, cy - 1, cx + 1, cy + 1], fill=(20, 22, 30))
            d.point((cx + 1, cy - 2), fill=(255, 255, 255))
            d.point((cx - 2, cy + 2), fill=(150, 190, 220))
            # The heavy lid: skin over the top third of the eye, a dark lash line under it.
            d.chord([ex - 1, cy - 6, ex + 11, cy + 2], 180, 360, fill=skin[3])
            d.chord([ex - 1, cy - 7, ex + 11, cy + 1], 180, 360, fill=skin[2])
            d.line([(ex - 1, cy - 2), (ex + 11, cy - 2)], fill=ink, width=2)
            d.line([(ex + 1, cy + 4), (ex + 9, cy + 4)], fill=skin[3])
        # Brows: thick at the inner end, thinning out.
        inner = ex + (9 if ex < CX * K else 1)
        outer = ex + (0 if ex < CX * K else 10)
        d.line([(inner, 21 * K + 1), (outer, 21 * K - 1)], fill=brow, width=3)
        d.line([(outer, 21 * K - 1), (outer + (-2 if ex < CX * K else 2), 21 * K + 1)], fill=brow, width=2)
    # The nose: a shadow down its right side and under it, a glint on the tip.
    d.line([(50 * K, 29 * K), (51 * K, 33 * K)], fill=skin[3], width=1)
    d.line([(46 * K, 34 * K + 1), (50 * K, 34 * K + 1)], fill=skin[3], width=1)
    d.point((46 * K, 34 * K), fill=skin[3])
    d.point((48 * K - 1, 33 * K - 1), fill=skin[0])
    # The mouth under the moustache: a flat line and a lit lower lip.
    d.line([(44 * K + 1, 47 * K), (52 * K, 47 * K)], fill=(130, 64, 58), width=1)
    d.line([(45 * K, 47 * K + 2), (51 * K, 47 * K + 2)], fill=skin[0], width=1)
    # Cheeks: a touch of colour.
    for cx in (34 * K, 62 * K):
        for y in range(33 * K, 36 * K, 2):
            for x in range(cx - 4, cx + 5, 2):
                d.point((x + (y // 2) % 2, y), fill=(226, 150, 136))


def fist(im, look, hand):
    """The fist at his chin: curled fingers and a thumb, which 96 pixels only had room for as a ball."""
    d = ImageDraw.Draw(im)
    sk = [tuple(int(v) for v in c) for c in up.tones(look.skin)]
    hx, hy = hand[0] * K, hand[1] * K
    for i in range(3):
        y = hy - 2 + i * 3
        d.arc([hx - 7, y - 2, hx + 3, y + 3], 20, 160, fill=sk[3], width=1)
    d.line([(hx + 4, hy + 4), (hx + 6, hy - 4)], fill=sk[3], width=1)
    d.line([(hx + 3, hy + 4), (hx + 5, hy - 4)], fill=sk[1], width=1)
    for x in (hx - 5, hx - 2, hx + 1):
        d.point((x, hy - 4), fill=sk[0])


def creases(im, look):
    """A few folds where the jacket bunches: at the elbow, under the arm and at the hem."""
    jacket = np.asarray(im)
    jacket = (jacket[..., 2].astype(int) > jacket[..., 0].astype(int) + 25) & (jacket[..., 3] > 0)
    over = Image.new("RGBA", im.size)
    d = ImageDraw.Draw(over)
    c = tuple(int(v) for v in up.tones(kit.ramp((52, 62, 104)))[3])
    lc = tuple(int(v) for v in up.tones(kit.ramp((52, 62, 104)))[1])
    for a, b in (((70, 62), (75, 70)), ((72, 64), (78, 71)), ((30, 78), (36, 82)), ((60, 84), (66, 86)),
                 ((34, 86), (40, 87)), ((56, 66), (62, 70))):
        d.line([(a[0] * K, a[1] * K), (b[0] * K, b[1] * K)], fill=c, width=1)
        d.line([(a[0] * K + 1, a[1] * K - 1), (b[0] * K + 1, b[1] * K - 1)], fill=lc, width=1)
    o = np.asarray(over).copy()
    o[~jacket, 3] = 0
    im.alpha_composite(Image.fromarray(o, "RGBA"))


def firelight(im, at, reach=26 * K, strength=0.32):
    """The tail flame lights what's near it, falling off with distance, only on the side facing it."""
    a = np.asarray(im).astype(float)
    yy, xx = np.mgrid[0:HD, 0:HD]
    dist = np.hypot(xx - at[0], yy - at[1])
    w = np.clip(1 - dist / reach, 0, 1) ** 1.6 * strength
    w[a[..., 3] == 0] = 0
    lit = a[..., :3] * (1 - w[..., None]) + np.array((255, 170, 70)) * w[..., None] * 1.0
    a[..., :3] = np.maximum(a[..., :3], lit)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


def aura(im, colour, pulse=0):
    """The type glow at double size: the same three hard bands, twice as far out."""
    a = im.getchannel("A").filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(8))
    v = np.asarray(a).astype(np.float32) / 255
    band = np.select([v > 0.75, v > 0.45, v > 0.2], [200, 130, 70], 0) * (1 + 0.12 * pulse)
    out = np.zeros((*v.shape, 4), np.uint8)
    out[..., :3] = colour
    out[..., 3] = band.clip(0, 255).astype(np.uint8)
    o = Image.fromarray(out, "RGBA")
    o.alpha_composite(im)
    return o


def figure(view, flap=0, flick=0, blink=False):
    from dataclasses import replace
    look = replace(up.roster.LOOKS["carlmon"], extras=up.carlizard2(flap, flick, bone=1))
    with hd():
        Figure.render = lambda f: up.render(f, 2)
        kit.face = lambda im, look: None  # the face is drawn at full size below
        try:
            im = (kit.front if view == "front" else kit.back)(look, outlined=False)
        finally:
            Figure.render = up.ORIGINAL
            kit.face = FACE
    alpha = np.asarray(im)[..., 3] > 0
    if view == "front":
        hair = np.asarray(im)[..., :3]
        hair_mask = alpha.copy()
        hair_mask[:] = False
        with hd():
            hm = kit.hair_front(look)
            fm = kit.face_hair_mask(look.face_hair)
        im = strands(im, hm & alpha, look.hair_colour)
        im = strands(im, fm & alpha, look.face_hair_colour, every=2, length=4, seed=2)
        face_hd(im, look, blink)
        creases(im, look)
        fist(im, look, kit.arms_front(look, 18)[0].hand)
        im = firelight(im, (87 * K, 64 * K))
    else:
        with hd():
            hm = kit.hair_back(look)
        im = strands(im, hm & alpha, look.hair_colour, every=5, length=6, seed=3)
        im = firelight(im, (88 * K, 68 * K))
    body = np.asarray(im)[..., 3] > 0
    im = up.selout(im, 2)
    im = up.rim(im, body, up.HYPE)
    im = up.selout(im, 1)  # a second ring, so he reads as boldly as today in battle
    return im


def breathe(im, b):
    if not b:
        return im
    out = im.copy()
    top = im.crop((0, 0, HD, 62 * K))
    out.paste((0, 0, 0, 0), (0, 0, HD, 62 * K))
    out.alpha_composite(top, (0, b))
    return out


def frames(view):
    flaps = [0, 4, 8, 10, 8, 4, 0, -2]
    pulses = [0, 1, 2, 2, 1, 0, -1, -1]
    out = []
    for k, fl in enumerate(flaps):
        im = figure(view, fl, k, blink=(k == 6 and view == "front"))
        im = breathe(im, 2 if k in (2, 3, 4) else 1 if k in (1, 5) else 0)
        out.append(aura(im, up.HYPE, pulses[k] / 2))
    return out


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    f, b = aura(figure("front"), up.HYPE), aura(figure("back"), up.HYPE)
    f.save(out_dir / "carlizard-L4.png")
    b.save(out_dir / "carlizard-L4-back.png")
    # Today, level 2 and level 4, front and back, at the same size on screen.
    today = [up.glow(up.figure(v, 0)) for v in ("front", "back")]
    rich = [up.glow(up.figure(v, 2)) for v in ("front", "back")]
    cols = [("Today", today, 96), ("Level 2: rich", rich, 96), ("Level 4: HD", [f, b], 192)]
    cell, pad = 384, 16
    s = Image.new("RGB", (pad + 3 * (cell + pad), 48 + 2 * cell + pad + 230), up.BG)
    d = ImageDraw.Draw(s)
    for c, (title, ims, size) in enumerate(cols):
        x = pad + c * (cell + pad)
        d.text((x, 14), title, fill=(30, 30, 40), font=up.font(22))
        for r, im in enumerate(ims):
            e = im.resize((cell, cell), Image.NEAREST)
            s.paste(e, (x, 48 + r * cell), e)
        y = 48 + 2 * cell + pad
        d.rectangle([x, y, x + cell - 1, y + 210], fill=up.GRASS)
        g = ims[0].resize((192, 192), Image.NEAREST if size == 96 else Image.NEAREST)
        s.paste(g, (x + (cell - 192) // 2, y + 10), g)
        d.text((x + 8, y + 6), "in battle", fill=(40, 60, 30), font=up.font(12))
    s.save(out_dir / "carlizard-hd-compare.png")
    # A close-up of the face and wing at the same zoom, today against HD.
    crop96, crop192 = (24, 4, 72, 52), (48, 8, 144, 104)
    z = Image.new("RGB", (2 * 480 + 3 * pad, 480 + 2 * pad + 30), up.BG)
    a = today[0].crop(crop96).resize((480, 480), Image.NEAREST)
    bb = f.crop(crop192).resize((480, 480), Image.NEAREST)
    z.paste(a, (pad, 30 + pad), a)
    z.paste(bb, (2 * pad + 480, 30 + pad), bb)
    ImageDraw.Draw(z).text((pad, 10), "Today, close up", fill=(30, 30, 40), font=up.font(18))
    ImageDraw.Draw(z).text((2 * pad + 480, 10), "Level 4, close up", fill=(30, 30, 40), font=up.font(18))
    z.save(out_dir / "carlizard-hd-face.png")
    for view in ("front", "back"):
        fs = frames(view)
        big = [Image.new("RGBA", (HD * 2,) * 2, up.BG + (255,)) for _ in fs]
        for bg, fr in zip(big, fs):
            bg.alpha_composite(fr.resize((HD * 2,) * 2, Image.NEAREST))
        big[0].save(out_dir / f"carlizard-hd-idle-{view}.gif", save_all=True, append_images=big[1:],
                    duration=110, loop=0, disposal=2)


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("art/drawn/upgrade"))
