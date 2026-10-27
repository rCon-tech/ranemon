"""London's new bosses' own Ranemon, drawn with the body kit: drafts for Rich to approve, not in
the game. Each boss is an entry in `art/bosses/bosses.ts` (their overworld look and a proposal
for their Ranemon) and a Look here. Everything goes to art/bosses/<boss>/, never public/.

    node scripts/drawn/bosses-overworld.mjs   # the bosses' overworld walks, and bosses.json
    python3 scripts/drawn/bosses.py           # their Ranemon, and the preview sheet
    python3 scripts/drawn/bosses.py vivemon   # just one Ranemon (the sheet is still remade)

A new boss: a photo's look in bosses.ts, a Look in RANEMON here, and the two commands.
"""

import json
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import kit
from kit import CX, SIZE, SKIN, SKIN_OLIVE, SKIN_PALE, Look, capsule, ellipse, poly, ramp, rect, solid, sprites
from london import BX, collar_fluff, ears, glow, tail

ART = Path(__file__).resolve().parents[2] / "art" / "bosses"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

SKIN_WARM = ramp((214, 160, 120), (236, 194, 156), (172, 116, 84))
SKIN_BHAV = ramp((196, 138, 98), (222, 172, 130), (150, 96, 64))


def ribbed(base, rib):
    """A ribbed knit: a darker line every third pixel, top to bottom."""
    a, b = ramp(base), ramp(rib)
    return lambda x, y: b if x % 3 == 0 else a


def hands(look):
    """Where the hands are in the front view, for the `hold` pose: the low left and the raised right."""
    hw = round(18 * look.build)
    return (CX - hw + 1 - 4, 79), (CX + hw - 1 - 4, 70)


def glass(f, x, y, drink, stem=True):
    """A glass held at (x, y): clear, with a drink in it, on a stem or as a plastic cup."""
    if stem:
        f.part(rect(x, y - 4, x + 1, y + 1), ramp((220, 230, 236)), line=False)
        f.part(ellipse(x - 5, y - 15, x + 6, y - 4), ramp((226, 236, 240)))
        f.part(ellipse(x - 4, y - 11, x + 5, y - 5), ramp(drink), line=False)
    else:
        f.part(poly((x - 6, y - 16), (x + 6, y - 16), (x + 5, y), (x - 5, y)), ramp((226, 236, 240)))
        f.part(poly((x - 5, y - 12), (x + 5, y - 12), (x + 4, y - 1), (x - 4, y - 1)), ramp(drink), line=False)


def hoops(im, view, colour=(224, 184, 72)):
    """Gold hoops at the ears, painted on the finished figure."""
    if view != "front":
        return
    d = ImageDraw.Draw(im)
    for x in (24, 66):
        d.ellipse([x, 36, x + 6, 44], outline=colour)


# --- Viv: Vivemon -------------------------------------------------------------------------


def vivemon(f, look, stage, view):
    # The Lisbon sun behind her head, as a slice of orange, and a jug of sangria in her hand.
    c = CX if view == "front" else BX
    if stage == "behind":
        f.part(ellipse(c - 34, -6, c + 34, 50), ramp((246, 160, 50), (252, 196, 90), (220, 120, 30)))
        f.part(ellipse(c - 29, -1, c + 29, 45), ramp((252, 200, 100)), line=False)
    if stage == "front" and view == "front":
        hx, hy = hands(look)[1]
        x, y = hx + 2, hy - 18
        f.part(poly((x - 2, y), (x + 14, y), (x + 15, y + 24), (x - 3, y + 24)), ramp((220, 232, 238)))
        f.part(rect(x - 1, y + 7, x + 13, y + 23), ramp((150, 26, 48), (190, 50, 70), (110, 16, 36)), line=False)
        f.part(ellipse(x + 1, y + 10, x + 7, y + 16), ramp((246, 160, 50)), line=False)
        f.part(ellipse(x + 7, y + 15, x + 12, y + 20), ramp((140, 200, 90)), line=False)
        f.part(capsule((x + 15, y + 4), (x + 18, y + 14), 3), ramp((220, 232, 238)))
        f.part(rect(x + 9, y - 10, x + 10, y + 12), ramp((30, 30, 36)), line=False)
    if stage == "paint" and view == "front":
        # Segments in the orange slice.
        d = ImageDraw.Draw(f)
        for dx, dy in ((-30, 10), (30, 10), (-24, -2), (24, -2)):
            d.line([(c, 22), (c + dx, 22 + dy)], fill=(246, 170, 70))


