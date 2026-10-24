"""Builds the game's full-colour pixel sprites from the photo cut-outs in public/sprites.

    python3 -m pip install pillow numpy
    python3 scripts/sprites.py [--sheet path/to/sheet-page-7.png]

Writes, under public/sprites:
  bw/<id>.png        each Ranemon at 96 pixels, cut down to 32 colours like a handheld sprite
                     (or, for those in HD, at 192 pixels and 64 colours from a bigger cut-out)
  bw/mini/<id>.png   a 40-pixel outlined version for the Ranemon that follows you in story mode
  evo/<id>.png       each evolved form: the same photo with a type-coloured aura and a costume
                     piece from the Pokémon it's named after (wings, spoons, a crest, ...)
  evo/mini/<id>.png
  bw/bns.png         B&S, cut from the group photo on the sheet's last page (only with --sheet)
  bw/tobymon.png     the legendary Tobymon, wrapped in a gold-and-coral glow with sparkles
  shiny/...          the shiny palette of every sprite above (bar B&S), at the same path under
                     shiny/: gilded, ringed in gold, with sparkles on the full-size ones

    python3 scripts/sprites.py --shiny-only   rebuilds just the shiny sprites
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/sprites"
SIZE = 96
COLOURS = 32
OUTLINE = (40, 40, 48, 255)

TYPE_COLOUR = {
    "brains": (123, 79, 214),
    "brawn": (224, 89, 42),
    "chaos": (200, 40, 143),
    "chill": (79, 179, 232),
    "charm": (240, 122, 174),
    "hype": (242, 196, 24),
    "posh": (43, 74, 155),
    "graft": (180, 112, 42),
    "arty": (47, 163, 122),
}

# Looks redrawn in more detail from a bigger, full-length cut-out: (size, colours) for the battle
# sprite, the (left, top, size) square of the cut-out the follower's head-and-shoulders mini is
# taken from, and a touch-up for details too small to survive the cut to a palette.
HD = {
    "olliemon-tricolour": (192, 64, (104, 0, 176)),
    "oismon-cap": (192, 64, (140, 0, 210)),
    "enda-wine": (192, 64, (160, 70, 160)),
    "carlmon-tache": (192, 64, (160, 0, 170)),
    "conemon-curls": (192, 64, (150, 0, 210)),
    "boydemon-rugby": (192, 64, (150, 0, 95)),
    "steadmon-suit": (192, 64, (100, 0, 190)),
    "gibbsmon-races": (192, 64, (90, 0, 130)),
    "jammon-shades": (192, 64, (40, 0, 260)),
    "killemon-thumbs": (192, 64, (50, 0, 180)),
    "owemon-dance": (192, 64, (130, 20, 170)),
    "robinmon-coat": (192, 64, (100, 0, 170)),
    "simomon-linen": (192, 64, (205, 0, 170)),
    "lorcamon-tux": (192, 64, (70, 0, 175)),
    "thilomon-fish": (192, 64, (120, 0, 140)),
    # Ranemon who came later, drawn in HD from the start.
    "paulimon": (192, 64, (80, 0, 250)),
    "skehemon": (192, 64, (60, 0, 180)),
    "vinnimon": (192, 64, (140, 0, 170)),
    "petchemon": (192, 64, (90, 10, 200)),
    "crampemon": (192, 64, (50, 0, 290)),
    # An item evolution from its own photo, wrapped in its type's glow like the other evolutions.
    "cholokill": (192, 64, (105, 0, 150)),
}


def pin(im: Image.Image) -> Image.Image:
    """Olliemon's tricolour pin, 6 x 4 pixels on his shirt pocket, which the palette loses."""
    d = ImageDraw.Draw(im)
    for i, colour in enumerate(((22, 155, 98), (246, 246, 240), (255, 136, 62))):
        d.rectangle([119 + i * 2, 126, 120 + i * 2, 129], fill=colour)
    d.point([(119, 130), (122, 130), (124, 125)], fill=(200, 160, 72))
    return im


