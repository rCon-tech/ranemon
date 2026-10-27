"""Builds the Mega Evolutions' sprites (src/lib/battle/mega.ts) from the same photo cut-outs as
their evolved forms, in the same way as scripts/sprites.py: the photo, its evolution's costume,
then the Mega's own pieces over that, a two-tone glow (its type's colour outside, Mega pink
inside) and the Mega symbol in the corner.

    python3 scripts/mega.py

Writes public/sprites/mega/<form>.png for every look of each form (carlizard.png and
carlizard-tache.png, say), and the shiny ones under public/sprites/shiny/mega/.
"""

import math

from PIL import Image, ImageDraw

import sprites
from sprites import OUTLINE, SIZE, SRC, TYPE_COLOUR, aura, costume, flame, gild, head_of, outline, pixelate, poly, sparkle, spoon

OUT = SRC / "mega"
PINK = (232, 72, 176)
KEYSTONE = ((250, 240, 250), (150, 110, 230), (240, 120, 200))

MEGAS = ["conix", "hitmonollie", "carlizard", "steadakazam", "hitmonois", "lorchu", "clefenda"]


def blue_flame(d, x, y, s=1.0):
    poly(d, [(x, y), (x - 6 * s, y - 10 * s), (x - 2 * s, y - 9 * s), (x, y - 18 * s), (x + 3 * s, y - 9 * s),
             (x + 7 * s, y - 11 * s)], (56, 120, 248))
    poly(d, [(x, y - 1), (x - 3 * s, y - 7 * s), (x, y - 11 * s), (x + 3 * s, y - 7 * s)], (160, 224, 255))