VIV = Look(skin=SKIN_PALE, hair="bun", hair_colour=(42, 30, 26), eyes="shades", mouth="smirk",
           inner=ribbed((30, 30, 36), (54, 54, 62)), neck="crew", sleeves="short",
           scarf=((200, 48, 58), (244, 240, 234)), trousers=(240, 238, 232), shoes=(200, 154, 112),
           pose="hold", props=("wine",), extras=vivemon)


# --- Meg: Megamon -------------------------------------------------------------------------


def megamon(f, look, stage, view):
    # Mega Evolution's ring behind her, its keystone at her neck, and a festival drinks pouch.
    c = CX if view == "front" else BX
    if stage == "behind":
        ring = ellipse(c - 44, 4, c + 44, 92) & ~ellipse(c - 38, 10, c + 38, 86)
        f.part(ring, ramp((240, 120, 170), (250, 170, 210), (200, 70, 130)))
        for dx in (-40, 40):
            f.part(poly((c + dx - 5, 40), (c + dx + 5, 40), (c + dx, 54)), ramp((250, 200, 60)))
    if stage == "front" and view == "front":
        f.part(ellipse(CX - 5, 60, CX + 5, 70), ramp((150, 120, 220), (230, 200, 250), (90, 60, 160)))
        hx, hy = hands(look)[1]
        f.part(poly((hx - 4, hy - 20), (hx + 8, hy - 20), (hx + 9, hy - 2), (hx - 5, hy - 2)),
               ramp((226, 236, 240)))
        f.part(rect(hx - 4, hy - 10, hx + 8, hy - 3), ramp((250, 180, 30), (255, 214, 90), (220, 140, 20)), line=False)
    if stage == "paint":
        hoops(f, view)
        if view == "front":
            d = ImageDraw.Draw(f)
            d.point((CX - 2, 63), fill=(255, 255, 255))


MEG = Look(skin=SKIN, hair="long", hair_colour=(78, 52, 38), eyes="happy", mouth="smile",
           inner=solid((28, 28, 34)), outer="open", outer_paint=solid((206, 194, 200)), neck="v",
           trousers=(40, 56, 100), shoes=(232, 190, 154), pose="hold", extras=megamon)


# --- Annie: Anniemon ----------------------------------------------------------------------


def anniemon(f, look, stage, view):
    # A little red Vespa parked behind her, her black handbag, and a glass of red.
    c = CX if view == "front" else BX
    if stage == "behind" and view == "front":
        f.part(ellipse(c + 14, 62, c + 48, 88) | rect(c + 38, 40, c + 42, 66), ramp((150, 30, 50), (190, 60, 80), (100, 16, 34)))
        f.part(rect(c + 32, 38, c + 48, 41), ramp((60, 60, 66)))
        f.part(ellipse(c + 34, 82, c + 48, 96), ramp((50, 50, 56)))
    if stage == "front" and view == "front":
        lx, ly = hands(look)[0]
        f.part(capsule((lx - 4, ly - 2), (lx + 4, ly - 2), 2), ramp((30, 30, 36)), line=False)
        f.part(rect(lx - 9, ly, lx + 9, ly + 10), ramp((26, 26, 32), (60, 60, 70), (16, 16, 20)))
        hx, hy = hands(look)[1]
        glass(f, hx, hy, (140, 24, 44))
    if stage == "paint" and view == "front":
        d = ImageDraw.Draw(f)
        for y in (64, 70, 76):
            d.point((CX, y), fill=(246, 244, 236))
        for x in (CX - 10, CX + 9):  # the blue V on each trainer
            d.line([(x - 2, 89), (x, 92), (x + 2, 89)], fill=(40, 70, 170))


ANNIE = Look(skin=SKIN_PALE, hair="long", hair_colour=(156, 112, 72), eyes="shades", mouth="grin",
             inner=solid((200, 208, 154)), neck="v", sleeves="short", trousers=(200, 208, 154),
             shoes=(246, 246, 240), pose="hold", extras=anniemon)


# --- Esme: Esmeon -------------------------------------------------------------------------