TOUCH_UP = {"olliemon-tricolour": pin}

# id: (base form, first type)
EVOLUTIONS = {
    "carlizard": ("carlmon", "hype"),
    "steadakazam": ("steadmon", "brains"),
    "clefenda": ("enda", "charm"),
    "hitmonois": ("oismon", "hype"),
    "hitmonollie": ("olliemon", "brawn"),
    "hugengar": ("hugomon", "brains"),
    "gyaragibbs": ("gibbsmon", "brawn"),
    "jamchamp": ("jammon", "chill"),
    "primeboyd": ("boydemon", "brawn"),
    "killigatr": ("killemon", "hype"),
    "lorchu": ("lorcamon", "charm"),
    "fearowe": ("owemon", "brawn"),
    "conix": ("conemon", "hype"),
    "robinsey": ("robinmon", "charm"),
    "weezimo": ("simomon", "chill"),
    "thilotrode": ("thilomon", "chaos"),
    "pauliwrath": ("paulimon", "hype"),
    "skehdinja": ("skehemon", "chill"),
    "vinnisaur": ("vinnimon", "charm"),
    "crampsb2bthilomon": ("crampemon", "hype"),
    # A second look of the same Ranemon, from another photo (src/lib/battle/variants.ts).
    "hitmonollie-tricolour": ("olliemon-tricolour", "brawn"),
    "hitmonois-cap": ("oismon-cap", "hype"),
    "clefenda-wine": ("enda-wine", "charm"),
    "carlizard-tache": ("carlmon-tache", "hype"),
    "conix-curls": ("conemon-curls", "hype"),
    "primeboyd-rugby": ("boydemon-rugby", "brawn"),
    "steadakazam-suit": ("steadmon-suit", "brains"),
    "gyaragibbs-races": ("gibbsmon-races", "brawn"),
    "jamchamp-shades": ("jammon-shades", "chill"),
    "killigatr-thumbs": ("killemon-thumbs", "hype"),
    "fearowe-dance": ("owemon-dance", "brawn"),
    "robinsey-coat": ("robinmon-coat", "charm"),
    "weezimo-linen": ("simomon-linen", "chill"),
    "lorchu-tux": ("lorcamon-tux", "charm"),
    "thilotrode-fish": ("thilomon-fish", "chaos"),
}

# Where the head is, (x centre, y top, half width) on the 96-pixel canvas, for photos where
# something held up (a glass of wine) is higher than the head and would fool head_of.
HEADS = {"clefenda-wine": (58, 26, 14)}


def pixelate(im: Image.Image, size: int, colours: int = COLOURS) -> Image.Image:
    """Shrinks to `size` wide and cuts to a small palette, with hard-edged transparency."""
    im = im.convert("RGBA")
    im = im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)
    alpha = np.asarray(im)[..., 3] > 127
    rgb = im.convert("RGB").quantize(colours, method=Image.Quantize.MEDIANCUT, dither=0)
    out = np.zeros((im.height, im.width, 4), np.uint8)
    out[..., :3] = np.asarray(rgb.convert("RGB"))
    out[..., 3] = np.where(alpha, 255, 0)
    return Image.fromarray(out, "RGBA")


def outline(im: Image.Image, colour=OUTLINE) -> Image.Image:
    """A 1-pixel outline around everything opaque."""
    a = np.asarray(im)[..., 3] > 0
    grown = a.copy()
    grown[1:] |= a[:-1]
    grown[:-1] |= a[1:]
    grown[:, 1:] |= a[:, :-1]
    grown[:, :-1] |= a[:, 1:]
    ring = np.zeros((*a.shape, 4), np.uint8)
    ring[grown & ~a] = colour
    out = Image.fromarray(ring, "RGBA")
    out.alpha_composite(im)
    return out


