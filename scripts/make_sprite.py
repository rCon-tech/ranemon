"""Turns a friend's photo into a 128x128 pixel sprite for public/sprites/.

    python3 -m pip install rembg onnxruntime opencv-python-headless pillow
    python3 scripts/make_sprite.py photo.jpg public/sprites/name.png [--crop-left 0.47] [--width 0.62]

Cuts the person out, keeps only the biggest figure (so people in the background drop out),
crops head and shoulders, flattens to 20 colours and adds a thick ink outline.
--crop-left hides a fraction of the photo's left side, for a friend standing too close.
--width narrows the crop for full-body shots.
"""

import argparse

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

SIZE = 128
INK = (29, 36, 51)
COLOURS = 20


def cut_out(path: str) -> np.ndarray:
    im = Image.open(path).convert("RGB")
    im.thumbnail((900, 900))
    return np.array(remove(im, session=new_session("u2net_human_seg")).convert("RGBA"))


def head_and_shoulders(im: np.ndarray, crop_left: float, width: float) -> np.ndarray:
    mask = (im[:, :, 3] > 128).astype(np.uint8)
    if crop_left:
        mask[:, : int(mask.shape[1] * crop_left)] = 0
    _, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    mask = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    side = min(int((x1 - x0) * width), y1 - y0)
    if width == 1.0 and (y1 - y0) > (x1 - x0) * 1.6:
        side = max(side, int((y1 - y0) * 0.55))
    # Centre on the head: the columns of the top fifth of the figure.
    top = np.nonzero(mask[y0 : y0 + max(1, side // 5)].any(axis=0))[0]
    cx = int((top.min() + top.max()) / 2) if len(top) else (x0 + x1) // 2
    pad = int(side * 0.06)
    left, top_y, s = cx - side // 2 - pad, y0 - pad, side + 2 * pad
    canvas = np.zeros((s, s, 4), np.uint8)
    h, w = mask.shape
    sx0, sy0, sx1, sy1 = max(0, left), max(0, top_y), min(w, left + s), min(h, top_y + s)
    canvas[sy0 - top_y : sy1 - top_y, sx0 - left : sx1 - left, :3] = im[sy0:sy1, sx0:sx1, :3]
    canvas[sy0 - top_y : sy1 - top_y, sx0 - left : sx1 - left, 3] = mask[sy0:sy1, sx0:sx1] * 255
    return cv2.resize(canvas, (SIZE - 12, SIZE - 12), interpolation=cv2.INTER_AREA)


def pixelate(small: np.ndarray) -> np.ndarray:
    rgb = cv2.bilateralFilter(small[:, :, :3], 5, 40, 40)
    alpha = (small[:, :, 3] > 110).astype(np.uint8)
    on = alpha.reshape(-1) > 0
    pix = rgb.reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pix[on], COLOURS, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    q = rgb.reshape(-1, 3).copy()
    q[on] = centers[labels.flatten()].astype(np.uint8)
    q = q.reshape(rgb.shape)

    out = np.zeros((SIZE, SIZE, 4), np.uint8)
    m = np.zeros((SIZE, SIZE), np.uint8)
    m[6:-6, 6:-6] = alpha
    ring = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    ring[-6:, :] = m[-6:, :]  # the bottom edge is a crop, not an outline
    out[ring > 0] = (*INK, 255)
    inner = np.zeros((SIZE, SIZE, 3), np.uint8)
    inner[6:-6, 6:-6] = q
    out[m > 0, :3] = inner[m > 0]
    out[m > 0, 3] = 255
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("photo")
    parser.add_argument("out")
    parser.add_argument("--crop-left", type=float, default=0.0)
    parser.add_argument("--width", type=float, default=1.0)
    args = parser.parse_args()
    sprite = pixelate(head_and_shoulders(cut_out(args.photo), args.crop_left, args.width))
    Image.fromarray(sprite).save(args.out, optimize=True)
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