PINK, ORANGE = (240, 138, 168), (240, 106, 36)


def esmeon(f, look, stage, view):
    # An Eeveelution: her pink and orange wrap as its ruff, its ears and its tail, and a spritz.
    ears(f, view, stage, ORANGE, PINK, tall=16, wide=12)
    collar_fluff(f, view, stage, PINK)
    tail(f, view, stage, ORANGE, PINK, 8)
    if stage == "front" and view == "front":
        hx, hy = hands(look)[1]
        glass(f, hx, hy, (246, 120, 40))
        f.part(ellipse(hx + 2, hy - 17, hx + 6, hy - 13), ramp((246, 160, 60)), line=False)


ESME = Look(skin=SKIN_PALE, hair="bob", hair_colour=(226, 194, 136), eyes="shades", mouth="laugh",
            inner=solid((200, 214, 48)), neck="turtle", sleeves="short", trousers=(200, 214, 48),
            shoes=(74, 160, 216), pose="hold", long_robe=True, extras=esmeon, build=1.05)


# --- Ana: Anamon --------------------------------------------------------------------------

RUST = (200, 120, 58)


def anamon(f, look, stage, view):
    # A sunny fox, Vulpix to Ninetales: rust ears, a big tail with a cream tip, and a pint.
    ears(f, view, stage, RUST, (246, 224, 196), tall=18, wide=12)
    tail(f, view, stage, RUST, (250, 236, 214), 9)
    if stage == "front" and view == "front":
        hx, hy = hands(look)[1]
        glass(f, hx, hy + 2, (236, 176, 64), stem=False)


ANA = Look(skin=SKIN_WARM, hair="long", hair_colour=(58, 40, 32), eyes="round",
           lens=(150, 90, 60), frame=(214, 176, 90), mouth="laugh", inner=solid(RUST), neck="crew",
           sleeves="short", trousers=RUST, shoes=(168, 104, 58), pose="hold", long_robe=True,
           extras=anamon)


# --- Dr Batool: Batoolmon -----------------------------------------------------------------


def batoolmon(f, look, stage, view):
    # A mortarboard and tassel, blue facings down the gown, a stethoscope and her scroll.
    c = CX if view == "front" else BX
    top = 2 if view == "front" else 6
    if stage == "head":
        f.part(poly((c - 30, top + 6), (c, top - 4), (c + 30, top + 6), (c, top + 16)), ramp((28, 28, 34)))
        f.part(rect(c - 16, top + 10, c + 16, top + 18), ramp((28, 28, 34)))
        f.part(capsule((c, top + 6), (c + 24, top + 12), 1) | rect(c + 23, top + 12, c + 25, top + 26),
               ramp((240, 196, 60)), line=False)
    if stage == "body" and view == "front":
        for x in (CX - 9, CX + 6):
            f.part(rect(x, 54, x + 3, 92), ramp((90, 134, 200)))
    if stage == "front" and view == "front":
        f.part(capsule((CX - 10, 55), (CX - 6, 72), 2) | capsule((CX + 10, 55), (CX + 6, 72), 2),
               ramp((170, 176, 186)), line=False)
        f.part(ellipse(CX + 3, 70, CX + 11, 78), ramp((200, 206, 216)))
        hx, hy = hands(look)[1]
        f.part(capsule((hx - 6, hy - 6), (hx + 10, hy - 10), 6), ramp((246, 242, 230)))
        f.part(rect(hx + 1, hy - 12, hx + 3, hy - 4), ramp((200, 40, 50)), line=False)


BATOOL = Look(skin=SKIN, hair="long", hair_colour=(78, 46, 32), eyes="open",
              eye_colour=(80, 56, 40), mouth="smile", inner=solid((244, 240, 230)), outer="gown",
              outer_paint=solid((28, 28, 34)), neck="crew", shoes=(244, 240, 230), pose="hold",
              long_robe=True, extras=batoolmon)


# --- Dr Bhav: Bhavemon --------------------------------------------------------------------


