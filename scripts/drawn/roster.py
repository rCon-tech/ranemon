"""Every Ranemon drawn with the body kit, from their photos. Not in the game yet: the sprites go
to art/drawn/, outside public/, for a later update.

    python3 scripts/drawn/roster.py           # every Ranemon
    python3 scripts/drawn/roster.py carlmon   # just one

For each it writes <id>.png (the front), <id>-back.png, shiny/<id>.png, shiny/<id>-back.png and
mini/<id>.png (the follower); then sheet.png, each photo beside its drawings, and overview.png,
every front and back in a grid.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

import kit
from kit import SKIN_RUDDY, Look, plaid, ramp, solid, speckle, stripes

OUT = Path(__file__).resolve().parents[2] / "art" / "drawn"

BROWN = (110, 72, 44)
DARK = (52, 40, 34)
BLACK_HAIR = (36, 32, 34)
GINGER = (176, 100, 52)
AUBURN = (150, 78, 44)
BLOND = (214, 176, 104)
FAIR = (196, 160, 112)
NAVY = (44, 52, 80)
WHITE = (240, 238, 230)

LOOKS: dict[str, Look] = {
    # Big moustache, hand at his chin, navy jacket with a red collar.
    "carlmon": Look(hair="short", hair_colour=BROWN, face_hair="bigmoustache",
                    face_hair_colour=(96, 60, 36), mouth="flat", eyes="lids",
                    inner=solid((44, 40, 48)), outer="jacket", outer_paint=solid((52, 62, 104)),
                    neck="collar", neck_colour=(214, 50, 60), pose="chin"),
    # Auburn hair, a grey tee, shades hooked on the collar, very orderly.
    "steadmon": Look(hair="swept", hair_colour=AUBURN, eyes="open", mouth="smile",
                     inner=solid((140, 144, 150)), sleeves="short", pose="hips",
                     props=("shades_collar",)),
    # Small, scruffy, a huge grin and a glass of red raised.
    "enda": Look(hair="messy", hair_colour=(150, 116, 80), face_hair="stubble", eyes="happy",
                 mouth="grin", inner=solid(WHITE), sleeves="short", pose="raise",
                 props=("wine",), build=0.85),
    # Orange cap, beard, black band tee, a Monster in hand for Olliemon.
    "oismon": Look(hair="short", hair_colour=DARK, face_hair="beard",
                   face_hair_colour=(80, 52, 34), hat="cap", hat_colour=(232, 104, 40),
                   mouth="grin", inner=solid((40, 40, 44)), sleeves="short", pose="hold",
                   props=("can", "monster", "logo"), build=1.05),
    # Black quiff, a dark green shirt with a tricolour pin, big smile.
    "olliemon": Look(hair="quiff", hair_colour=BLACK_HAIR, face_hair="stubble",
                     face_hair_colour=(60, 50, 44), mouth="grin", inner=solid((54, 74, 66)),
                     neck="collar", neck_colour=(54, 74, 66), pose="hips",
                     props=("tricolour",)),
    # A chef's whites and a big black moustache.
    "hugomon": Look(hair="short", hair_colour=(96, 66, 44), face_hair="bigmoustache",
                    face_hair_colour=(30, 26, 26), mouth="flat", eyes="lids",
                    inner=solid((246, 246, 244)), neck="turtle", pose="crossed",
                    props=("chefbuttons",)),
    # Short dark hair, a grey roll-neck and a grin.
    "gibbsmon": Look(hair="short", hair_colour=(70, 52, 40), eyes="happy", mouth="grin",
                     inner=solid((128, 124, 122)), neck="turtle", pose="hips", build=1.05),
    # Holding a fake moustache up to his lip, in a white tee.
    "jammon": Look(hair="swept", hair_colour=AUBURN, eyes="open", mouth="smile",
                   inner=solid(WHITE), sleeves="short", pose="moustache",
                   props=("fakemoustache",)),
    # Fair hair, a navy puffer and a striped scarf.
    "boydemon": Look(hair="short", hair_colour=FAIR, mouth="grin", eyes="happy",
                     inner=solid((40, 40, 48)), outer="jacket", outer_paint=stripes(NAVY, (36, 42, 66), 5, 1),
                     scarf=((200, 50, 50), (40, 48, 84)), pose="down"),
    # Ginger, a ginger beard, a black jumper over a light blue collar.
    "killemon": Look(skin=SKIN_RUDDY, hair="short", hair_colour=(196, 130, 72),
                     face_hair="beard", face_hair_colour=(184, 108, 56), mouth="smile",
                     inner=solid((40, 40, 46)), neck="collar", neck_colour=(176, 200, 230),
                     pose="hips"),
    # Dark hair, round glasses and a patterned grey shirt.
    "lorcamon": Look(hair="short", hair_colour=(44, 38, 36), eyes="round", mouth="smile",
                     face_hair="stubble", face_hair_colour=(70, 60, 54),
                     inner=speckle((120, 122, 124), (180, 182, 184)), neck="collar",
                     neck_colour=(120, 122, 124), pose="down"),
    # Fair hair, a navy zip-up, shades on the collar, laughing.
    "owemon": Look(hair="swept", hair_colour=BLOND, eyes="happy", mouth="laugh",
                   inner=solid((36, 44, 60)), outer="jacket", outer_paint=solid((36, 44, 60)),
                   neck="collar", neck_colour=(36, 44, 60), pose="hips",
                   props=("shades_collar",)),
    # Curls, a light moustache and an open white shirt.
    "conemon": Look(hair="curly", hair_colour=(120, 76, 44), face_hair="tache_stubble",
                    face_hair_colour=(140, 92, 56), mouth="smile",
                    inner=solid((246, 244, 238)), neck="v", pose="hips"),
    # Dark shades and a big brown hoodie.
    "robinmon": Look(hair="short", hair_colour=(86, 62, 44), eyes="shades", mouth="flat",
                     face_hair="stubble", face_hair_colour=(86, 62, 44),
                     inner=solid((108, 90, 78)), neck="hood", neck_colour=(96, 80, 70),
                     pose="down", build=1.1),
    # Dark hair, a beard, a blue check shirt over a grey tee, leaning back.
    "simomon": Look(hair="short", hair_colour=BLACK_HAIR, face_hair="beard",
                    face_hair_colour=(44, 36, 32), mouth="grin",
                    inner=solid((176, 180, 186)), outer="open",
                    outer_paint=plaid((60, 96, 150), (36, 56, 96), (120, 150, 196), (200, 210, 230)),
                    pose="hips"),
    # A blue striped top, and the huge cod.
    "thilomon": Look(hair="short", hair_colour=(70, 54, 42), eyes="open", mouth="grin",
                     inner=stripes((40, 80, 150), (28, 40, 80), 6, 2), pose="both",
                     props=("fish",)),
    # A trilby with a green band, glasses, a ginger beard, a navy blazer.
    "paulimon": Look(hair="short", hair_colour=GINGER, face_hair="beard",
                     face_hair_colour=GINGER, eyes="glasses", frame=(30, 34, 60), mouth="grin",
                     hat="trilby", hat_colour=(56, 58, 66), hat_band=(110, 200, 140),
                     inner=solid((220, 200, 214)), outer="blazer", outer_paint=solid((40, 44, 66)),
                     neck="collar", neck_colour=(220, 200, 214), pose="down"),
    # Long hair, teal mirrored shades, a goatee, black tee, arms folded.
    "skehemon": Look(hair="long", hair_colour=(110, 80, 56), eyes="shades", lens=(40, 150, 160),
                     face_hair="goatee", face_hair_colour=(100, 74, 54), mouth="flat",
                     inner=solid((40, 40, 44)), sleeves="short", pose="crossed",
                     props=("tattoo", "logo")),
    # Tinted glasses, a navy suit, light blue shirt, green tie and a stein of beer.
    "vinnimon": Look(hair="short", hair_colour=(90, 70, 52), eyes="glasses", frame=(150, 120, 90),
                     mouth="smile", inner=solid((150, 190, 232)), outer="blazer",
                     outer_paint=solid((36, 44, 76)), neck="collar", neck_colour=(150, 190, 232),
                     tie=(80, 110, 70), pose="hold", props=("stein",)),
    # Slicked-back blond hair, a huge ginger beard, a black top and a grin.
    "crampemon": Look(hair="slick", hair_colour=(206, 168, 96), face_hair="bigbeard",
                      face_hair_colour=(176, 104, 56), mouth="grin", eyes="happy",
                      inner=solid((34, 34, 38)), pose="hips", build=1.1),
    # A quiff, black wayfarers, a white tee and arms like legs.
    "petchemon": Look(hair="quiff", hair_colour=(86, 62, 46), eyes="shades", mouth="grin",
                      face_hair="stubble", face_hair_colour=(86, 62, 46), inner=solid(WHITE),
                      sleeves="short", pose="hips", build=1.2),
    # The legend: a tall cream hat, a ginger beard, an embroidered robe and orange beads.
    "tobymon": Look(hair="short", hair_colour=GINGER, face_hair="beard", face_hair_colour=GINGER,
                    mouth="smile", hat="fila", hat_colour=(232, 220, 196),
                    inner=speckle((236, 224, 200), (200, 170, 120), 7), neck="crew",
                    pose="down", props=("beads",), long_robe=True, build=1.15),
    # Cholokill: bald, ginger beard, the green flannel over a white tee, pointing at you.
    "cholokill": Look(hair="bald", face_hair="beard", face_hair_colour=(170, 102, 52),
                      eyes="lids", mouth="smirk", inner=solid((228, 224, 214)), outer="open",
                      outer_paint=plaid((66, 102, 88), (40, 54, 68), (132, 162, 144), (204, 200, 176)),
                      neck="none", trousers=(44, 44, 54), pose="point"),
}


def sheet(ids):
    """Each Ranemon's photo beside its drawn front, back and shiny, four times the size."""
    root = Path(__file__).resolve().parents[2] / "public" / "sprites"
    cell, pad = 192, 8
    cols = 4
    rows = len(ids)
    out = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + 24) + pad), (226, 232, 240))
    d = ImageDraw.Draw(out)
    for r, id in enumerate(ids):
        photo = root / "bw" / f"{id}.png"
        if not photo.exists():
            photo = root / f"{id}.png"
        ims = [Image.open(photo).convert("RGBA")]
        ims += [Image.open(OUT / n).convert("RGBA") for n in (f"{id}.png", f"{id}-back.png", f"shiny/{id}.png")]
        for c, im in enumerate(ims):
            im = im.resize((cell, cell), Image.NEAREST)
            out.paste(im, (pad + c * (cell + pad), pad + r * (cell + 24)), im)
        d.text((pad + 2, pad + r * (cell + 24) + cell + 4), id, fill=(30, 30, 40))
    return out


