"""Each evolution's costume, drawn into the body: wings that grow from the back, tails from behind,
crests and ears on the head, gloves on the hands. Every piece is a shaded part of the figure, so
it gets the same light, inner lines and outline as the rest, and sits in front of or behind the
body as it would on a creature.

`COSTUMES[evo]` is (changes to the base form's look, the extras function the kit calls at each
stage). The stages are behind (before anything), body (after the body and arms, before the head),
head (after the head and hat), front (last) and paint (on the finished image).
"""

import numpy as np
from PIL import ImageDraw

from kit import CX, Figure, capsule, ellipse, poly, ramp, rect

BX = 49  # the middle of the back view


def mirror(pts, view):
    c = CX if view == "front" else BX
    return [(2 * c - x, y) for x, y in pts]


def shrink(pts, k=0.62):
    """The same shape pulled in toward its middle: a wing's membrane inside its frame."""
    a = np.array(pts, float)
    m = a.mean(0)
    return [tuple(p) for p in (m + (a - m) * k).round().astype(int)]


def pair(f: Figure, pts, paint, view, inner=None, k=0.62):
    for side in (pts, mirror(pts, view)):
        f.part(poly(*side), paint)
        if inner:
            f.part(poly(*shrink(side, k)), inner, line=False)


def flame(f: Figure, x, y, s=1.0):
    f.part(poly((x - 6 * s, y + 4 * s), (x - 4 * s, y - 6 * s), (x, y - 14 * s), (x + 3 * s, y - 6 * s),
                (x + 6 * s, y - 10 * s), (x + 7 * s, y + 3 * s), (x, y + 8 * s)),
           ramp((236, 96, 40), (250, 150, 60), (190, 50, 30)))
    f.part(ellipse(x - 3 * s, y - 4 * s, x + 4 * s, y + 6 * s), ramp((252, 214, 72), (255, 246, 170), (232, 160, 40)),
           line=False)


ORANGE = ramp((232, 112, 48))
TEAL = ramp((88, 168, 200))


# --- The evolutions ----------------------------------------------------------------------


def carlizard(f, look, stage, view):
    """Charizard: orange wings with teal webbing from his back, a flaming tail, two horns."""
    if view == "front":
        if stage == "behind":
            pair(f, [(58, 60), (62, 46), (74, 32), (93, 10), (95, 24), (93, 40), (86, 45), (89, 55),
                     (80, 55), (78, 64), (66, 66)], ORANGE, view, TEAL)
            f.part(capsule((58, 84), (78, 86), 7) | capsule((78, 86), (86, 74), 6), ORANGE)
            f.part(poly((30, 12), (26, 0), (36, 8)) | poly((66, 12), (70, 0), (60, 8)),
                   ramp((240, 226, 190)))
        if stage == "front":
            flame(f, 87, 68, 0.9)
    else:
        if stage == "body":
            f.part(capsule((58, 96), (80, 92), 9) | capsule((80, 92), (88, 80), 7), ORANGE)
            pair(f, [(54, 76), (60, 62), (72, 46), (93, 20), (96, 34), (95, 50), (88, 56), (91, 66),
                     (82, 66), (80, 74), (64, 80)], ORANGE, view, TEAL)
            f.part(ellipse(40, 68, 58, 82), ORANGE)
        if stage == "head":
            f.part(poly((30, 16), (26, 3), (38, 12)) | poly((68, 16), (72, 3), (60, 12)),
                   ramp((240, 226, 190)))
        if stage == "front":
            flame(f, 88, 72, 1.0)