def aura(mask: Image.Image, colour) -> Image.Image:
    """A soft glow in the type's colour, stepped into 3 hard bands so it stays pixel art."""
    a = mask.getchannel("A").filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    v = np.asarray(a).astype(np.float32) / 255
    band = np.select([v > 0.75, v > 0.45, v > 0.2], [200, 130, 70], 0).astype(np.uint8)
    out = np.zeros((*v.shape, 4), np.uint8)
    out[..., :3] = colour
    out[..., 3] = band
    return Image.fromarray(out, "RGBA")


def head_of(im: Image.Image) -> tuple[int, int, int]:
    """The top of the head: (x centre, y top, half width) from the opaque pixels near the top."""
    a = np.asarray(im)[..., 3] > 0
    rows = np.where(a.any(axis=1))[0]
    top = rows[0]
    band = a[top : top + 14]
    cols = np.where(band.any(axis=0))[0]
    return int((cols[0] + cols[-1]) / 2), int(top), int((cols[-1] - cols[0]) / 2)


# ---------- costume pieces, drawn straight onto the 96-pixel canvas ----------


def poly(d: ImageDraw.ImageDraw, pts, fill):
    d.polygon(pts, fill=fill, outline=OUTLINE)


def wings(d, cx, top, colour, inner):
    for s in (-1, 1):
        x0 = cx + s * 18
        pts = [(x0, top + 34), (x0 + s * 30, top + 6), (x0 + s * 34, top + 26), (x0 + s * 26, top + 30),
               (x0 + s * 30, top + 42), (x0 + s * 20, top + 40), (x0 + s * 18, top + 50)]
        poly(d, pts, colour)
        poly(d, [(x0 + s * 4, top + 34), (x0 + s * 26, top + 12), (x0 + s * 24, top + 28)], inner)


def flame(d, x, y, size=1.0):
    s = size
    poly(d, [(x, y), (x - 6 * s, y - 10 * s), (x - 2 * s, y - 9 * s), (x, y - 18 * s), (x + 3 * s, y - 9 * s),
             (x + 7 * s, y - 11 * s)], (248, 120, 40))
    poly(d, [(x, y - 1), (x - 3 * s, y - 7 * s), (x, y - 11 * s), (x + 3 * s, y - 7 * s)], (248, 216, 72))


def spoon(d, x, y, flip=1):
    d.line([(x, y), (x + flip * 8, y - 22)], fill=OUTLINE, width=3)
    d.line([(x, y), (x + flip * 8, y - 22)], fill=(200, 204, 216), width=1)
    d.ellipse([x + flip * 8 - 4, y - 31, x + flip * 8 + 4, y - 20], fill=(216, 220, 232), outline=OUTLINE)


def ears(d, cx, top, w, colour, tip, inner=None, tall=22):
    for s in (-1, 1):
        bx = cx + s * (w - 4)
        pts = [(bx - 6, top + 8), (bx + s * 10, top - tall), (bx + 6, top + 8)]
        poly(d, pts, colour)
        if inner:
            poly(d, [(bx - 2, top + 5), (bx + s * 7, top - tall + 8), (bx + 3, top + 5)], inner)
        poly(d, [(bx + s * 10, top - tall), (bx + s * 6, top - tall + 7), (bx + s * 12, top - tall + 6)], tip)


def crest(d, cx, top, colour, spikes=4, height=14, width=26):
    step = width / spikes
    x0 = cx - width / 2
    pts = [(x0, top + 6)]
    for i in range(spikes):
        pts += [(x0 + step * i + step / 2, top - height + (i % 2) * 3), (x0 + step * (i + 1), top + 4)]
    pts.append((x0 + width, top + 8))
    poly(d, pts, colour)


def sparkle(d, x, y, colour=(248, 248, 160)):
    d.line([(x - 3, y), (x + 3, y)], fill=colour)
    d.line([(x, y - 3), (x, y + 3)], fill=colour)
    d.point((x, y), fill=(255, 255, 255))


