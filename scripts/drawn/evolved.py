"""The evolved forms, drawn: each drawn Ranemon with its evolution's costume drawn into the body
(`costumes.py`) and its type glow. Not in the game yet: they go to art/drawn/
beside the base forms.

    python3 scripts/drawn/evolved.py           # every evolved form
    python3 scripts/drawn/evolved.py carlizard # just one

Cholokill has a drawing of his own in roster.py. Writes the same files as roster.py for each, and
evolved.png with each base form beside its evolution, front and back.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

from dataclasses import replace

import kit
import roster
from costumes import COSTUMES
from kit import SIZE, sprites

OUT = roster.OUT


def glow(figure: Image.Image, kind: str) -> Image.Image:
    out = sprites.aura(figure, sprites.TYPE_COLOUR[kind])
    out.alpha_composite(figure)
    return out


def decks(evo: str, figure: Image.Image, head, kind: str) -> Image.Image:
    """CrampsB2BThilomon's decks and notes, as the photo version has them."""
    behind = Image.new("RGBA", (SIZE, SIZE))
    front = Image.new("RGBA", (SIZE, SIZE))
    sprites.costume(evo, ImageDraw.Draw(front), ImageDraw.Draw(behind), head, 82)
    return glow(sprites.outline(Image.alpha_composite(Image.alpha_composite(behind, figure), front)), kind)


def duo(left: Image.Image, right: Image.Image) -> Image.Image:
    """Two drawn figures back to back, each shrunk to two thirds, the partner just behind."""
    size = SIZE * 2 // 3
    canvas = Image.new("RGBA", (SIZE, SIZE))
    r = right.resize((size, size), Image.NEAREST)
    l = left.resize((size, size), Image.NEAREST).transpose(Image.FLIP_LEFT_RIGHT)
    canvas.alpha_composite(r, (SIZE - size, SIZE - size))
    canvas.alpha_composite(l, (0, SIZE - size))
    return canvas


def draw(evo: str) -> tuple[Image.Image, Image.Image]:
    base, kind = sprites.EVOLUTIONS[evo]
    look = roster.LOOKS[base]
    partner = sprites.DUOS.get(evo)
    if partner:
        other = roster.LOOKS[partner]
        f = duo(kit.front(look), kit.front(other))
        b = duo(kit.back(other), kit.back(look))
        return decks(evo, f, (48, 34, 14), kind), decks(evo, b, (48, 38, 14), kind)
    changes, extras = COSTUMES[evo]
    dressed = replace(look, extras=extras, **changes)
    return glow(kit.front(dressed), kind), glow(kit.back(dressed), kind)


def sheet(evos):
    """Each base form's front and back beside its evolution's, three times the size."""
    cell, pad, label, cols = 192, 8, 18, 2
    rows = (len(evos) + cols - 1) // cols
    w = cols * (4 * cell + pad * 3)
    out = Image.new("RGB", (w, rows * (cell + label + pad)), (226, 232, 240))
    d = ImageDraw.Draw(out)
    for i, evo in enumerate(evos):
        base = sprites.EVOLUTIONS[evo][0]
        x = (i % cols) * (4 * cell + pad * 3) + pad
        y = (i // cols) * (cell + label + pad) + pad
        names = (f"{base}.png", f"{base}-back.png", f"{evo}.png", f"{evo}-back.png")
        for j, n in enumerate(names):
            im = Image.open(OUT / n).convert("RGBA").resize((cell, cell), Image.NEAREST)
            out.paste(im, (x + j * cell, y), im)
        d.text((x + 2, y + cell + 2), f"{roster.NAMES.get(base, base.capitalize())}  >  {evo.capitalize()}",
               fill=(30, 30, 40))
    return out


def main(evos):
    for evo in evos:
        f, b = draw(evo)
        f.save(OUT / f"{evo}.png")
        b.save(OUT / f"{evo}-back.png")
        sprites.gild(f, True).save(OUT / "shiny" / f"{evo}.png")
        sprites.gild(b, True).save(OUT / "shiny" / f"{evo}-back.png")
        kit.mini(f).save(OUT / "mini" / f"{evo}.png")
    if len(evos) == len(ALL):
        sheet(ALL).save(OUT / "evolved.png")


# Every evolution by level; the second looks' ones come with the second looks.
ALL = [e for e in sprites.EVOLUTIONS if "-" not in e]

if __name__ == "__main__":
    main(sys.argv[1:] or ALL)