def steadakazam(f, look, stage, view):
    """Alakazam: a spoon in each hand, a gold star on his brow and long whiskers."""
    silver = ramp((206, 212, 224))
    if view == "front":
        if stage == "front":
            for s in (-1, 1):
                hx = CX + s * 21
                f.part(capsule((hx, 80), (hx + s * 4, 56), 3), silver)
                f.part(ellipse(hx + s * 4 - 4, 46, hx + s * 4 + 4, 58), silver)
            f.part(poly((44, 12), (48, 5), (52, 12), (48, 15)), ramp((240, 196, 48)))
        if stage == "paint":
            d = ImageDraw.Draw(f)
            hair = ramp(look.hair_colour)[2]
            d.line([(40, 41), (30, 50)], fill=hair)
            d.line([(56, 41), (66, 50)], fill=hair)
    else:
        if stage == "front":
            for s in (-1, 1):
                x = BX + s * 40
                f.part(capsule((x, 96), (x + s * 3, 66), 3), silver)
                f.part(ellipse(x + s * 3 - 5, 54, x + s * 3 + 5, 68), silver)
        if stage == "behind":
            f.part(poly((40, 12), (49, 0), (58, 12)), ramp((240, 196, 48)))


def clefenda(f, look, stage, view):
    """Clefairy: pink pointed ears tipped in brown, a curl on his brow and little wings."""
    pink = ramp((248, 176, 196))
    tip = ramp((120, 84, 70))
    wing = ramp((250, 206, 220))
    if view == "front":
        if stage == "behind":
            pair(f, [(58, 60), (70, 50), (82, 48), (80, 58), (70, 66)], wing, view)
            for s in (-1, 1):
                pts = [(CX + s * 12, 14), (CX + s * 24, -2), (CX + s * 22, 18)]
                f.part(poly(*pts), pink)
                f.part(poly((CX + s * 20, 4), (CX + s * 24, -2), (CX + s * 23, 6)), tip, line=False)
        if stage == "head":
            f.part(ellipse(44, 0, 54, 10) & ~ellipse(47, 3, 53, 9), pink)
    else:
        if stage == "body":
            pair(f, [(56, 70), (72, 58), (88, 56), (86, 68), (72, 78)], wing, view)
        if stage == "head":
            for s in (-1, 1):
                f.part(poly((BX + s * 12, 18), (BX + s * 26, 0), (BX + s * 24, 22)), pink)
                f.part(poly((BX + s * 22, 6), (BX + s * 26, 0), (BX + s * 25, 8)), tip, line=False)


def hitmonois(f, look, stage, view):
    """Hitmonlee's red headband, knotted with its tails flying, and taped fists."""
    red = ramp((224, 52, 52))
    y = 16 if look.hat == "cap" else 12
    if stage == "head":
        if view == "front":
            f.part(rect(26, y, 70, y + 4) & ellipse(25, 2, 71, 50), red)
            f.part(poly((68, y + 1), (84, y - 4), (82, y + 4)) | poly((68, y + 3), (82, y + 10), (76, y + 12)), red)
        else:
            f.part(rect(26, y + 6, 72, y + 10) & ellipse(25, 6, 73, 58), red)
            f.part(ellipse(44, y + 5, 54, y + 12), red)
            f.part(poly((48, y + 10), (40, y + 26), (46, y + 26)) | poly((50, y + 10), (60, y + 24), (54, y + 26)), red)


def hitmonollie(f, look, stage, view):
    """Hitmonchan: red boxing gloves, fists up."""
    if view == "back" and stage == "front":
        for x in (10, 88):
            f.part(ellipse(x - 9, 74, x + 9, 92), ramp((224, 52, 52)))
            f.part(rect(x - 6, 90, x + 6, 96), ramp((246, 246, 244)))


def hugengar(f, look, stage, view):
    """Gengar: a purple spiked hood behind his head and spikes down his back."""
    purple = ramp((112, 72, 168))
    if view == "front":
        if stage == "behind":
            spikes = [(20, 40), (14, 20), (26, 24), (28, 6), (38, 14), (48, -2), (58, 14), (68, 6),
                      (70, 24), (82, 20), (76, 40), (70, 60), (26, 60)]
            f.part(poly(*spikes), purple)
            pair(f, [(62, 60), (78, 52), (90, 56), (78, 66), (66, 70)], purple, view)
    else:
        if stage == "body":
            for y in (64, 76, 88):
                f.part(poly((BX - 9, y + 8), (BX, y - 6), (BX + 9, y + 8)), purple)
        if stage == "behind":
            f.part(poly((26, 24), (18, 4), (34, 12)) | poly((72, 24), (80, 4), (64, 12)), purple)
            for x in (36, 49, 62):
                f.part(poly((x - 6, 14), (x, -1), (x + 6, 14)), purple)


