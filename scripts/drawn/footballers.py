"""The Premier League legends' own Ranemon (`src/lib/battle/footballers.ts`), drawn with the body
kit: each legend in his club's kit, with a ball at his feet. 2D only, like every Ranemon.

    python3 scripts/drawn/footballers.py              # all twelve, and the contact sheet
    python3 scripts/drawn/footballers.py keanemon     # just one (the sheet is still remade)

The game loads the fronts from public/sprites/premier/ (a back view is the front mirrored), each
with its mini and its shiny; the contact sheet goes to art/drawn/premier/sheet.png.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

import kit
from kit import (
    CX,
    SKIN,
    SKIN_BROWN,
    SKIN_DEEP,
    SKIN_OLIVE,
    SKIN_PALE,
    SKIN_RUDDY,
    Look,
    ellipse,
    ramp,
    rect,
    solid,
    sprites,
)
from london import BX, glow

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public" / "sprites"
OUT = ROOT / "art" / "drawn" / "premier"

WHITE = (244, 244, 240)
BLACK = (28, 28, 32)


def kit_shirt(body, sleeves=None, stripe=None, width=4, period=9):
    """A football shirt: its colour, vertical stripes of another, and sleeves of their own."""
    rb, rs = ramp(body), ramp(stripe) if stripe else None
    rl = ramp(sleeves) if sleeves else None

    def paint(x, y):
        # The body is about 18 pixels either side of the middle; past that is sleeve.
        if rl and abs(x - CX) > 17:
            return rl
        if rs and (x - CX + 200) % period < width:
            return rs
        return rb

    return paint


def ball(f, look, stage, view):
    """A football at his feet, in front of him."""
    if stage != "front":
        return
    c = (CX if view == "front" else BX) + 26
    f.part(ellipse(c - 7, 81, c + 7, 95), ramp(WHITE))
    f.part(ellipse(c - 3, 85, c + 2, 90), ramp(BLACK), line=False)


def bucket(f, look, stage, view):
    """Bielsa's bucket, upturned beside him."""
    if stage != "front":
        return
    c = (CX if view == "front" else BX) - 28
    f.part(rect(c - 8, 80, c + 8, 94), ramp((236, 236, 240)))
    f.part(rect(c - 9, 79, c + 9, 81), ramp((60, 90, 170)))


def armband(f, look, stage, view):
    """The captain's armband, on the left arm."""
    ball(f, look, stage, view)
    if stage == "front" and view == "front":
        # Round the sleeve, just below the shoulder.
        x = CX - round(18 * look.build)
        f.part(rect(x - 8, 59, x - 1, 62), ramp((250, 210, 40)))


def number(digits, colour=WHITE):
    """A squad number on the chest, painted on the finished figure."""

    def paint(f, look, stage, view):
        ball(f, look, stage, view)
        if stage == "paint" and view == "front":
            d = ImageDraw.Draw(f)
            d.text((CX - 3 * len(digits) - 1, 62), digits, fill=colour)

    return paint