def bolt(d, x, y, colour=(248, 216, 40)):
    poly(d, [(x, y), (x + 8, y - 10), (x + 4, y - 10), (x + 12, y - 22), (x + 2, y - 12), (x + 6, y - 12),
             (x - 4, y)], colour)


def puff(d, x, y, r, colour=(168, 120, 200)):
    d.ellipse([x - r, y - r, x + r, y + r], fill=colour, outline=OUTLINE)
    d.ellipse([x - r // 2, y - r // 2 - 1, x, y - 1], fill=(200, 168, 224))


def rock(d, x, y, r):
    pts = [(x - r, y), (x - r // 2, y - r), (x + r // 2, y - r), (x + r, y - r // 3), (x + r // 2, y + r),
           (x - r // 2, y + r)]
    poly(d, pts, (160, 160, 168))
    d.line([(x - r // 2, y - r // 2), (x, y)], fill=(112, 112, 120))


def glove(d, x, y, colour):
    d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=colour, outline=OUTLINE)
    d.rectangle([x - 6, y + 7, x + 6, y + 12], fill=(248, 248, 248), outline=OUTLINE)
    d.arc([x - 6, y - 6, x + 2, y + 2], 180, 270, fill=(255, 160, 160))


def costume(evo: str, d: ImageDraw.ImageDraw, back: ImageDraw.ImageDraw, head, body_w: int):
    cx, top, w = head
    if evo == "carlizard":
        wings(back, cx, top, (232, 104, 48), (88, 160, 200))
        flame(d, cx + w + 8, top + 22, 1.1)
        flame(d, SIZE - 12, SIZE - 6, 1.3)
    elif evo == "steadakazam":
        spoon(d, 12, SIZE - 14, 1)
        spoon(d, SIZE - 12, SIZE - 14, -1)
        crest(d, cx, top + 2, (232, 184, 48), spikes=3, height=10, width=22)
    elif evo == "clefenda":
        ears(d, cx, top + 6, w, (248, 184, 200), (96, 72, 72), (240, 140, 168))
        for x, y in ((10, 20), (SIZE - 12, 30), (16, 60), (SIZE - 16, 66)):
            sparkle(d, x, y, (255, 200, 232))
    elif evo == "hitmonois":
        d.rectangle([cx - w, top + 9, cx + w, top + 13], fill=(224, 48, 48), outline=OUTLINE)
        poly(d, [(cx + w, top + 10), (cx + w + 12, top + 6), (cx + w + 10, top + 14)], (224, 48, 48))
        poly(d, [(cx + w, top + 12), (cx + w + 10, top + 18), (cx + w + 4, top + 20)], (224, 48, 48))
    elif evo == "hitmonollie":
        glove(d, 12, SIZE - 22, (224, 48, 48))
        glove(d, SIZE - 12, SIZE - 22, (224, 48, 48))
    elif evo == "hugengar":
        crest(back, cx, top + 6, (112, 72, 160), spikes=5, height=18, width=w * 2 + 10)
        for s in (-1, 1):
            poly(back, [(cx + s * (w + 2), top + 18), (cx + s * (w + 16), top + 8), (cx + s * (w + 6), top + 28)],
                 (112, 72, 160))
    elif evo == "gyaragibbs":
        crest(back, cx, top + 4, (56, 112, 216), spikes=3, height=16, width=w * 2)
        for s in (-1, 1):
            poly(back, [(cx + s * (w + 2), top + 22), (cx + s * (w + 18), top + 12), (cx + s * (w + 14), top + 26),
                        (cx + s * (w + 4), top + 30)], (240, 240, 248))
    elif evo == "jamchamp":
        crest(d, cx, top + 4, (168, 176, 192), spikes=3, height=12, width=20)
        d.rectangle([4, SIZE - 14, SIZE - 5, SIZE - 8], fill=(216, 168, 32), outline=OUTLINE)
        d.ellipse([cx - 8, SIZE - 18, cx + 8, SIZE - 4], fill=(248, 216, 72), outline=OUTLINE)
    elif evo == "primeboyd":
        for s in (-1, 1):
            for i in range(3):
                poly(back, [(cx + s * (w - 2), top + 10 + i * 8), (cx + s * (w + 12), top + 6 + i * 8),
                            (cx + s * (w + 2), top + 16 + i * 8)], (232, 216, 184))
        x, y = cx + w - 2, top + 4
        for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3)):
            d.line([(x, y), (x + dx * 2, y + dy * 2)], fill=(232, 40, 40), width=2)
    elif evo == "killigatr":
        crest(back, cx, top + 6, (224, 56, 56), spikes=4, height=16, width=w * 2)
        for i in range(3):
            poly(back, [(SIZE - 22 + i * 4, 40 + i * 12), (SIZE - 8 + i * 2, 34 + i * 12), (SIZE - 14 + i * 3, 48 + i * 12)],
                 (224, 56, 56))
    elif evo == "lorchu":
        ears(back, cx, top + 8, w, (232, 152, 40), (72, 56, 40), (248, 216, 96), tall=28)
        bolt(d, SIZE - 20, SIZE - 8)
    elif evo == "fearowe":
        crest(back, cx, top + 6, (176, 72, 48), spikes=5, height=20, width=w * 2)
        wings(back, cx, top + 10, (168, 120, 72), (232, 208, 168))
    elif evo == "conix":
        poly(back, [(cx - 5, top + 4), (cx, top - 14), (cx + 5, top + 4)], (160, 160, 168))
        for x, y, r in ((10, 30, 7), (8, 52, 8), (14, 74, 9), (SIZE - 10, 30, 7), (SIZE - 9, 52, 8), (SIZE - 14, 74, 9)):
            rock(d, x, y, r)
    elif evo == "robinsey":
        d.rectangle([cx - 12, top - 2, cx + 12, top + 8], fill=(248, 248, 248), outline=OUTLINE)
        d.rectangle([cx - 2, top, cx + 2, top + 6], fill=(232, 56, 72))
        d.rectangle([cx - 5, top + 2, cx + 5, top + 4], fill=(232, 56, 72))
        for s in (-1, 1):
            d.ellipse([cx + s * (w + 4) - 7, top + 14, cx + s * (w + 4) + 7, top + 30], fill=(248, 192, 208),
                      outline=OUTLINE)
        d.ellipse([SIZE - 20, SIZE - 22, SIZE - 6, SIZE - 4], fill=(248, 244, 232), outline=OUTLINE)
    elif evo == "weezimo":
        for x, y, r in ((12, 24, 8), (SIZE - 12, 22, 7), (8, 56, 6), (SIZE - 10, 54, 8), (cx + w + 6, top + 4, 5)):
            puff(back, x, y, r)
    elif evo == "thilotrode":
        back.ellipse([4, 8, SIZE - 5, SIZE - 3], fill=(232, 64, 56), outline=OUTLINE)
        back.chord([4, 8, SIZE - 5, SIZE - 3], 0, 180, fill=(248, 248, 248), outline=OUTLINE)
        for x, y in ((14, 18), (SIZE - 16, 20), (10, 60)):
            bolt(d, x, y)
    elif evo == "pauliwrath":
        # Poliwrath's swirl on his chest and a pair of boxing gloves.
        x, y = cx, SIZE - 14
        for r in (11, 7, 3):
            d.arc([x - r, y - r, x + r, y + r], 30, 330, fill=OUTLINE, width=2)
        glove(d, 12, SIZE - 14, (72, 112, 200))
        glove(d, SIZE - 12, SIZE - 14, (72, 112, 200))
    elif evo == "skehdinja":
        # Shedinja's halo over his head and its paper-thin shell wings behind.
        d.ellipse([cx - 12, top - 10, cx + 12, top - 3], outline=(248, 216, 96), width=2)
        wings(back, cx, top, (176, 136, 80), (232, 208, 152))
    elif evo == "crampsb2bthilomon":
        # Back to back behind one set of decks, with the notes flying.
        d.rectangle([8, SIZE - 22, SIZE - 9, SIZE - 1], fill=(48, 48, 56), outline=OUTLINE)
        for x in (26, SIZE - 27):
            d.ellipse([x - 10, SIZE - 21, x + 10, SIZE - 13], fill=(24, 24, 28), outline=(120, 120, 136))
            d.ellipse([x - 3, SIZE - 19, x + 3, SIZE - 15], fill=(216, 64, 160))
        d.rectangle([SIZE // 2 - 5, SIZE - 20, SIZE // 2 + 4, SIZE - 12], fill=(88, 88, 104), outline=OUTLINE)
        for x, y in ((6, 20), (SIZE - 10, 16), (SIZE // 2, 4)):
            d.ellipse([x - 3, y + 4, x + 1, y + 7], fill=(248, 216, 72), outline=OUTLINE)
            d.line([(x + 1, y + 5), (x + 1, y - 3)], fill=OUTLINE, width=1)
    elif evo == "vinnisaur":
        # Venusaur's big flower behind him, with leaves either side.
        fx, fy = cx, top + 4
        for i in range(6):
            a = np.pi * (i / 6 * 2 + 1 / 6)
            px, py = fx + np.cos(a) * 16, fy + np.sin(a) * 9
            back.ellipse([px - 9, py - 6, px + 9, py + 6], fill=(240, 120, 152), outline=OUTLINE)
        back.ellipse([fx - 6, fy - 4, fx + 6, fy + 4], fill=(248, 216, 96), outline=OUTLINE)
        for s in (-1, 1):
            poly(back, [(cx + s * 18, top + 44), (cx + s * 46, top + 30), (cx + s * 40, top + 52)], (72, 168, 88))


# Evolutions of two lads at once: the partner whose photo stands beside the base form's.
DUOS = {"crampsb2bthilomon": "thilomon"}


def evolve(evo: str, base: str, kind: str) -> Image.Image:
    photo = Image.open(SRC / f"{base}.png").convert("RGBA")
    body_w = 82
    canvas = Image.new("RGBA", (SIZE, SIZE))
    if evo in DUOS:
        # Side by side, each a little more than half the width, the partner just behind.
        body_w = 56
        partner = pixelate(Image.open(SRC / f"{DUOS[evo]}.png").convert("RGBA"), body_w)
        canvas.paste(partner, (SIZE - body_w, SIZE - partner.height), partner)
        body = pixelate(photo, body_w)
        canvas.alpha_composite(body, (0, SIZE - body.height))
    else:
        body = pixelate(photo, body_w)
        canvas.paste(body, ((SIZE - body_w) // 2, SIZE - body.height), body)
    behind = Image.new("RGBA", (SIZE, SIZE))
    front = Image.new("RGBA", (SIZE, SIZE))
    # A look wears the same costume as its form.
    costume(evo.split("-")[0], ImageDraw.Draw(front), ImageDraw.Draw(behind), HEADS.get(evo) or head_of(canvas), body_w)
    figure = Image.alpha_composite(behind, canvas)
    figure = outline(Image.alpha_composite(figure, front))
    out = aura(figure, TYPE_COLOUR[kind])
    out.alpha_composite(figure)
    return out


GOLD = np.array([[64, 28, 8], [160, 88, 12], [236, 174, 32], [255, 224, 96], [255, 250, 214]], np.float32)
GILD = 0.8
RING = (255, 214, 56, 255)


def gild(im: Image.Image, sparkles: bool) -> Image.Image:
    """A shiny sprite: every colour pulled onto a gold ramp by its brightness, so the friend is
    still recognisable but unmistakably golden, then a gold ring around it and a few sparkles."""
    a = np.asarray(im.convert("RGBA")).astype(np.float32)
    lum = (a[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)) / 255
    pos = np.clip((lum - 0.06) / 0.82, 0, 1) ** 0.85 * (len(GOLD) - 1)
    i = np.clip(pos.astype(int), 0, len(GOLD) - 2)
    f = (pos - i)[..., None]
    gold = GOLD[i] * (1 - f) + GOLD[i + 1] * f
    opaque = a[..., 3] > 0
    a[..., :3][opaque] = gold[opaque] * GILD + a[..., :3][opaque] * (1 - GILD)
    out = outline(Image.fromarray(a.astype(np.uint8), "RGBA"), RING)
    if sparkles:
        d = ImageDraw.Draw(out)
        w, h = out.size
        for x, y in ((8, 10), (w - 9, 18), (6, h // 2 + 4), (w - 7, h // 2 + 14)):
            sparkle(d, x, y, (255, 236, 120))
    return out


# Evolved forms drawn from their own photo, with the type glow evolve() gives the others.
GLOW = {"cholokill": "hype"}

# Legendary Ranemon: a two-tone glow behind them, and sparkles round about.
LEGENDARY = {"tobymon": ((248, 200, 96), (240, 128, 88))}


def legend(im: Image.Image, colours) -> Image.Image:
    outer, inner = colours
    out = aura(im, outer)
    glow = aura(im.filter(ImageFilter.MinFilter(5)), inner)
    out.alpha_composite(glow)
    out.alpha_composite(im)
    d = ImageDraw.Draw(out)
    w, h = out.size
    for x, y in ((10, 14), (w - 12, 10), (5, h // 2), (w - 6, h // 2 + 8), (w // 2 + 20, 4)):
        sparkle(d, x, y, (255, 244, 180))
    return out


def shinies() -> None:
    for d in ("bw", "evo"):
        for path in sorted((SRC / d).glob("*.png")):
            # B&S, Petchemon and Poseidon are never wild, so never shiny.
            if path.stem in ("bns", "petchemon") or not (SRC / d / "mini" / path.name).exists():
                continue
            (SRC / "shiny" / d / "mini").mkdir(parents=True, exist_ok=True)
            gild(Image.open(path), True).save(SRC / "shiny" / d / path.name)
            mini = SRC / d / "mini" / path.name
            gild(Image.open(mini), False).save(SRC / "shiny" / d / "mini" / path.name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", help="page 7 of the Ranemon sheet, as an image")
    parser.add_argument("--shiny-only", action="store_true", help="only rebuild the shiny sprites")
    args = parser.parse_args()
    if args.shiny_only:
        shinies()
        return
    for d in ("bw", "bw/mini", "evo", "evo/mini"):
        (SRC / d).mkdir(parents=True, exist_ok=True)
    for path in sorted(SRC.glob("*.png")):
        im = Image.open(path)
        mini = im
        if path.stem in HD:
            size, colours, (x, y, w) = HD[path.stem]
            big = outline(TOUCH_UP.get(path.stem, lambda b: b)(pixelate(im, size, colours)))
            mini = im.crop((x, y, x + w, y + w))
        else:
            big = pixelate(im, SIZE)
        if path.stem in LEGENDARY:
            big = legend(big, LEGENDARY[path.stem])
        if path.stem in GLOW:
            glow = aura(big, TYPE_COLOUR[GLOW[path.stem]])
            glow.alpha_composite(big)
            big = glow
        big.save(SRC / "bw" / path.name)
        outline(pixelate(mini, 40, 28)).save(SRC / "bw/mini" / path.name)
    for evo, (base, kind) in EVOLUTIONS.items():
        im = evolve(evo, base, kind)
        im.save(SRC / "evo" / f"{evo}.png")
        outline(pixelate(im, 40, 28)).save(SRC / "evo/mini" / f"{evo}.png")
    if args.sheet:
        photo = Image.open(args.sheet).convert("RGBA").crop((130, 170, 730, 470))
        outline(pixelate(photo, 160, 48)).save(SRC / "bw/bns.png")
    shinies()


if __name__ == "__main__":
    main()
