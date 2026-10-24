"""Cholokill, drawn as a pixel-art Ranemon instead of cut from his photo (an experiment).

The photo is only the reference: the head, beard, shirt and pose are drawn here as shapes at
96 pixels, then shaded from the top left, given dark lines where one part sits in front of
another, and a 1-pixel outline, like the handhelds' sprites. It writes the front, the back
(your own Ranemon in battle) and their shiny versions:

    python3 scripts/drawn_cholokill.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import sprites

SIZE = 96
OUT = Path(__file__).resolve().parent.parent / "public" / "sprites"

SKIN = ((250, 214, 178), (236, 178, 140), (196, 128, 100))
BEARD = ((212, 146, 84), (170, 102, 52), (120, 68, 36))
TEE = ((252, 250, 244), (228, 224, 214), (184, 180, 172))
TROUSERS = ((70, 70, 84), (44, 44, 54), (28, 28, 34))
SHOES = ((96, 84, 76), (64, 54, 48), (40, 34, 30))
# The green flannel: a ramp per thread, picked per pixel by the check below.
PLAID = {
    "base": ((96, 136, 118), (66, 102, 88), (44, 70, 62)),
    "dark": ((58, 78, 92), (40, 54, 68), (28, 38, 48)),
    "light": ((168, 196, 176), (132, 162, 144), (96, 122, 108)),
    "cream": ((236, 232, 206), (204, 200, 176), (150, 148, 130)),
}
EYE = (64, 92, 120)
INK = (40, 40, 48)


def plaid(x: int, y: int, size: int = 8) -> str:
    """The check: wide dark bands, a pale stripe beside them and a fine cream thread."""
    u, v = x % size, y % size
    band = range(max(1, size // 6))
    if u in band or v in band:
        return "dark"
    if u == size // 2 or v == size // 2:
        return "cream" if u == v else "light"
    return "base"


class Pen:
    """ImageDraw on a mask, filling every shape it draws."""

    def __init__(self, mask: Image.Image):
        self.d = ImageDraw.Draw(mask)

    def __getattr__(self, name):
        return lambda *a, **k: getattr(self.d, name)(*a, fill=255, **k)


class Figure:
    """Parts drawn back to front. Each has a mask, a colour ramp and whether it gets a line."""

    def __init__(self):
        self.layers: list[tuple[np.ndarray, object, bool]] = []

    def part(self, draw, ramp, line=True):
        m = Image.new("L", (SIZE, SIZE))
        draw(Pen(m))
        self.layers.append((np.array(m) > 0, ramp, line))

    def render(self) -> Image.Image:
        z = np.full((SIZE, SIZE), -1)
        for i, (mask, _, _) in enumerate(self.layers):
            z[mask] = i
        out = np.zeros((SIZE, SIZE, 4), np.uint8)
        for i, (mask, ramp, line) in enumerate(self.layers):
            own = z == i
            if not own.any():
                continue
            # Light from the top left: the band along the bottom-right edge is in shadow and the
            # top-left edge catches the light.
            shadow = own & ~shift(mask, 3, 3)
            half = own & ~shift(mask, 6, 6) & ~shadow
            light = own & ~shift(mask, -3, -3) & ~shadow & ~half
            for y, x in zip(*np.nonzero(own)):
                r = ramp(x, y) if callable(ramp) else ramp
                if half[y, x]:
                    # Between the mid tone and the shadow, dithered like the handhelds' sprites.
                    out[y, x, :3] = r[2] if (x + y) % 2 else r[1]
                else:
                    out[y, x, :3] = r[2 if shadow[y, x] else 0 if light[y, x] else 1]
                out[y, x, 3] = 255
            if line:
                # A dark line where this part sits on top of one behind it.
                behind = np.zeros_like(own)
                for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                    n = np.roll(z, (dy, dx), (0, 1))
                    behind |= own & (n >= 0) & (n < i)
                for y, x in zip(*np.nonzero(behind)):
                    out[y, x, :3] = (out[y, x, :3] * 0.45).astype(np.uint8)
        return Image.fromarray(out, "RGBA")


def shift(mask: np.ndarray, dx: int, dy: int) -> np.ndarray:
    """mask at (x + dx, y + dy), False off the edge."""
    out = np.zeros_like(mask)
    h, w = mask.shape
    ys, yd = (slice(dy, h), slice(0, h - dy)) if dy >= 0 else (slice(0, h + dy), slice(-dy, h))
    xs, xd = (slice(dx, w), slice(0, w - dx)) if dx >= 0 else (slice(0, w + dx), slice(-dx, w))
    out[yd, xd] = mask[ys, xs]
    return out


def flannel(x, y):
    return PLAID[plaid(x, y)]


def flannel_big(x, y):
    return PLAID[plaid(x, y, 10)]


def face(im: Image.Image, eyes, brows, mouth, nose):
    """Eyes, brows, nose and mouth on top, unshaded, like a sprite's details."""
    d = ImageDraw.Draw(im)
    for x, y in eyes:
        d.rectangle([x, y, x + 4, y + 2], fill=(248, 248, 248))
        d.rectangle([x + 1, y, x + 3, y + 2], fill=EYE)
        d.point((x + 2, y + 1), fill=INK)
        d.line([(x, y - 1), (x + 4, y - 1)], fill=INK)  # heavy lids: the half-shut look
    for (x, y), flip in brows:
        d.line([(x, y + (1 if flip else 0)), (x + 5, y + (0 if flip else 1))], fill=BEARD[2], width=2)
    x, y = nose
    d.line([(x, y), (x + 2, y + 2)], fill=SKIN[2])
    d.point((x + 3, y + 2), fill=SKIN[2])
    x, y = mouth
    d.line([(x, y), (x + 6, y - 1)], fill=(120, 60, 50))  # a smirk, up on one side
    d.line([(x + 1, y + 1), (x + 5, y + 1)], fill=(200, 110, 100))