def gyaragibbs(f, look, stage, view):
    """Gyarados: a blue crest on his head, white fins at his cheeks and a fin down his back."""
    blue = ramp((56, 112, 216))
    white = ramp((240, 240, 248))
    if view == "front":
        if stage == "behind":
            f.part(poly((36, 10), (40, -2), (46, 8), (50, -3), (56, 8), (62, -1), (62, 12)), blue)
            pair(f, [(64, 32), (84, 20), (80, 30), (90, 34), (72, 42)], white, view)
            f.part(capsule((60, 86), (84, 84), 8) | poly((80, 76), (94, 70), (92, 92), (82, 90)), blue)
    else:
        if stage == "body":
            f.part(poly((BX - 4, 96), (BX - 4, 60), (BX + 10, 66), (BX + 4, 74), (BX + 12, 80), (BX + 4, 86),
                        (BX + 10, 92), (BX + 4, 96)), blue)
        if stage == "head":
            f.part(poly((38, 14), (42, 0), (48, 10), (52, -1), (58, 10), (64, 2), (62, 16)), blue)
            pair(f, [(70, 36), (90, 24), (86, 34), (94, 40), (74, 46)], white, view)


def jamchamp(f, look, stage, view):
    """Machamp: a second pair of arms, a grey crest and the champion's belt."""
    grey = ramp((168, 176, 192))
    gold = ramp((216, 168, 32), (248, 216, 88), (160, 112, 16))
    if view == "front":
        if stage == "behind":
            f.part(poly((36, 12), (40, 0), (46, 8), (48, -2), (52, 8), (58, 0), (60, 12)), grey)
            for s in (-1, 1):
                sx = CX + s * 18
                f.part(capsule((sx, 66), (sx + s * 14, 70), 8), look.skin)
                f.part(capsule((sx + s * 14, 70), (sx + s * 14, 58), 7), look.skin)
                f.part(ellipse(sx + s * 14 - 5, 52, sx + s * 14 + 5, 61), look.skin)
        if stage == "body":
            f.part(rect(CX - 22, 77, CX + 22, 82), gold)
            f.part(ellipse(CX - 7, 74, CX + 7, 85), ramp((248, 216, 72), (255, 240, 160), (200, 150, 30)))
    else:
        if stage == "body":
            f.part(rect(6, 88, 92, 94), gold)
            for s in (-1, 1):
                x = BX + s * 36
                f.part(capsule((x, 78), (x + s * 10, 64), 9), look.skin)
                f.part(ellipse(x + s * 10 - 6, 54, x + s * 10 + 6, 66), look.skin)
        if stage == "head":
            f.part(poly((38, 14), (42, 0), (48, 8), (50, -2), (54, 8), (60, 0), (62, 16)), grey)


def primeboyd(f, look, stage, view):
    """Primeape: a shaggy cream mane, an angry vein and taped fists."""
    fur = ramp((232, 216, 184))
    if stage == "behind" and view == "front":
        pts = []
        for i in range(13):
            a = np.radians(150 + i * 20)
            r = 30 if i % 2 else 22
            pts.append((CX + r * np.cos(a), 34 + r * np.sin(a) * 1.1))
        f.part(poly(*pts) & (np.mgrid[0:96, 0:96][0] < 62), fur)
        pair(f, [(60, 52), (76, 48), (72, 56), (80, 58), (64, 64)], fur, view)
    if stage == "body" and view == "back":
        pair(f, [(58, 58), (82, 50), (76, 62), (88, 66), (64, 72)], fur, view)
    if stage == "head" and view == "back":
        for x in range(28, 74, 8):
            f.part(poly((x - 5, 20), (x, 4), (x + 5, 20)), fur)
    if stage == "paint" and view == "front":
        d = ImageDraw.Draw(f)
        x, y = 62, 12
        for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3)):
            d.line([(x, y), (x + dx, y + dy)], fill=(232, 40, 40), width=2)