def overview(ids, cols=4):
    """Every Ranemon's front and back in a grid, three times the size."""
    cell, pad, label = 288, 10, 20
    rows = (len(ids) + cols - 1) // cols
    w, h = cols * (2 * cell + pad * 2), rows * (cell + label + pad)
    out = Image.new("RGB", (w, h), (214, 230, 214))
    d = ImageDraw.Draw(out)
    for i, id in enumerate(ids):
        x, y = (i % cols) * (2 * cell + pad * 2) + pad, (i // cols) * (cell + label + pad) + pad
        for j, n in enumerate((f"{id}.png", f"{id}-back.png")):
            im = Image.open(OUT / n).convert("RGBA").resize((cell, cell), Image.NEAREST)
            out.paste(im, (x + j * cell, y), im)
        d.text((x + 4, y + cell + 2), NAMES.get(id, id.capitalize()), fill=(30, 40, 30))
    return out


NAMES = {"enda": "Endamon"}


def main(ids):
    (OUT / "shiny").mkdir(parents=True, exist_ok=True)
    (OUT / "mini").mkdir(parents=True, exist_ok=True)
    for id in ids:
        look = LOOKS[id]
        f, b = kit.front(look), kit.back(look)
        f.save(OUT / f"{id}.png")
        b.save(OUT / f"{id}-back.png")
        kit.sprites.gild(f, True).save(OUT / "shiny" / f"{id}.png")
        kit.sprites.gild(b, True).save(OUT / "shiny" / f"{id}-back.png")
        kit.mini(f).save(OUT / "mini" / f"{id}.png")
    if len(ids) == len(LOOKS):
        sheet(ids).save(OUT / "sheet.png")
        overview(ids).save(OUT / "overview.png")


if __name__ == "__main__":
    main(sys.argv[1:] or list(LOOKS))
