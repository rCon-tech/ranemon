"""Maps sprites onto the 4-shade Game Boy palette with ordered (Bayer) dithering.

    python3 -m pip install pillow numpy
    python3 scripts/gb_sprite.py public/sprites/*.png --out public/sprites/gb [--size 64]
    python3 scripts/gb_sprite.py public/sprites/*.png --out public/sprites/gb/mini --size 12 --contrast 1.6

The 12-pixel minis are the heads of the Ranemon that follow you in story mode. Each sprite is shrunk to --size pixels (the original handheld's sprites were 56), turned to
lightness, and each pixel is snapped to one of the 4 greens with a 4x4 Bayer matrix, so the
in-between tones come out as the checkerboard dither the hardware used. Transparency is kept.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# Darkest to lightest: the original handheld's LCD greens.
PALETTE = np.array([(15, 56, 15), (48, 98, 48), (139, 172, 15), (155, 188, 15)], np.uint8)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5


def to_gb(im: Image.Image, size: int, contrast: float = 1.25) -> Image.Image:
    im = im.convert("RGBA")
    if size and im.width != size:
        im = im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)
    rgba = np.asarray(im).astype(np.float32) / 255
    light = rgba[..., 0] * 0.299 + rgba[..., 1] * 0.587 + rgba[..., 2] * 0.114
    # A little contrast so faces don't wash out into the middle two shades.
    light = np.clip((light - 0.5) * contrast + 0.5, 0, 1)
    h, w = light.shape
    threshold = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    level = np.clip(np.round(light * 3 + threshold), 0, 3).astype(int)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = PALETTE[level]
    out[..., 3] = np.where(rgba[..., 3] > 0.5, 255, 0)
    return Image.fromarray(out, "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("sprites", nargs="+")
    parser.add_argument("--out", required=True)
    parser.add_argument("--size", type=int, default=64)
    parser.add_argument("--contrast", type=float, default=1.25)
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for path in map(Path, args.sprites):
        to_gb(Image.open(path), args.size, args.contrast).save(out / path.name)
        print(out / path.name)


if __name__ == "__main__":
    main()
