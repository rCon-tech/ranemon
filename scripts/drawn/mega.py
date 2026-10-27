"""The Mega Evolutions, drawn: each drawn evolved form (`evolved.py`) with its Mega's pieces drawn
into the body as the kit draws a costume, so they're shaded and outlined like the rest. Then the
same two-tone glow and Mega symbol as the photo Megas (`scripts/mega.py`). In Britain every
Ranemon is drawn, so these are the Megas you meet at Rowans.

    python3 scripts/drawn/mega.py

Writes public/sprites/drawn/mega/<form>.png and public/sprites/shiny/drawn/mega/<form>.png.
"""

import sys
from dataclasses import replace
from pathlib import Path

import numpy as np
from PIL import ImageDraw

import kit
import roster
from costumes import COSTUMES, flame, mirror, pair
from kit import CX, capsule, ellipse, poly, ramp, rect, sprites

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import mega  # noqa: E402  (megafy: the glow and the symbol)

ROOT = Path(__file__).resolve().parents[2] / "public" / "sprites"
OUT = ROOT / "drawn" / "mega"
SHINY = ROOT / "shiny" / "drawn" / "mega"

CHAR = ramp((52, 52, 68), (84, 84, 104), (30, 30, 40))
BLUE = ramp((56, 136, 236), (120, 196, 255), (32, 80, 176))
SILVER = ramp((206, 212, 224))
GOLD = ramp((240, 196, 48))
CRYSTAL = ramp((150, 206, 236), (226, 246, 255), (92, 150, 196))
BOLT = ramp((248, 216, 40), (255, 246, 160), (210, 160, 20))
FAIRY = ramp((252, 200, 228), (255, 236, 246), (226, 140, 190))


def blue_flame(f, x, y, s=1.0):
    f.part(poly((x - 6 * s, y + 4 * s), (x - 4 * s, y - 6 * s), (x, y - 14 * s), (x + 3 * s, y - 6 * s),
                (x + 6 * s, y - 10 * s), (x + 7 * s, y + 3 * s), (x, y + 8 * s)), BLUE)
    f.part(ellipse(x - 3 * s, y - 4 * s, x + 4 * s, y + 6 * s), ramp((200, 236, 255)), line=False)