def bhavemon(f, look, stage, view):
    # A giant capsule floating behind her, her prescription pad, and the oat latte.
    c = CX if view == "front" else BX
    if stage == "behind":
        f.part(capsule((c - 40, 30), (c - 10, 6), 12) & (kit.X < c - 25), ramp((246, 244, 240)))
        f.part(capsule((c - 40, 30), (c - 10, 6), 12) & (kit.X >= c - 25), ramp((122, 28, 44)))
    if stage == "front" and view == "front":
        lx, ly = hands(look)[0]
        f.part(rect(lx - 8, ly - 12, lx + 6, ly + 2), ramp((246, 246, 240)))
        f.part(rect(lx - 6, ly - 12, lx + 4, ly - 9), ramp((60, 120, 200)), line=False)
    if stage == "paint" and view == "front":
        d = ImageDraw.Draw(f)
        lx, ly = hands(look)[0]
        for y in (ly - 6, ly - 3):
            d.line([(lx - 6, y), (lx + 3, y)], fill=(150, 150, 170))
        hoops(f, view, (224, 184, 72))


BHAV = Look(skin=SKIN_BHAV, hair="long", hair_colour=(22, 18, 26), eyes="round",
            lens=(30, 30, 40), frame=(224, 184, 72), mouth="smirk", inner=solid((122, 28, 44)),
            neck="none", sleeves="short", shoes=(216, 176, 72), pose="hold", props=("cup",),
            long_robe=True, extras=bhavemon)


# --- Sibeal: Sibealmon --------------------------------------------------------------------


def sibealmon(f, look, stage, view):
    # Norm's border collie ears and white ruff, his tail, and his lead round her wrist.
    ears(f, view, stage, (30, 30, 36), (244, 244, 240), tall=14, wide=12)
    collar_fluff(f, view, stage, (244, 244, 240))
    tail(f, view, stage, (30, 30, 36), (244, 244, 240), 7)
    if stage == "front" and view == "front":
        lx, ly = hands(look)[0]
        f.part(capsule((lx, ly), (lx - 8, ly + 14), 2), ramp((60, 110, 210)), line=False)


SIBEAL = Look(skin=SKIN, hair="long", hair_colour=(122, 74, 38), eyes="happy", mouth="smile",
              inner=solid((244, 232, 216)), outer="jacket", outer_paint=solid((200, 58, 58)),
              neck="collar", neck_colour=(244, 232, 216), trousers=(58, 90, 138),
              shoes=(90, 58, 36), pose="hold", props=("phone",), extras=sibealmon)


RANEMON = {
    "vivemon": VIV,
    "megamon": MEG,
    "anniemon": ANNIE,
    "esmeon": ESME,
    "batoolmon": BATOOL,
    "anamon": ANA,
    "bhavemon": BHAV,
    "sibealmon": SIBEAL,
}


def draw(id, kind):
    """Front and back: a boss's ace stands full size in its box, with its type's glow."""
    look = RANEMON[id]
    f, b = sprites.outline(kit.front(look, outlined=False)), sprites.outline(kit.back(look, outlined=False))
    return glow(f, kind), glow(b, kind)


def save(boss):
    mon = boss["ranemon"]
    out = ART / boss["id"]
    (out / "shiny").mkdir(parents=True, exist_ok=True)
    f, b = draw(mon["id"], mon["types"][0])
    f.save(out / f"{mon['id']}.png")
    b.save(out / f"{mon['id']}-back.png")
    sprites.gild(f, True).save(out / "shiny" / f"{mon['id']}.png")
    sprites.gild(b, True).save(out / "shiny" / f"{mon['id']}-back.png")
    kit.mini(f).save(out / f"{mon['id']}-mini.png")


# --- The preview sheet --------------------------------------------------------------------

TYPE_COLOUR = {"brains": "#7b4fd6", "brawn": "#e0592a", "chaos": "#c8288f", "chill": "#4fb3e8",
               "charm": "#f07aae", "hype": "#f2c418", "posh": "#2b4a9b", "graft": "#b4702a",
               "arty": "#3aa38a"}


