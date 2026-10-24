"""The London Ranemon, drawn with the body kit (docs/london-ranedex.md). There are no photos of
them, so each is a Look from its description, and each evolution adds its Pokémon family's
pieces (`EXTRAS`), as `costumes.py` does for the lads. Not in the game yet: they go to
art/drawn/london/, with a contact sheet per batch for Rich to approve.

    python3 scripts/drawn/london.py             # every London Ranemon drawn so far
    python3 scripts/drawn/london.py oystermon   # just one

A first stage stands smaller in its 96-pixel box than its evolutions, as the handhelds do.
"""

import sys
from dataclasses import replace
from pathlib import Path

from PIL import Image, ImageDraw

import kit
from costumes import mirror, pair
from kit import (
    CX,
    SIZE,
    SKIN,
    SKIN_BROWN,
    SKIN_DEEP,
    SKIN_OLIVE,
    SKIN_PALE,
    SKIN_RUDDY,
    Look,
    capsule,
    ellipse,
    plaid,
    poly,
    ramp,
    rect,
    solid,
    speckle,
    sprites,
    stripes,
)

OUT = Path(__file__).resolve().parents[2] / "art" / "drawn" / "london"
BX = 49  # the middle of the back view

NAVY = (40, 50, 84)
WHITE = (240, 238, 230)
BLACK = (36, 34, 38)


# --- Pieces the evolutions share ---------------------------------------------------------