def crystal(d, x, y, h, colour=(150, 200, 230)):
    poly(d, [(x, y - h), (x + 5, y - h // 2), (x + 3, y), (x - 3, y), (x - 5, y - h // 2)], colour)
    d.line([(x, y - h + 2), (x, y - 2)], fill=(232, 248, 255))


def bolt(d, x, y, s=1.0, colour=(248, 216, 40)):
    poly(d, [(x, y), (x + 8 * s, y - 10 * s), (x + 4 * s, y - 10 * s), (x + 12 * s, y - 22 * s), (x + 2 * s, y - 12 * s),
             (x + 6 * s, y - 12 * s), (x - 4 * s, y)], colour)


def mega_pieces(form: str, d: ImageDraw.ImageDraw, back: ImageDraw.ImageDraw, head):
    """What each Mega adds over its evolution's costume, after the Pokémon's own Mega forms."""
    cx, top, w = head
    if form == "carlizard":
        # Mega Charizard X: the wings go black with blue, and the flames burn blue.
        for s in (-1, 1):
            x0 = cx + s * 18
            pts = [(x0, top + 30), (x0 + s * 34, top - 2), (x0 + s * 40, top + 22), (x0 + s * 30, top + 28),
                   (x0 + s * 36, top + 44), (x0 + s * 22, top + 40), (x0 + s * 18, top + 52)]
            poly(back, pts, (44, 44, 60))
            poly(back, [(x0 + s * 4, top + 30), (x0 + s * 30, top + 6), (x0 + s * 28, top + 26)], (64, 168, 240))
        blue_flame(d, cx + w + 8, top + 22, 1.2)
        blue_flame(d, 10, SIZE - 6, 1.3)
        blue_flame(d, SIZE - 12, SIZE - 6, 1.4)
    elif form == "steadakazam":
        # Mega Alakazam: five spoons floating round it, and a red gem on the brow.
        for i in range(5):
            a = math.radians(200 + i * 35)
            spoon(back, int(cx + math.cos(a) * 40), int(top + 44 + math.sin(a) * 40), 1 if i < 2 else -1)
        d.ellipse([cx - 3, top + 4, cx + 3, top + 10], fill=(232, 48, 72), outline=OUTLINE)
    elif form == "clefenda":
        # A fairy's Mega: big pink wings and a ring of stars over the head.
        for s in (-1, 1):
            poly(back, [(cx + s * 16, top + 40), (cx + s * 46, top + 4), (cx + s * 44, top + 40),
                        (cx + s * 30, top + 58)], (252, 200, 228))
            poly(back, [(cx + s * 22, top + 40), (cx + s * 40, top + 16), (cx + s * 38, top + 40)], (240, 150, 200))
        for i in range(5):
            a = math.radians(-160 + i * 35)
            sparkle(d, int(cx + math.cos(a) * 22), int(top + 2 + math.sin(a) * 10), (255, 236, 120))
    elif form in ("hitmonois", "hitmonollie"):
        # Fighters' Megas: gloves and headband catch fire.
        for x in (8, SIZE - 8):
            flame(d, x, SIZE - 30, 1.0)
        flame(d, cx - w - 2, top + 14, 0.9)
        flame(d, cx + w + 4, top + 14, 0.9)
    elif form == "lorchu":
        # Mega Raichu: lightning all round, and a crackling tail.
        poly(back, [(cx + 12, SIZE - 10), (SIZE - 4, SIZE - 36), (SIZE - 14, SIZE - 38), (SIZE - 2, SIZE - 70),
                    (SIZE - 22, SIZE - 40), (SIZE - 12, SIZE - 40), (cx + 4, SIZE - 12)], (232, 152, 40))
        for x, y in ((4, 28), (6, 60), (SIZE - 26, 22)):
            bolt(d, x, y, 1.0)
    elif form == "conix":
        # Mega Steelix: crystal shards breaking out of the rock.
        for x, y, h in ((10, 40, 16), (6, 64, 20), (SIZE - 10, 40, 16), (SIZE - 6, 64, 20), (cx - 10, top, 12),
                        (cx + 10, top, 12)):
            crystal(back, x, y, h)
    elif form == "cholokill":
        # Cholokill's Mega: the flannel goes up in flames, and stars burst where it points.
        for x, y in ((10, SIZE - 4), (SIZE - 10, SIZE - 4), (8, 50), (SIZE - 8, 50)):
            flame(back, x, y, 1.2)
        for x, y in ((14, 18), (SIZE - 16, 14), (24, 40)):
            sparkle(d, x, y, (255, 236, 120))


def symbol(d: ImageDraw.ImageDraw, x: int, y: int):
    """The Mega symbol: a keystone in a ring, with a swirl of colour through it."""
    white, purple, pink = KEYSTONE
    d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=purple, outline=OUTLINE)
    d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=white, outline=OUTLINE)
    d.arc([x - 4, y - 4, x + 4, y + 4], 200, 360, fill=pink, width=2)
    d.point((x - 1, y - 1), fill=(255, 255, 255))


def megafy(figure: Image.Image, kind: str) -> Image.Image:
    """Two glows, the type's outside and Mega pink inside, the figure, and the symbol."""
    out = aura(figure, TYPE_COLOUR[kind])
    out.alpha_composite(aura(figure.filter(sprites.ImageFilter.MinFilter(5)), PINK))
    out.alpha_composite(figure)
    k = out.width // SIZE
    mark = Image.new("RGBA", (SIZE, SIZE))
    symbol(ImageDraw.Draw(mark), 9, 9)
    out.alpha_composite(mark.resize(out.size, Image.NEAREST) if k > 1 else mark)
    return out


def mega(look: str, base: str, kind: str) -> Image.Image:
    """A look of an evolved form, as `sprites.evolve` draws it, with its Mega pieces."""
    form = look.split("-")[0]
    photo = Image.open(SRC / f"{base}.png").convert("RGBA")
    body_w = 82
    canvas = Image.new("RGBA", (SIZE, SIZE))
    body = pixelate(photo, body_w)
    canvas.paste(body, ((SIZE - body_w) // 2, SIZE - body.height), body)
    behind = Image.new("RGBA", (SIZE, SIZE))
    front = Image.new("RGBA", (SIZE, SIZE))
    head = sprites.HEADS.get(look) or head_of(canvas)
    # The Mega's pieces go over its evolution's, so Mega Carlizard's black wings cover the orange.
    costume(form, ImageDraw.Draw(front), ImageDraw.Draw(behind), head, body_w)
    mega_pieces(form, ImageDraw.Draw(front), ImageDraw.Draw(behind), head)
    figure = Image.alpha_composite(behind, canvas)
    figure = outline(Image.alpha_composite(figure, front))
    return megafy(figure, kind)


def cholokill() -> Image.Image:
    """Cholokill is HD, from his own photo: his pieces are drawn at 96 and doubled."""
    big = Image.open(SRC / "bw" / "cholokill.png").convert("RGBA")
    # His bw sprite already has a glow: take the figure from the photo again, as sprites.py does.
    size, colours, _ = sprites.HD["cholokill"]
    figure = outline(pixelate(Image.open(SRC / "cholokill.png").convert("RGBA"), size, colours))
    behind = Image.new("RGBA", (SIZE, SIZE))
    front = Image.new("RGBA", (SIZE, SIZE))
    mega_pieces("cholokill", ImageDraw.Draw(front), ImageDraw.Draw(behind), (SIZE // 2, 4, 12))
    up = lambda im: im.resize(big.size, Image.NEAREST)  # noqa: E731
    out = up(behind)
    out.alpha_composite(figure)
    out.alpha_composite(up(front))
    return megafy(outline(out), sprites.GLOW["cholokill"])


def main():
    (OUT).mkdir(parents=True, exist_ok=True)
    (SRC / "shiny" / "mega").mkdir(parents=True, exist_ok=True)
    looks = {look: v for look, v in sprites.EVOLUTIONS.items() if look.split("-")[0] in MEGAS}
    made = {look: mega(look, base, kind) for look, (base, kind) in looks.items()}
    made["cholokill"] = cholokill()
    for look, im in made.items():
        im.save(OUT / f"{look}.png")
        gild(im, True).save(SRC / "shiny" / "mega" / f"{look}.png")
    print(f"Made {len(made)} Mega sprites: {', '.join(sorted(made))}")


if __name__ == "__main__":
    main()