def killigatr(f, look, stage, view):
    """Feraligatr: red spikes over his head and down his back, and a blue scaled tail."""
    red = ramp((224, 56, 56))
    blue = ramp((60, 120, 200))
    if view == "front":
        if stage == "behind":
            for x in (34, 44, 54, 64):
                f.part(poly((x - 6, 12), (x, -2 + abs(x - 49) // 4), (x + 6, 12)), red)
            f.part(capsule((60, 86), (82, 82), 9) | capsule((82, 82), (90, 70), 7), blue)
            for x, y in ((70, 78), (80, 74), (88, 64)):
                f.part(poly((x - 3, y + 2), (x + 2, y - 8), (x + 4, y + 2)), red)
    else:
        if stage == "behind":
            f.part(capsule((62, 94), (88, 84), 11) | capsule((88, 84), (94, 68), 8), blue)
        if stage == "body":
            for y in (62, 74, 86):
                f.part(poly((BX - 7, y + 8), (BX, y - 8), (BX + 7, y + 8)), red)
        if stage == "head":
            for x in (36, 49, 62):
                f.part(poly((x - 6, 14), (x, -1), (x + 6, 14)), red)


def lorchu(f, look, stage, view):
    """Raichu: tall ears with dark tips, a lightning-bolt tail and round cheeks."""
    orange = ramp((236, 152, 40))
    dark = ramp((84, 60, 40))
    bolt_tail = lambda pts: f.part(poly(*pts), orange)  # noqa: E731
    if view == "front":
        if stage == "behind":
            for s in (-1, 1):
                f.part(poly((CX + s * 10, 12), (CX + s * 30, -4), (CX + s * 22, 16)), orange)
                f.part(poly((CX + s * 24, 0), (CX + s * 30, -4), (CX + s * 27, 4)), dark, line=False)
            f.part(capsule((60, 84), (80, 80), 4), dark)
            bolt_tail([(78, 82), (90, 64), (84, 64), (94, 44), (80, 62), (86, 62), (76, 80)])
        if stage == "paint":
            d = ImageDraw.Draw(f)
            for x in (30, 60):
                d.ellipse([x, 34, x + 6, 39], fill=(248, 196, 72))
    else:
        if stage == "behind":
            f.part(capsule((60, 92), (84, 84), 5), dark)
            bolt_tail([(82, 86), (94, 66), (88, 66), (96, 46), (82, 64), (88, 64), (78, 84)])
        if stage == "head":
            for s in (-1, 1):
                f.part(poly((BX + s * 10, 16), (BX + s * 32, -2), (BX + s * 24, 22)), orange)
                f.part(poly((BX + s * 26, 2), (BX + s * 32, -2), (BX + s * 29, 6)), dark, line=False)


def fearowe(f, look, stage, view):
    """Fearow: big brown wings from his back and a red crest."""
    brown = ramp((168, 120, 72))
    pale = ramp((232, 208, 168))
    red = ramp((200, 72, 52))
    feathers = [(58, 62), (64, 48), (78, 34), (94, 24), (92, 34), (95, 40), (88, 46), (92, 52), (82, 56),
                (84, 62), (70, 64)]
    if view == "front":
        if stage == "behind":
            pair(f, feathers, brown, view, pale, 0.55)
            for x in (40, 48, 56):
                f.part(poly((x - 5, 10), (x, -3), (x + 5, 10)), red)
    else:
        if stage == "body":
            pair(f, [(54, 78), (62, 62), (78, 46), (95, 34), (94, 46), (96, 54), (88, 58), (92, 66),
                     (82, 70), (84, 76), (66, 80)], brown, view, pale, 0.55)
        if stage == "head":
            for x in (40, 49, 58):
                f.part(poly((x - 5, 14), (x, -1), (x + 5, 14)), red)


def conix(f, look, stage, view):
    """Onix: a chain of boulders coiling round behind him and a horn on his head."""
    rock = ramp((150, 150, 160), (196, 196, 204), (100, 100, 112))
    if view == "front":
        if stage == "behind":
            for i, (x, y, r) in enumerate(((10, 84, 9), (8, 64, 8), (14, 46, 7), (24, 32, 6), (72, 32, 6),
                                           (82, 46, 7), (88, 64, 8), (86, 84, 9))):
                f.part(ellipse(x - r, y - r, x + r, y + r), rock)
            f.part(poly((44, 8), (48, -4), (52, 8)), rock)
    else:
        if stage == "behind":
            for x, y, r in ((8, 70, 9), (14, 50, 8), (22, 34, 7), (76, 34, 7), (84, 50, 8), (90, 70, 9)):
                f.part(ellipse(x - r, y - r, x + r, y + r), rock)
        if stage == "head":
            f.part(poly((45, 12), (49, -2), (53, 12)), rock)


def robinsey(f, look, stage, view):
    """Chansey: a nurse's cap, pink tufts either side and an egg in his hands."""
    white = ramp((248, 248, 246))
    pink = ramp((248, 184, 204))
    if view == "front":
        if stage == "behind":
            for s in (-1, 1):
                f.part(ellipse(CX + s * 26 - 6, 24, CX + s * 26 + 6, 44), pink)
        if stage == "head":
            f.part(rect(36, 0, 60, 10), white)
        if stage == "front":
            f.part(ellipse(40, 64, 56, 82), ramp((248, 244, 228)))
        if stage == "paint":
            d = ImageDraw.Draw(f)
            d.rectangle([46, 2, 50, 8], fill=(232, 56, 72))
            d.rectangle([44, 4, 52, 6], fill=(232, 56, 72))
    else:
        if stage == "behind":
            for s in (-1, 1):
                f.part(ellipse(BX + s * 28 - 7, 26, BX + s * 28 + 7, 48), pink)
        if stage == "head":
            f.part(rect(36, 4, 62, 14), white)


def weezimo(f, look, stage, view):
    """Weezing: two purple gas-ball heads floating at his shoulders, with smog round about."""
    purple = ramp((150, 110, 190))
    smog = ramp((176, 186, 150), (212, 218, 190), (130, 140, 110))
    balls = ((14, 26, 10), (82, 34, 8)) if view == "front" else ((12, 30, 10), (86, 26, 9))
    if stage == "behind":
        for x, y, r in ((8, 50, 6), (88, 54, 6), (20, 12, 5)):
            f.part(ellipse(x - r, y - r, x + r, y + r), smog)
        for x, y, r in balls:
            f.part(ellipse(x - r, y - r, x + r, y + r), purple)
    if stage == "paint":
        d = ImageDraw.Draw(f)
        for x, y, r in balls:
            d.point((x - 3, y - 2), fill=(40, 40, 48))
            d.point((x + 2, y - 2), fill=(40, 40, 48))
            d.line([(x - 3, y + 3), (x + 2, y + 3)], fill=(40, 40, 48))


def thilotrode(f, look, stage, view):
    """Electrode: a big red and white ball behind him, crackling."""
    red = ramp((232, 64, 56))
    white = ramp((248, 248, 248))
    if stage == "behind":
        box = (2, 6, 94, 98) if view == "front" else (2, 2, 96, 96)
        ball = ellipse(*box)
        f.part(ball & (np.mgrid[0:96, 0:96][0] < 52), red)
        f.part(ball & (np.mgrid[0:96, 0:96][0] >= 52), white)
    if stage == "paint":
        d = ImageDraw.Draw(f)
        for x, y in ((12, 18), (82, 22), (8, 64)):
            d.line([(x, y), (x + 3, y + 5), (x, y + 6), (x + 3, y + 11)], fill=(248, 216, 40), width=2)


def pauliwrath(f, look, stage, view):
    """Poliwrath: blue boxing gloves and the swirl on his belly."""
    if view == "front" and stage == "paint":
        d = ImageDraw.Draw(f)
        x, y = CX, 72
        for r in (8, 5, 2):
            d.arc([x - r, y - r, x + r, y + r], 40, 340, fill=(30, 30, 40), width=1)
    if view == "back" and stage == "front":
        for x in (10, 88):
            f.part(ellipse(x - 9, 74, x + 9, 92), ramp((72, 112, 200)))
            f.part(rect(x - 6, 90, x + 6, 96), ramp((246, 246, 244)))


def skehdinja(f, look, stage, view):
    """Shedinja: a golden halo and paper-thin shell wings from his back."""
    shell = ramp((176, 136, 80), (226, 196, 140), (120, 90, 50))
    pale = ramp((232, 208, 152))
    gold = ramp((248, 216, 96))
    if view == "front":
        if stage == "behind":
            pair(f, [(58, 60), (70, 44), (90, 30), (94, 40), (88, 54), (76, 66)], shell, view, pale, 0.6)
        if stage == "head":
            f.part(ellipse(34, -2, 62, 6) & ~ellipse(38, 0, 58, 4), gold)
    else:
        if stage == "body":
            pair(f, [(56, 74), (68, 56), (90, 40), (96, 50), (90, 64), (76, 78)], shell, view, pale, 0.6)
        if stage == "head":
            f.part(ellipse(34, 0, 64, 8) & ~ellipse(38, 2, 60, 6), gold)


def vinnisaur(f, look, stage, view):
    """Venusaur: a big pink flower on his back, with broad leaves."""
    petal = ramp((240, 120, 152), (252, 172, 196), (196, 80, 110))
    leaf = ramp((72, 168, 88), (120, 204, 120), (40, 120, 60))
    middle = ramp((248, 216, 96))
    if view == "front":
        if stage == "behind":
            pair(f, [(60, 62), (80, 50), (95, 52), (86, 64), (68, 70)], leaf, view)
            for i in range(6):
                a = np.pi * (i / 3 + 1 / 6)
                x, y = CX + np.cos(a) * 30, 30 + np.sin(a) * 16
                f.part(ellipse(x - 11, y - 8, x + 11, y + 8), petal)
    else:
        if stage == "body":
            pair(f, [(56, 76), (78, 62), (96, 64), (88, 78), (68, 84)], leaf, view)
            for i in range(6):
                a = np.pi * (i / 3 + 1 / 6)
                x, y = BX + np.cos(a) * 20, 76 + np.sin(a) * 11
                f.part(ellipse(x - 10, y - 7, x + 10, y + 7), petal)
            f.part(ellipse(BX - 7, 70, BX + 7, 82), middle)


COSTUMES = {
    "carlizard": ({}, carlizard),
    "steadakazam": ({"pose": "down"}, steadakazam),
    "clefenda": ({}, clefenda),
    "hitmonois": ({"gloves": None}, hitmonois),
    "hitmonollie": ({"pose": "guard", "gloves": (224, 52, 52)}, hitmonollie),
    "hugengar": ({"mouth": "grin"}, hugengar),
    "gyaragibbs": ({}, gyaragibbs),
    "jamchamp": ({}, jamchamp),
    "primeboyd": ({"gloves": (240, 236, 224)}, primeboyd),
    "killigatr": ({}, killigatr),
    "lorchu": ({}, lorchu),
    "fearowe": ({}, fearowe),
    "conix": ({}, conix),
    "robinsey": ({"pose": "both"}, robinsey),
    "weezimo": ({}, weezimo),
    "thilotrode": ({}, thilotrode),
    "pauliwrath": ({"pose": "guard", "gloves": (72, 112, 200)}, pauliwrath),
    "skehdinja": ({}, skehdinja),
    "vinnisaur": ({}, vinnisaur),
}