def front() -> Image.Image:
    f = Figure()
    # Legs and shoes behind everything.
    f.part(lambda d: (d.rectangle([37, 78, 46, 90]), d.rectangle([51, 78, 60, 90])), TROUSERS)
    f.part(lambda d: (d.ellipse([33, 87, 47, 94]), d.ellipse([50, 87, 64, 94])), SHOES)
    # His left arm (on the right), hanging, hand on his hip.
    f.part(lambda d: d.polygon([(64, 54), (74, 56), (78, 74), (70, 76)]), flannel)
    f.part(lambda d: d.ellipse([69, 72, 79, 82]), SKIN)
    # The shirt hangs open over the white tee.
    f.part(lambda d: d.polygon([(30, 54), (66, 54), (70, 84), (26, 84)]), flannel)
    f.part(lambda d: d.polygon([(45, 54), (51, 54), (60, 84), (36, 84)]), TEE)
    f.part(lambda d: (d.polygon([(38, 50), (46, 52), (44, 60)]), d.polygon([(58, 50), (50, 52), (52, 60)])), flannel)
    # His right arm (on the left) bent across, pointing at the foe: a rolled sleeve, a fist and
    # one finger out.
    f.part(lambda d: d.polygon([(32, 54), (24, 56), (20, 72), (28, 74)]), flannel)
    f.part(lambda d: d.polygon([(18, 74), (28, 74), (22, 64), (14, 64)]), flannel)
    f.part(lambda d: (d.ellipse([8, 60, 18, 70]), d.rectangle([2, 62, 10, 64])), SKIN)
    # The head: a big bald dome, ears, and the ginger beard over the jaw and chin.
    f.part(lambda d: (d.ellipse([22, 26, 29, 37]), d.ellipse([67, 26, 74, 37])), SKIN)
    f.part(lambda d: d.ellipse([26, 4, 70, 50]), SKIN)
    f.part(
        lambda d: (
            d.polygon([(27, 30), (31, 40), (40, 39), (48, 41), (56, 39), (65, 40), (69, 30),
                       (68, 44), (60, 54), (48, 58), (36, 54), (28, 44)]),
        ),
        BEARD,
    )
    im = f.render()
    d = ImageDraw.Draw(im)
    # Bare skin round the mouth, then the moustache over it.
    d.ellipse([43, 41, 53, 46], fill=SKIN[1])
    d.polygon([(40, 40), (48, 38), (56, 40), (54, 42), (48, 41), (42, 42)], fill=BEARD[1])
    # The shine on his head.
    d.ellipse([34, 9, 43, 14], fill=(255, 240, 222))
    d.point((45, 10), fill=(255, 240, 222))
    face(im, eyes=[(36, 26), (55, 26)], brows=[((35, 22), True), ((55, 22), False)],
         mouth=(44, 44), nose=(47, 32))
    # Buttons down the open shirt edges.
    for y in (62, 70, 78):
        d.point((40, y), fill=(232, 228, 210))
    return sprites.outline(im)


def back() -> Image.Image:
    f = Figure()
    # Seen from behind and a bit to the left, bigger and cut off at the bottom, like the
    # handhelds' back sprites. The flannel's check is drawn bigger as it's closer.
    f.part(lambda d: d.polygon([(2, 96), (8, 62), (28, 54), (68, 54), (86, 62), (94, 96)]), flannel_big)
    # His right arm, raised and pointing at the foe.
    f.part(lambda d: d.polygon([(76, 58), (86, 54), (94, 42), (88, 38), (80, 46), (70, 56)]), flannel_big)
    f.part(lambda d: (d.ellipse([84, 32, 94, 42]),), SKIN)
    f.part(lambda d: d.polygon([(32, 54), (40, 46), (48, 50), (56, 46), (64, 54), (48, 58)]), flannel_big)
    # Beard showing past the jaw, then the back of the head and the ears.
    f.part(lambda d: d.ellipse([26, 34, 72, 60]), BEARD)
    f.part(lambda d: (d.ellipse([22, 26, 30, 40]), d.ellipse([68, 26, 76, 40])), SKIN)
    f.part(lambda d: d.ellipse([26, 8, 72, 56]), SKIN)
    im = f.render()
    d = ImageDraw.Draw(im)
    d.ellipse([35, 13, 46, 19], fill=(255, 240, 222))
    d.point((48, 14), fill=(255, 240, 222))
    # A crease at the nape of the neck.
    d.arc([40, 44, 58, 54], 20, 160, fill=SKIN[2])
    return sprites.outline(im)


def main() -> None:
    for name, im in (("cholokill-drawn", front()), ("cholokill-drawn-back", back())):
        im.save(OUT / "bw" / f"{name}.png")
        sprites.gild(im, True).save(OUT / "shiny" / "bw" / f"{name}.png")
    # The follower in story mode: the front, shrunk.
    mini = sprites.outline(sprites.pixelate(front(), 40, 28))
    mini.save(OUT / "bw" / "mini" / "cholokill-drawn.png")
    sprites.gild(mini, False).save(OUT / "shiny" / "bw" / "mini" / "cholokill-drawn.png")


if __name__ == "__main__":
    main()
