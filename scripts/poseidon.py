"""Paints Poseidon's battle sprite, since there's no photo of a sea god to cut out.

    python3 scripts/poseidon.py

Writes public/sprites/bw/poseidon.png: drawn at 4x on a 384 canvas, then cut down to 96 pixels
and 32 colours like the photo sprites, outlined, in a sea-blue glow.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sprites import SRC, SIZE, aura, outline, pixelate, sparkle  # noqa: E402

S = 4  # drawing scale
SKIN = (112, 186, 176)
SKIN_DARK = (76, 142, 136)
BEARD = (244, 246, 248)
BEARD_SHADE = (196, 212, 222)
GOLD = (240, 192, 64)
GOLD_DARK = (176, 128, 40)
TOGA = (232, 242, 246)
TOGA_SHADE = (186, 206, 218)
SEA = (42, 138, 208)
SEA_DARK = (24, 86, 150)
FOAM = (220, 240, 250)


def box(d, x0, y0, x1, y1, fill):
    d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill)


def oval(d, x0, y0, x1, y1, fill):
    d.ellipse([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill)


def poly(d, pts, fill):
    d.polygon([(x * S, y * S) for x, y in pts], fill=fill)


def main() -> None:
    im = Image.new("RGBA", (96 * S, 96 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # The trident, behind his right shoulder.
    box(d, 72, 6, 75, 92, GOLD_DARK)
    box(d, 72, 6, 73, 92, GOLD)
    box(d, 64, 14, 83, 17, GOLD)
    for x in (64, 72, 80):
        poly(d, [(x, 14), (x + 3, 14), (x + 1.5, 2)], GOLD)

    # Shoulders and a toga over one of them.
    oval(d, 18, 52, 78, 104, SKIN)
    oval(d, 20, 56, 40, 100, SKIN_DARK)
    poly(d, [(30, 54), (62, 52), (78, 70), (74, 96), (24, 96), (28, 70)], TOGA)
    poly(d, [(30, 54), (44, 54), (34, 96), (24, 96), (28, 70)], TOGA_SHADE)
    box(d, 26, 74, 76, 77, SEA)
    # His near arm, gripping the trident.
    oval(d, 62, 50, 80, 82, SKIN)
    oval(d, 66, 40, 80, 54, SKIN)

    # Head, ears and a great white beard.
    oval(d, 30, 16, 64, 54, SKIN)
    oval(d, 27, 30, 33, 40, SKIN_DARK)
    oval(d, 61, 30, 67, 40, SKIN_DARK)
    poly(d, [(28, 42), (36, 46), (58, 46), (66, 42), (70, 60), (58, 74), (47, 78), (36, 74), (24, 60)], BEARD)
    poly(d, [(36, 56), (40, 72), (33, 66)], BEARD_SHADE)
    poly(d, [(54, 58), (60, 70), (51, 74)], BEARD_SHADE)
    # Hair down past the ears, either side.
    poly(d, [(29, 22), (34, 22), (32, 40), (26, 50), (24, 36)], BEARD)
    poly(d, [(60, 22), (65, 22), (70, 36), (68, 50), (62, 40)], BEARD)
    # Face: brows, eyes, a nose and a moustache.
    box(d, 35, 30, 43, 32, BEARD_SHADE)
    box(d, 51, 30, 59, 32, BEARD_SHADE)
    box(d, 37, 34, 41, 37, (255, 255, 255))
    box(d, 53, 34, 57, 37, (255, 255, 255))
    box(d, 39, 34, 41, 37, SEA_DARK)
    box(d, 55, 34, 57, 37, SEA_DARK)
    poly(d, [(47, 36), (50, 44), (44, 44)], SKIN_DARK)
    poly(d, [(35, 47), (47, 43), (59, 47), (55, 51), (47, 48), (39, 51)], BEARD)

    # The crown.
    box(d, 30, 16, 64, 22, GOLD)
    box(d, 30, 21, 64, 22, GOLD_DARK)
    for x, h in ((30, 6), (37, 9), (44, 13), (51, 9), (58, 6)):
        poly(d, [(x, 17), (x + 6, 17), (x + 3, 17 - h)], GOLD)
    oval(d, 45, 17, 49, 21, SEA)

    # The sea rising round his waist.
    for i, x in enumerate(range(4, 96, 14)):
        oval(d, x - 8, 84 - (i % 2) * 3, x + 10, 104, SEA)
        oval(d, x - 4, 82 - (i % 2) * 3, x + 6, 88, FOAM)
    box(d, 0, 92, 96, 96, SEA_DARK)

    small = pixelate(im, SIZE)
    small = outline(small)
    out = aura(small, SEA)
    out.alpha_composite(small)
    dr = ImageDraw.Draw(out)
    for x, y in ((8, 12), (88, 20), (6, 50), (90, 60)):
        sparkle(dr, x, y, (200, 236, 255))
    out.save(SRC / "bw/poseidon.png")
    print("wrote", SRC / "bw/poseidon.png")


if __name__ == "__main__":
    main()