def ears(f, view, stage, colour, inner=None, tall=18, wide=10, tip=None):
    """A pair of animal ears on top of the head, drawn after the hair."""
    if stage != "head":
        return
    top = 6 if view == "front" else 10
    c = CX if view == "front" else BX
    left = [(c - 20, top + 8), (c - 20 - wide // 2, top - tall), (c - 8, top + 2)]
    pair(f, left, ramp(colour), view, ramp(inner) if inner else None, 0.5)
    if tip:
        tipl = [(c - 20 - wide // 2, top - tall), (c - 22, top - tall + 7), (c - 16, top - tall + 8)]
        pair(f, tipl, ramp(tip), view)


def wings(f, view, stage, colour, inner=None, span=1.0, low=0):
    """A pair of wings from the back: behind the body in front view, over it from behind."""
    if (view, stage) not in (("front", "behind"), ("back", "body")):
        return
    if view == "front":
        pts = [(58, 62 + low), (66, 48 + low), (80, 34 + low), (int(66 + 28 * span), int(30 + low - 8 * span)),
               (int(68 + 24 * span), 52 + low), (78, 62 + low), (66, 70 + low)]
    else:
        pts = [(56, 74 + low), (64, 60 + low), (78, 46 + low), (int(66 + 30 * span), int(40 + low - 8 * span)),
               (int(70 + 24 * span), 64 + low), (80, 74 + low), (66, 82 + low)]
    pair(f, pts, ramp(colour), view, ramp(inner) if inner else None)


def tail(f, view, stage, colour, tip=None, tip_r=6):
    """A tail curling out to the right, with a ball or tuft at its tip."""
    if view == "front" and stage == "behind":
        f.part(capsule((58, 84), (80, 84), 7) | capsule((80, 84), (86, 70), 6), ramp(colour))
        if tip:
            f.part(ellipse(86 - tip_r, 66 - tip_r, 86 + tip_r, 66 + tip_r), ramp(tip))
    if view == "back" and stage == "body":
        f.part(capsule((56, 92), (80, 90), 9) | capsule((80, 90), (88, 76), 7), ramp(colour))
        if tip:
            f.part(ellipse(88 - tip_r, 72 - tip_r, 88 + tip_r, 72 + tip_r), ramp(tip))


def collar_fluff(f, view, stage, colour):
    """A fluffy ruff round the neck: Eevee's, and the wool of Flaaffy."""
    if stage != "body":
        return
    y = 52 if view == "front" else 50
    c = CX if view == "front" else BX
    m = kit.bumps(c, y, 16, 6, 4, 0, 360, 14)
    f.part(m, ramp(colour))


def gem(im, view, colour, y=14):
    """A jewel on the brow, painted on the finished figure."""
    if view != "front":
        return
    d = ImageDraw.Draw(im)
    d.ellipse([CX - 3, y - 3, CX + 3, y + 3], fill=colour, outline=(40, 40, 48))
    d.point((CX - 1, y - 1), fill=(255, 255, 255))


def extra_head(f, view, stage, look, dx, dy, s=0.7):
    """Another head beside the first, for the Doduo line: same skin and hair, a bit smaller."""
    if stage != "behind":
        return
    c = CX if view == "front" else BX
    x0 = c + dx
    w, h = 44 * s, 46 * s
    f.part(ellipse(x0 - w / 2, 4 + dy, x0 + w / 2, 4 + dy + h), look.skin)
    f.part(ellipse(x0 - w / 2, 2 + dy, x0 + w / 2, 4 + dy + h * 0.55) & (kit.Y < 4 + dy + h * 0.35),
           kit._hair_paint(look))


def extra_face(im, view, dx, dy, s=0.7):
    if view != "front":
        return
    d = ImageDraw.Draw(im)
    x0 = CX + dx
    ey = int(4 + dy + 46 * s * 0.5)
    for ex in (x0 - 7, x0 + 3):
        d.rectangle([ex, ey, ex + 3, ey + 2], fill=(248, 248, 248))
        d.point((ex + 2, ey + 1), fill=(40, 40, 48))
    d.line([(x0 - 4, ey + 9), (x0 + 3, ey + 9)], fill=(120, 60, 50))


def combine(*fns):
    def run(f, look, stage, view):
        for fn in fns:
            fn(f, look, stage, view)

    return run


# --- Batch 1: Central, and Shoreditch & Hackney --------------------------------------------

# Each species: (the Look, the type its glow takes when evolved, or None for a first stage).
LOOKS: dict[str, Look] = {}
STAGE: dict[str, int] = {}  # 1, 2 or 3: how big it stands in the box
TYPE: dict[str, str] = {}
NAME: dict[str, str] = {}


def add(id, name, type_, stage, look):
    LOOKS[id], NAME[id], TYPE[id], STAGE[id] = look, name, type_, stage


def evolve(id, name, type_, stage, frm, extras=None, **changes):
    base = LOOKS[frm]
    add(id, name, type_, stage, replace(base, extras=extras, **changes))


# Commuters: Oystermon > Golpeak > Crowdbat (Zubat > Golbat > Crobat)
add("oystermon", "Oystermon", "graft", 1,
    Look(skin=SKIN_OLIVE, hair="short", hair_colour=(44, 36, 32), eyes="lids", mouth="flat",
         hat="headphones", hat_colour=(30, 30, 36), inner=solid(WHITE), outer="blazer",
         outer_paint=solid(NAVY), neck="collar", tie=(120, 30, 50), pose="hold", props=("card",)))


def golpeak(f, look, stage, view):
    ears(f, view, stage, (96, 104, 200), (200, 120, 200), tall=20, wide=12)
    wings(f, view, stage, (96, 104, 200), (150, 160, 230), span=0.8, low=6)


def crowdbat(f, look, stage, view):
    ears(f, view, stage, (120, 70, 170), (220, 120, 200), tall=18, wide=12)
    wings(f, view, stage, (120, 70, 170), (170, 120, 210), span=1.1, low=-6)
    wings(f, view, stage, (120, 70, 170), (170, 120, 210), span=0.8, low=16)


evolve("golpeak", "Golpeak", "graft", 2, "oystermon", golpeak, mouth="grin")
evolve("crowdbat", "Crowdbat", "graft", 3, "oystermon", crowdbat, mouth="grin", eyes="lids",
       props=("phone",))

# Runners: Speedmon > Jogduo > Meridrio (Doduo > Dodrio)
add("speedmon", "Speedmon", "hype", 1,
    Look(skin=SKIN_BROWN, hair="ponytail", hair_colour=(40, 30, 28), eyes="open", mouth="flat",
         inner=solid((214, 220, 228)), outer="blazer", outer_paint=solid((70, 74, 84)),
         neck="collar", trousers=(70, 74, 84), shoes=(246, 246, 246), pose="hold",
         props=("phone",)))


def jogduo(f, look, stage, view):
    extra_head(f, view, stage, look, -26, 4)
    if stage == "paint":
        extra_face(f, view, -26, 4)


def meridrio(f, look, stage, view):
    extra_head(f, view, stage, look, -28, 8)
    extra_head(f, view, stage, look, 28, 8)
    if stage == "paint":
        extra_face(f, view, -28, 8)
        extra_face(f, view, 28, 8)
        if view == "front":
            d = ImageDraw.Draw(f)
            d.rectangle([CX - 7, 64, CX + 7, 72], fill=(250, 250, 246), outline=(60, 60, 70))
            d.text((CX - 5, 63), "0", fill=(40, 40, 48))


evolve("jogduo", "Jogduo", "hype", 2, "speedmon", jogduo, outer="none",
       inner=solid((60, 170, 200)), sleeves="short", neck="crew", trousers=(40, 40, 50),
       pose="hips", props=(), mouth="grin")
evolve("meridrio", "Meridrio", "hype", 3, "speedmon", meridrio, outer="none",
       inner=solid((220, 70, 60)), sleeves="short", neck="crew", trousers=(40, 40, 50),
       pose="hips", props=(), mouth="grin", eyes="happy")

# Skaters: Skatemon > Skyther > Grindzor (Scyther > Scizor)
add("skatemon", "Skatemon", "hype", 1,
    Look(skin=SKIN_DEEP, hair="short", hair_colour=(30, 26, 26), eyes="lids", mouth="smirk",
         hat="beanie", hat_colour=(220, 120, 40), inner=solid((90, 110, 130)), neck="hood",
         neck_colour=(80, 98, 118), trousers=(60, 66, 80), shoes=(30, 30, 36), pose="down",
         props=("skateboard",), build=1.05))


def blades(f, look, stage, view, colour):
    if view == "front" and stage == "front":
        for side in ([(18, 74), (6, 52), (10, 50), (24, 70)],):
            f.part(poly(*side), ramp(colour))
            f.part(poly(*mirror(side, view)), ramp(colour))


def skyther(f, look, stage, view):
    wings(f, view, stage, (200, 236, 200), (236, 250, 236), span=0.9)
    blades(f, look, stage, view, (210, 220, 200))
    ears(f, view, stage, (110, 180, 90), tall=10, wide=6)


def grindzor(f, look, stage, view):
    wings(f, view, stage, (230, 220, 210), (250, 246, 240), span=0.7, low=4)
    if view == "front" and stage == "front":
        for x in (20, 76):
            f.part(ellipse(x - 9, 66, x + 9, 86) & ~poly((x - 2, 66), (x + 2, 66), (x, 76)),
                   ramp((200, 50, 50)))
    ears(f, view, stage, (200, 50, 50), tall=10, wide=6)


evolve("skyther", "Skyther", "hype", 2, "skatemon", skyther, props=(),
       inner=solid((110, 180, 90)), neck_colour=(90, 150, 74))
evolve("grindzor", "Grindzor", "hype", 3, "skatemon", grindzor, props=(),
       inner=solid((200, 50, 50)), neck_colour=(160, 40, 40), hat_colour=(40, 40, 46))

# Cyclists: Pedalmon > Pedgeotto > Pedgeot (Pidgey > Pidgeotto > Pidgeot)
add("pedalmon", "Pedalmon", "hype", 1,
    Look(skin=SKIN_PALE, hair="short", hair_colour=(150, 100, 60), eyes="open", mouth="smile",
         hat="helmet", hat_colour=(220, 40, 40), hat_band=(250, 250, 250),
         inner=solid((220, 40, 40)), outer="jacket", outer_paint=solid((220, 40, 40)),
         neck="collar", neck_colour=(250, 250, 250), trousers=(50, 50, 60), pose="down"))


def crest(f, view, stage, colours, length=1.0):
    """A feathered plume swept back off the head, for the Pidgey line."""
    if stage != "head":
        return
    c = CX if view == "front" else BX
    for i, col in enumerate(colours):
        y0 = 2 + i * 4
        f.part(poly((c - 4, y0 + 6), (c + 4, y0), (int(c + 30 * length), int(y0 - 10 * length)),
                    (int(c + 20 * length), y0 + 8)), ramp(col))


def pedgeotto(f, look, stage, view):
    wings(f, view, stage, (150, 100, 60), (220, 190, 150), span=0.8, low=8)
    crest(f, view, stage, [(220, 60, 50), (250, 200, 70)], 0.8)


def pedgeot(f, look, stage, view):
    wings(f, view, stage, (150, 100, 60), (220, 190, 150), span=1.15, low=0)
    crest(f, view, stage, [(220, 60, 50), (250, 200, 70), (220, 60, 50)], 1.3)


evolve("pedgeotto", "Pedgeotto", "hype", 2, "pedalmon", pedgeotto, outer="none",
       inner=stripes((40, 60, 120), (250, 200, 70), 8, 2), neck="crew", hat_colour=(40, 40, 50),
       sleeves="short", pose="hips", mouth="grin")
evolve("pedgeot", "Pedgeot", "hype", 3, "pedalmon", pedgeot, outer="none",
       inner=stripes((250, 250, 250), (220, 40, 40), 10, 3), neck="crew", hat="none",
       sleeves="short", pose="hips", mouth="grin", eyes="shades", lens=(220, 120, 40))

# Second-hand: Fleamon > Metadepop > Antiquefree (Caterpie > Metapod > Butterfree)
add("fleamon", "Fleamon", "graft", 1,
    Look(skin=SKIN_PALE, hair="messy", hair_colour=(196, 150, 90), eyes="open", mouth="grin",
         inner=solid((110, 170, 80)), outer="jacket", outer_paint=solid((96, 150, 70)),
         neck="collar", neck_colour=(250, 200, 70), pose="down", props=("tote",), build=0.95))


def metadepop(f, look, stage, view):
    if stage == "front" and view == "front":
        f.part(poly((24, 56), (36, 50), (60, 50), (72, 56), (74, 80), (66, 92), (30, 92), (22, 80)),
               ramp((110, 170, 90)))
        f.part(poly((30, 70), (66, 70), (64, 74), (32, 74)), ramp((90, 140, 70)), line=False)
    if stage == "front" and view == "back":
        f.part(poly((6, 96), (10, 64), (28, 54), (70, 54), (88, 64), (92, 96)), ramp((110, 170, 90)))


def antiquefree(f, look, stage, view):
    wings(f, view, stage, (240, 240, 250), (150, 120, 200), span=1.1, low=-4)
    wings(f, view, stage, (240, 240, 250), (150, 120, 200), span=0.7, low=18)
    if stage == "head":
        c = CX if view == "front" else BX
        top = 6 if view == "front" else 10
        for side in ([(c - 8, top + 2), (c - 16, top - 12), (c - 14, top - 13), (c - 6, top + 2)],):
            f.part(poly(*side) | poly(*mirror(side, view)), ramp((60, 60, 80)))


evolve("metadepop", "Metadepop", "graft", 2, "fleamon", metadepop, props=(), mouth="flat",
       eyes="lids")
evolve("antiquefree", "Antiquefree", "graft", 3, "fleamon", antiquefree, props=(),
       eyes="round", frame=(150, 110, 60), inner=speckle((120, 80, 140), (220, 200, 160)),
       outer="blazer", outer_paint=solid((90, 60, 110)), neck="collar", bowtie=(200, 160, 60))

# Coffee: Oatmon > Flaatwhite > Ampharoast (Mareep > Flaaffy > Ampharos)
add("oatmon", "Oatmon", "chill", 1,
    Look(skin=SKIN_BROWN, hair="bun", hair_colour=(36, 28, 26), eyes="lids", mouth="smile",
         inner=solid(WHITE), sleeves="short", trousers=(60, 60, 70), pose="hold",
         props=("apron", "cup", "tattoo")))


def flaatwhite(f, look, stage, view):
    collar_fluff(f, view, stage, (246, 242, 230))
    if stage == "head":
        c = CX if view == "front" else BX
        top = 0 if view == "front" else 4
        f.part(kit.bumps(c, top + 8, 14, 6, 5, 180, 360, 8), ramp((246, 242, 230)))
    tail(f, view, stage, (240, 150, 180), (90, 140, 230), 5)


def ampharoast(f, look, stage, view):
    tail(f, view, stage, (246, 214, 70), (220, 60, 50), 7)
    if stage == "paint":
        gem(f, view, (220, 60, 50), 12)
        if view == "front":
            d = ImageDraw.Draw(f)
            for x in (66, 72, 78):
                d.line([(x, 82), (x + 2, 86)], fill=(40, 40, 48))


evolve("flaatwhite", "Flaatwhite", "chill", 2, "oatmon", flaatwhite, inner=solid((240, 160, 190)))
evolve("ampharoast", "Ampharoast", "chill", 3, "oatmon", ampharoast,
       inner=solid((246, 214, 70)), eyes="round", frame=(40, 40, 48))

# Tech: Seedmon > Pivotgon > Pivotgon2 (Porygon > Porygon2)
add("seedmon", "Seedmon", "brains", 1,
    Look(skin=SKIN_PALE, hair="swept", hair_colour=(120, 86, 56), eyes="glasses", mouth="grin",
         inner=solid((150, 156, 166)), neck="hood", neck_colour=(130, 136, 146), pose="both",
         props=("laptop", "lanyard"), shoes=(246, 246, 246)))


def blocks(f, look, stage, view, round_=False):
    """Porygon's pink and blue pieces: a beak on the face and a tail block."""
    pink, blue = ramp((240, 110, 140)), ramp((80, 160, 220))
    if view == "front" and stage == "behind":
        shape = ellipse(70, 68, 90, 86) if round_ else poly((68, 70), (90, 64), (88, 86), (70, 84))
        f.part(shape, blue)
    if view == "front" and stage == "front":
        beak = ellipse(40, 32, 56, 44) if round_ else poly((42, 34), (56, 36), (54, 42), (42, 40))
        f.part(beak, blue)
    if view == "back" and stage == "body":
        shape = ellipse(70, 74, 92, 94) if round_ else poly((68, 76), (92, 70), (90, 94), (70, 92))
        f.part(shape, blue)
    if stage == "head":
        c = CX if view == "front" else BX
        top = 4 if view == "front" else 8
        f.part(ellipse(c - 22, top - 6, c - 8, top + 8) if round_ else
               poly((c - 22, top + 4), (c - 14, top - 8), (c - 6, top + 2)), pink)


evolve("pivotgon", "Pivotgon", "brains", 2, "seedmon",
       lambda f, l, s, v: blocks(f, l, s, v), inner=solid((240, 110, 140)), neck="crew",
       props=("lanyard",), pose="hips")
evolve("pivotgon2", "Pivotgon2", "brains", 3, "seedmon",
       lambda f, l, s, v: blocks(f, l, s, v, True), inner=solid((240, 110, 140)),
       outer="blazer", outer_paint=solid((80, 160, 220)), neck="collar", props=(), pose="hips",
       eyes="shades", lens=(80, 160, 220))

# DJs: Decksmon > Electabass (Elekid > Electabuzz)
add("decksmon", "Decksmon", "hype", 1,
    Look(skin=SKIN_DEEP, hair="afro", hair_colour=(30, 26, 26), eyes="happy", mouth="grin",
         hat="headphones", hat_colour=(230, 230, 236), inner=solid(BLACK), sleeves="short",
         pose="raise", props=("logo",)))


def electabass(f, look, stage, view):
    if stage == "head":
        c = CX if view == "front" else BX
        top = 2 if view == "front" else 6
        for side in ([(c - 12, top + 4), (c - 18, top - 14), (c - 14, top - 14), (c - 8, top + 4)],):
            f.part(poly(*side) | poly(*mirror(side, view)), ramp((246, 214, 70)))
    if view == "front" and stage == "behind":
        for y in (56, 72):
            f.part(rect(70, y, 92, y + 15), ramp((50, 50, 58)))
            f.part(ellipse(75, y + 2, 87, y + 13), ramp((110, 110, 120)))


evolve("electabass", "Electabass", "hype", 2, "decksmon", electabass,
       inner=stripes((246, 214, 70), (40, 36, 40), 8, 3), pose="raise", props=())

# Boxers: Jabmon > Ursaringside (Teddiursa > Ursaring)
add("jabmon", "Jabmon", "brawn", 1,
    Look(skin=SKIN_BROWN, hair="short", hair_colour=(30, 24, 22), eyes="lids", mouth="flat",
         inner=solid((150, 150, 156)), sleeves="short", trousers=(30, 30, 36), pose="guard",
         gloves=(200, 40, 40)))


def ursaringside(f, look, stage, view):
    ears(f, view, stage, (130, 86, 50), (210, 170, 120), tall=4, wide=16)
    if stage == "paint" and view == "front":
        d = ImageDraw.Draw(f)
        d.ellipse([CX - 7, 62, CX + 7, 76], outline=(246, 214, 70), width=2)


evolve("ursaringside", "Ursaringside", "brawn", 2, "jabmon", ursaringside,
       inner=solid((130, 86, 50)), face_hair="stubble", face_hair_colour=(30, 24, 22),
       mouth="grin", build=1.15)

# Bagels: Bagelmon > Delibeigel (Delibird)
add("bagelmon", "Bagelmon", "charm", 1,
    Look(skin=SKIN_OLIVE, hair="curly", hair_colour=(50, 36, 30), eyes="happy", mouth="grin",
         inner=solid((40, 40, 50)), outer="jacket", outer_paint=solid((60, 70, 60)),
         neck="collar", neck_colour=(60, 70, 60), pose="hold", props=("bagel",)))


def delibeigel(f, look, stage, view):
    if view == "front" and stage == "behind":
        f.part(ellipse(4, 44, 34, 82), ramp((200, 50, 50)))
        f.part(capsule((18, 46), (34, 56), 5), ramp((170, 40, 40)))
    if view == "back" and stage == "body":
        f.part(ellipse(52, 36, 96, 96), ramp((200, 50, 50)))
    collar_fluff(f, view, stage, (246, 246, 244))


evolve("delibeigel", "Delibeigel", "charm", 2, "bagelmon", delibeigel,
       outer_paint=solid((200, 50, 50)), neck_colour=(246, 246, 244))

# Flowers: Bunchmon > Sunflorist (Sunkern > Sunflora)
add("bunchmon", "Bunchmon", "graft", 1,
    Look(skin=SKIN_RUDDY, hair="short", hair_colour=(140, 100, 70), face_hair="stubble",
         face_hair_colour=(140, 100, 70), eyes="happy", mouth="laugh", hat="cap",
         hat_colour=(40, 70, 50), inner=solid((40, 70, 50)), outer="jacket",
         outer_paint=solid((80, 90, 60)), neck="collar", neck_colour=(140, 110, 70), pose="hold",
         props=("flowers",)))


def sunflorist(f, look, stage, view):
    if stage == "behind":
        c = CX if view == "front" else BX
        cy = 26 if view == "front" else 30
        import math
        for i in range(12):
            a = math.radians(i * 30)
            x, y = c + 30 * math.cos(a), cy + 28 * math.sin(a)
            f.part(ellipse(x - 8, y - 8, x + 8, y + 8), ramp((250, 200, 50)))


evolve("sunflorist", "Sunflorist", "graft", 2, "bunchmon", sunflorist, hat="none",
       inner=solid((80, 150, 70)), outer_paint=solid((80, 150, 70)))

# The flatmate: Wickmon, and its five branches (Eevee and its evolutions)
add("wickmon", "Wickmon", "chaos", 1,
    Look(skin=SKIN, hair="messy", hair_colour=(150, 100, 60), eyes="lids", mouth="smile",
         inner=solid((60, 60, 70)), outer="open", outer_paint=speckle((190, 150, 100), (240, 220, 180)),
         neck="crew", trousers=(70, 70, 90), pose="down"))


def eevee(f, look, stage, view):
    ears(f, view, stage, (170, 110, 60), (90, 60, 40), tall=22, wide=10)
    collar_fluff(f, view, stage, (246, 234, 200))


def vapeoreon(f, look, stage, view):
    ears(f, view, stage, (80, 170, 220), (220, 236, 250), tall=18, wide=14)
    collar_fluff(f, view, stage, (230, 240, 250))
    tail(f, view, stage, (80, 170, 220), (200, 230, 250), 8)


def espresseon(f, look, stage, view):
    ears(f, view, stage, (190, 150, 210), (230, 200, 240), tall=24, wide=10)
    tail(f, view, stage, (190, 150, 210), (190, 150, 210), 5)
    if stage == "paint":
        gem(f, view, (220, 50, 70), 14)


def rumbreon(f, look, stage, view):
    ears(f, view, stage, (40, 40, 50), tip=(250, 210, 60), tall=24, wide=10)
    tail(f, view, stage, (40, 40, 50), (250, 210, 60), 5)


def flatshareon(f, look, stage, view):
    ears(f, view, stage, (230, 110, 50), (250, 200, 140), tall=20, wide=12)
    collar_fluff(f, view, stage, (250, 220, 150))
    tail(f, view, stage, (250, 220, 150), (250, 220, 150), 9)


def joltcoin(f, look, stage, view):
    ears(f, view, stage, (250, 214, 60), (250, 240, 200), tall=24, wide=12)
    if stage == "body":
        c = CX if view == "front" else BX
        y = 50 if view == "front" else 48
        m = poly((c - 18, y), (c - 12, y + 10), (c - 6, y + 2), (c, y + 12), (c + 6, y + 2),
                 (c + 12, y + 10), (c + 18, y), (c, y + 4))
        f.part(m, ramp((246, 246, 240)))


evolve("vapeoreon", "Vapeoreon", "chill", 2, "wickmon", vapeoreon, inner=solid((80, 170, 220)),
       outer="none", pose="hold", props=("vape",), mouth="smirk")
evolve("espresseon", "Espresseon", "hype", 2, "wickmon", espresseon, inner=solid((190, 150, 210)),
       outer="none", pose="hold", props=("cup",), eyes="open", mouth="grin")
evolve("rumbreon", "Rumbreon", "chaos", 2, "wickmon", rumbreon, inner=solid((40, 40, 50)),
       outer="none", neck="hood", neck_colour=(30, 30, 40), eyes="shades", lens=(250, 210, 60),
       mouth="grin")
evolve("flatshareon", "Flatshareon", "graft", 2, "wickmon", flatshareon,
       inner=solid((230, 110, 50)), outer="none", pose="hips", mouth="smirk")
evolve("joltcoin", "Joltcoin", "brains", 2, "wickmon", joltcoin, inner=solid((250, 214, 60)),
       outer="none", pose="hold", props=("phone",), eyes="shades", lens=(250, 214, 60))
LOOKS["wickmon"] = replace(LOOKS["wickmon"], extras=eevee)

# The fossil: Aerodactivist (Aerodactyl), single stage
add("aerodactivist", "Aerodactivist", "brains", 3,
    replace(Look(skin=SKIN_PALE, hair="bob", hair_colour=(200, 200, 206), eyes="round",
                 frame=(60, 60, 70), mouth="laugh", inner=solid((120, 80, 130)), outer="jacket",
                 outer_paint=solid((90, 100, 90)), neck="collar", neck_colour=(220, 200, 140),
                 pose="raise", props=("placard",)),
            extras=lambda f, l, s, v: wings(f, v, s, (150, 150, 170), (190, 170, 200), span=1.2,
                                             low=-2)))

BATCH_1 = list(LOOKS)

# How big each stage stands in its box: a first stage is small, a final form fills it.
SCALE = {1: 0.8, 2: 0.9, 3: 1.0}


def sized(im: Image.Image, stage: int) -> Image.Image:
    k = SCALE[stage]
    if k == 1:
        return im
    w = round(SIZE * k)
    small = sprites.pixelate(im, w, 48)
    out = Image.new("RGBA", (SIZE, SIZE))
    out.alpha_composite(small, ((SIZE - w) // 2, SIZE - w))
    return sprites.outline(out)


def glow(im: Image.Image, kind: str) -> Image.Image:
    out = sprites.aura(im, sprites.TYPE_COLOUR[kind])
    out.alpha_composite(im)
    return out


def draw(id: str) -> tuple[Image.Image, Image.Image]:
    look = LOOKS[id]
    f, b = kit.front(look, outlined=False), kit.back(look, outlined=False)
    f, b = sized(sprites.outline(f), STAGE[id]), sized(sprites.outline(b), STAGE[id])
    if STAGE[id] > 1 and id != "aerodactivist":
        f, b = glow(f, TYPE[id]), glow(b, TYPE[id])
    return f, b


# The lines in batch 1, for the sheet: each line on its own row.
LINES = [
    ["oystermon", "golpeak", "crowdbat"],
    ["speedmon", "jogduo", "meridrio"],
    ["skatemon", "skyther", "grindzor"],
    ["pedalmon", "pedgeotto", "pedgeot"],
    ["fleamon", "metadepop", "antiquefree"],
    ["oatmon", "flaatwhite", "ampharoast"],
    ["seedmon", "pivotgon", "pivotgon2"],
    ["decksmon", "electabass"],
    ["jabmon", "ursaringside"],
    ["bagelmon", "delibeigel"],
    ["bunchmon", "sunflorist"],
    ["wickmon", "vapeoreon", "espresseon", "rumbreon", "flatshareon", "joltcoin"],
    ["aerodactivist"],
]


def sheet(lines, show_back=True) -> Image.Image:
    """Each line on a row, front (and back) of every stage, three times the size, named."""
    cell, pad, label = 192 if not show_back else 144, 10, 16
    per = 2 if show_back else 1
    cols = max(len(l) for l in lines) * per
    w = cols * cell + pad * 2
    out = Image.new("RGB", (w, len(lines) * (cell + label + pad) + pad), (226, 232, 240))
    d = ImageDraw.Draw(out)
    for r, line in enumerate(lines):
        y = pad + r * (cell + label + pad)
        for i, id in enumerate(line):
            names = [f"{id}.png"] + ([f"{id}-back.png"] if show_back else [])
            for j, n in enumerate(names):
                im = Image.open(OUT / n).convert("RGBA").resize((cell, cell), Image.NEAREST)
                x = pad + (i * per + j) * cell
                out.paste(im, (x, y), im)
            d.text((pad + i * per * cell + 4, y + cell + 2), f"{NAME[id]} ({TYPE[id]})",
                   fill=(30, 30, 40))
    return out


def main(ids):
    for sub in ("", "shiny", "mini"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
    for id in ids:
        f, b = draw(id)
        f.save(OUT / f"{id}.png")
        b.save(OUT / f"{id}-back.png")
        sprites.gild(f, True).save(OUT / "shiny" / f"{id}.png")
        sprites.gild(b, True).save(OUT / "shiny" / f"{id}-back.png")
        kit.mini(f).save(OUT / "mini" / f"{id}.png")
    if set(ids) >= set(BATCH_1):
        sheet(LINES).save(OUT / "batch-1.png")
        sheet(LINES, show_back=False).save(OUT / "batch-1-fronts.png")


if __name__ == "__main__":
    main(sys.argv[1:] or list(LOOKS))