def card(boss) -> Image.Image:
    """One boss: their walk four ways, their Ranemon front, back, shiny and follower, and the
    proposal for it."""
    mon = boss["ranemon"]
    out = ART / boss["id"]
    W, H = 1520, 500
    im = Image.new("RGB", (W, H), (244, 241, 234))
    d = ImageDraw.Draw(im)
    big, mid, small = (ImageFont.truetype(FONT, s) for s in (30, 19, 16))
    d.text((24, 16), boss["name"], font=big, fill=(30, 30, 40))
    d.text((24 + d.textlength(boss["name"], font=big) + 16, 28), boss["from"], font=small, fill=(110, 110, 120))

    # The overworld, on grass: standing and mid-stride, facing down, left, right and up.
    walk = Image.open(out / "overworld.png").convert("RGBA")
    grass = Image.new("RGBA", (4 * 2 * 64 + 20, 2 * 96 * 2 + 10), (122, 178, 104, 255))
    for col, (row, frame) in enumerate([(0, 0), (1, 0), (2, 0), (3, 0)]):
        for k, fr in enumerate((frame, 2)):
            sprite = walk.crop((fr * 64, row * 96, fr * 64 + 64, row * 96 + 96)).resize((128, 192), Image.NEAREST)
            grass.alpha_composite(sprite, (col * 128 + 10 * (col > 1), k * 196))
    im.paste(grass, (24, 64), grass)
    d.text((24, 64 + grass.height + 6), "Overworld: down, left, right, up (standing, then mid-stride)",
           font=small, fill=(90, 90, 100))

    # The Ranemon at three times: front, back, shiny, follower.
    x0, y0 = 24 + grass.width + 28, 70
    names = [(f"{mon['id']}.png", "Front"), (f"{mon['id']}-back.png", "Back"),
             (f"shiny/{mon['id']}.png", "Shiny")]
    for i, (n, label) in enumerate(names):
        s = Image.open(out / n).convert("RGBA").resize((192, 192), Image.NEAREST)
        bg = Image.new("RGBA", (192, 192), (226, 232, 240, 255))
        bg.alpha_composite(s)
        im.paste(bg, (x0 + i * 200, y0))
        d.text((x0 + i * 200, y0 + 196), label, font=small, fill=(90, 90, 100))
    m = Image.open(out / f"{mon['id']}-mini.png").convert("RGBA").resize((120, 120), Image.NEAREST)
    bg = Image.new("RGBA", (120, 120), (122, 178, 104, 255))
    bg.alpha_composite(m)
    im.paste(bg, (x0 + 600, y0 + 72))
    d.text((x0 + 600, y0 + 196), "Follower", font=small, fill=(90, 90, 100))

    # The proposal.
    ty = y0 + 230
    d.text((x0, ty), mon["name"], font=big, fill=(30, 30, 40))
    tx = x0 + d.textlength(mon["name"], font=big) + 14
    for t in mon["types"]:
        w = d.textlength(t.upper(), font=small) + 16
        d.rounded_rectangle([tx, ty + 6, tx + w, ty + 30], 6, fill=TYPE_COLOUR[t])
        d.text((tx + 8, ty + 9), t.upper(), font=small, fill=(255, 255, 255))
        tx += w + 8
    hp, at, de, sp, spe = mon["stats"]
    d.text((x0, ty + 44), f"HP {hp}  ·  Atk {at}  ·  Def {de}  ·  Spirit {sp}  ·  Speed {spe}  "
           f"(total {sum(mon['stats'])})", font=mid, fill=(50, 50, 60))
    moves = ", ".join(m.replace("-", " ").title() for m in mon["moves"][:3])
    sig = mon["signature"]
    d.text((x0, ty + 74), f"Moves: {moves}, and {sig['name']} (new)", font=mid, fill=(50, 50, 60))
    d.text((x0, ty + 102), f"{sig['name']} ({sig['type']}): {sig['idea']}", font=small, fill=(90, 90, 100))
    for i, line in enumerate(textwrap.wrap("Ranedex: " + mon["entry"], 92)):
        d.text((x0, ty + 128 + i * 21), line, font=small, fill=(60, 60, 70))
    return im


def sheet(bosses):
    cards = [card(b) for b in bosses]
    out = Image.new("RGB", (cards[0].width, sum(c.height + 12 for c in cards) + 12), (210, 214, 222))
    y = 12
    for c in cards:
        out.paste(c, (0, y))
        y += c.height + 12
    out.save(ART / "preview.png")
    for b, c in zip(bosses, cards):
        c.save(ART / b["id"] / "card.png")


def main(ids):
    bosses = json.loads((ART / "bosses.json").read_text())
    for boss in bosses:
        if not ids or boss["ranemon"]["id"] in ids:
            save(boss)
    sheet(bosses)


if __name__ == "__main__":
    main(sys.argv[1:])