def star(f, x, y, r=4, paint=GOLD):
    f.part(poly((x, y - r), (x + r // 3, y - r // 3), (x + r, y), (x + r // 3, y + r // 3), (x, y + r),
                (x - r // 3, y + r // 3), (x - r, y), (x - r // 3, y - r // 3)), paint)


def shard(f, x, y, h, paint=CRYSTAL):
    f.part(poly((x, y - h), (x + 4, y - h // 2), (x + 3, y), (x - 3, y), (x - 4, y - h // 2)), paint)


def bolt(f, x, y, s=1.0):
    f.part(poly((x, y), (x + 7 * s, y - 9 * s), (x + 3 * s, y - 9 * s), (x + 10 * s, y - 20 * s),
                (x + 1 * s, y - 11 * s), (x + 5 * s, y - 11 * s), (x - 4 * s, y)), BOLT)


def carlizard(f, look, stage, view):
    """Mega Charizard X: the wings go black with blue webbing, blue flames and blue-tipped horns."""
    if stage == "behind":
        pair(f, [(58, 60), (62, 44), (76, 28), (95, 4), (96, 22), (94, 40), (86, 45), (90, 56),
                 (80, 56), (78, 66), (66, 66)], CHAR, view, BLUE)
        f.part(capsule((58, 84), (78, 86), 7) | capsule((78, 86), (86, 74), 6), CHAR)
        f.part(poly((30, 12), (24, -2), (36, 8)) | poly((66, 12), (72, -2), (60, 8)), BLUE)
    if stage == "front":
        blue_flame(f, 87, 68, 1.0)
        blue_flame(f, 10, 30, 0.7)
        blue_flame(f, 30, 6, 0.6)


def steadakazam(f, look, stage, view):
    """Mega Alakazam: five spoons floating round him, a red gem on his brow and a long beard."""
    COSTUMES["steadakazam"][1](f, look, stage, view)
    if stage == "behind":
        for x, y in ((8, 40), (14, 18), (CX, -2), (82, 18), (88, 40)):
            f.part(capsule((x, y + 14), (x, y + 6), 2), SILVER)
            f.part(ellipse(x - 3, y, x + 3, y + 8), SILVER)
    if stage == "front":
        f.part(ellipse(45, 6, 51, 12), ramp((232, 48, 72)))


def clefenda(f, look, stage, view):
    """A fairy's Mega: his little wings grow big and bright, with stars over his head."""
    COSTUMES["clefenda"][1](f, look, stage, view)
    if stage == "behind":
        pair(f, [(56, 58), (74, 34), (96, 18), (94, 44), (84, 62), (68, 70)], FAIRY, view,
             ramp((240, 150, 200)))
    if stage == "front":
        for x, y in ((24, 6), (36, -1), (60, -1), (72, 6)):
            star(f, x, y + 4, 4)


def fists(f, look, stage, view, gloves=True):
    if stage == "front":
        for x in (8, 88):
            flame(f, x, 74, 0.9)
        flame(f, 18, 18, 0.7)
        flame(f, 78, 18, 0.7)


def hitmonois(f, look, stage, view):
    """The fighters' Mega: their fists and headband catch fire."""
    COSTUMES["hitmonois"][1](f, look, stage, view)
    fists(f, look, stage, view)


def hitmonollie(f, look, stage, view):
    COSTUMES["hitmonollie"][1](f, look, stage, view)
    fists(f, look, stage, view)


def lorchu(f, look, stage, view):
    """Mega Raichu: longer ears, a bigger bolt of a tail and lightning all round him."""
    COSTUMES["lorchu"][1](f, look, stage, view)
    if stage == "behind":
        f.part(poly((76, 86), (96, 56), (88, 56), (96, 28), (78, 54), (86, 54), (70, 82)),
               ramp((236, 152, 40)))
    if stage == "front":
        for x, y, s in ((4, 34, 0.9), (2, 66, 0.8), (84, 30, 0.8)):
            bolt(f, x, y, s)


def conix(f, look, stage, view):
    """Mega Steelix: crystal shards breaking out of the boulders and a crystal crown."""
    COSTUMES["conix"][1](f, look, stage, view)
    if stage == "behind":
        for x, y, h in ((10, 76, 14), (8, 56, 14), (14, 38, 12), (82, 38, 12), (88, 56, 14), (86, 76, 14)):
            shard(f, x, y, h)
        for x in (38, 58):
            shard(f, x, 10, 12)


def cholokill(f, look, stage, view):
    """Cholokill's Mega: the flannel goes up in flames, and stars burst where he points."""
    if stage == "behind":
        for x, y in ((10, 90), (86, 90), (8, 56), (88, 56)):
            flame(f, x, y, 1.1)
    if stage == "front":
        for x, y in ((14, 14), (82, 12), (8, 36)):
            star(f, x, y, 5)


MEGA = {
    "carlizard": ({}, carlizard),
    "steadakazam": (COSTUMES["steadakazam"][0], steadakazam),
    "clefenda": ({}, clefenda),
    "hitmonois": (COSTUMES["hitmonois"][0], hitmonois),
    "hitmonollie": (COSTUMES["hitmonollie"][0], hitmonollie),
    "lorchu": ({}, lorchu),
    "conix": ({}, conix),
    "cholokill": ({}, cholokill),
}


def draw(form: str):
    base = form if form == "cholokill" else sprites.EVOLUTIONS[form][0]
    kind = sprites.GLOW["cholokill"] if form == "cholokill" else sprites.EVOLUTIONS[form][1]
    changes, extras = MEGA[form]
    figure = kit.front(replace(roster.LOOKS[base], extras=extras, **changes))
    return mega.megafy(figure, kind)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    SHINY.mkdir(parents=True, exist_ok=True)
    for form in MEGA:
        im = draw(form)
        im.save(OUT / f"{form}.png")
        sprites.gild(im, True).save(SHINY / f"{form}.png")
    print(f"Drew {len(MEGA)} Megas: {', '.join(MEGA)}")


if __name__ == "__main__":
    main()