LOOKS = {
    # Glenn Murray: Brighton blue and white stripes.
    "murraymon": Look(skin=SKIN, hair="short", hair_colour=(138, 106, 64), eyes="open", mouth="smile",
                      inner=kit_shirt(WHITE, stripe=(0, 87, 184)), neck="crew", sleeves="short",
                      trousers=(0, 87, 184), shoes=BLACK, pose="hips", extras=ball),
    # Ian Wright: Palace red and blue stripes, bald, and laughing.
    "wrightymon": Look(skin=SKIN_DEEP, hair="bald", hair_colour=(26, 26, 26), eyes="happy",
                       mouth="laugh", inner=kit_shirt((200, 16, 46), stripe=(27, 69, 143)),
                       neck="crew", sleeves="short", trousers=(27, 69, 143), shoes=WHITE,
                       pose="point", extras=ball),
    # Paul McGrath: Villa claret with sky-blue sleeves, and not a bother on him.
    "mcgrathmon": Look(skin=SKIN_BROWN, hair="short", hair_colour=(26, 26, 26), eyes="lids",
                       mouth="smile", inner=kit_shirt((103, 14, 54), sleeves=(149, 191, 229)),
                       neck="collar", neck_colour=(149, 191, 229), trousers=WHITE, shoes=BLACK,
                       pose="crossed", extras=ball),
    # Duncan Ferguson: Everton blue, enormous, and saying nothing.
    "duncanmon": Look(skin=SKIN_RUDDY, hair="short", hair_colour=(58, 42, 30), eyes="lids",
                      mouth="flat", inner=kit_shirt((27, 63, 156)), neck="crew", sleeves="short",
                      trousers=WHITE, shoes=BLACK, pose="down", build=1.2, extras=ball),
    # Marcelo Bielsa: the navy Leeds tracksuit, glasses, grey hair, and his bucket.
    "bielsamon": Look(skin=SKIN, hair="short", hair_colour=(200, 200, 200), eyes="glasses",
                      mouth="flat", inner=solid(WHITE), outer="jacket", outer_paint=solid((29, 47, 92)),
                      neck="collar", neck_colour=(246, 194, 28), trousers=(29, 47, 92), shoes=WHITE,
                      pose="chin", extras=bucket),
    # Alan Shearer: Newcastle black and white stripes, one arm up.
    "shearermon": Look(skin=SKIN, hair="short", hair_colour=(200, 176, 136), eyes="open", mouth="grin",
                       inner=kit_shirt(WHITE, stripe=BLACK), neck="crew", sleeves="short",
                       trousers=BLACK, shoes=BLACK, pose="raise", extras=ball),
    # Robbie Keane: Spurs white, navy shorts, and the finger guns.
    "robbiemon": Look(skin=SKIN, hair="messy", hair_colour=(58, 42, 30), eyes="happy", mouth="grin",
                      inner=kit_shirt(WHITE), neck="collar", neck_colour=(19, 34, 87), sleeves="short",
                      trousers=(19, 34, 87), shoes=WHITE, pose="point", extras=number("10", (19, 34, 87))),
    # Sergio Agüero: City sky blue, the hair bleached.
    "agueromon": Look(skin=SKIN_OLIVE, hair="short", hair_colour=(242, 240, 234), eyes="open",
                      mouth="grin", inner=kit_shirt((108, 171, 221)), neck="crew", sleeves="short",
                      trousers=WHITE, shoes=BLACK, pose="raise", extras=number("10")),
    # John Terry: Chelsea blue, the armband, and the shin pads on.
    "terrymon": Look(skin=SKIN, hair="short", hair_colour=(42, 30, 24), eyes="open", mouth="smirk",
                     inner=kit_shirt((3, 70, 148)), neck="crew", sleeves="short", trousers=(3, 70, 148),
                     shoes=BLACK, pose="hips", extras=armband),
    # Thierry Henry: Arsenal red with white sleeves.
    "henrymon": Look(skin=SKIN_DEEP, hair="bald", hair_colour=(26, 26, 26), eyes="lids", mouth="smirk",
                     inner=kit_shirt((239, 1, 7), sleeves=WHITE), neck="collar", neck_colour=WHITE,
                     trousers=WHITE, shoes=BLACK, pose="hips", extras=number("14")),
    # Steven Gerrard: Liverpool red, pointing at the badge.
    "gerrardmon": Look(skin=SKIN, hair="short", hair_colour=(106, 74, 42), eyes="open", mouth="smile",
                       inner=kit_shirt((200, 16, 46)), neck="crew", sleeves="short",
                       trousers=(200, 16, 46), shoes=BLACK, pose="point", extras=number("8")),
    # Roy Keane: United red with the white collar, the grey beard, and the arms folded.
    "keanemon": Look(skin=SKIN_PALE, hair="short", hair_colour=(110, 110, 110), face_hair="beard",
                     face_hair_colour=(120, 120, 120), eyes="down", mouth="flat",
                     inner=kit_shirt((208, 28, 36)), neck="collar", neck_colour=WHITE, sleeves="short",
                     trousers=WHITE, shoes=BLACK, pose="crossed", extras=ball),
}

# Their types, for the glow: the first of each one's types.
TYPE = {
    "murraymon": "brawn", "wrightymon": "hype", "mcgrathmon": "chill", "duncanmon": "brawn",
    "bielsamon": "brains", "shearermon": "graft", "robbiemon": "charm", "agueromon": "hype",
    "terrymon": "brawn", "henrymon": "arty", "gerrardmon": "graft", "keanemon": "brawn",
}


def draw(id):
    return glow(sprites.outline(kit.front(LOOKS[id], outlined=False)), TYPE[id])


def save(id):
    f = draw(id)
    for root, im in ((PUBLIC / "premier", f), (PUBLIC / "shiny" / "premier", sprites.gild(f, True))):
        (root / "mini").mkdir(parents=True, exist_ok=True)
        im.save(root / f"{id}.png")
        kit.mini(im).save(root / "mini" / f"{id}.png")


def sheet():
    """Every one at twice size: front, shiny and follower, a row each."""
    ids = list(LOOKS)
    cell, pad = 192, 8
    OUT.mkdir(parents=True, exist_ok=True)
    out = Image.new("RGB", (3 * (cell + pad) + pad, len(ids) * (cell + pad) + pad), (226, 232, 240))
    for r, id in enumerate(ids):
        f = Image.open(PUBLIC / "premier" / f"{id}.png").convert("RGBA")
        s = Image.open(PUBLIC / "shiny" / "premier" / f"{id}.png").convert("RGBA")
        m = Image.open(PUBLIC / "premier" / "mini" / f"{id}.png").convert("RGBA")
        for c, im in enumerate((f, s, m)):
            big = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
            bg = Image.new("RGBA", (cell, cell), (122, 178, 104, 255) if c == 2 else (244, 241, 234, 255))
            bg.alpha_composite(big, ((cell - big.width) // 2, (cell - big.height) // 2))
            out.paste(bg, (pad + c * (cell + pad), pad + r * (cell + pad)))
    out.save(OUT / "sheet.png")


def main(ids):
    for id in ids or LOOKS:
        save(id)
    sheet()


if __name__ == "__main__":
    main(sys.argv[1:])
