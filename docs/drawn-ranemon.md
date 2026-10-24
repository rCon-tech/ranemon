# Drawn Ranemon

Today every Ranemon's sprite is its friend's photo, cut out and shrunk to a palette (`scripts/sprites.py`). These are the same Ranemon drawn as pixel art, the way the handhelds' sprites look, using the photos only as reference. They're for a later update and **not in the game yet**: they live in `art/drawn/`, outside `public/`, and nothing in `src/` uses them.

## What's there

For each of the 20 lads, Petchemon, Tobymon and Cholokill (Poseidon is already pixel art), `art/drawn/` has:

- `<id>.png`, the front (the foe's view), 96 pixels like the other sprites;
- `<id>-back.png`, a back view of its own for your side of the battle, bigger and cut off at the bottom like the handhelds' back sprites (the game mirrors the front today);
- `shiny/<id>.png` and `shiny/<id>-back.png`, in the usual gold (`gild` in `scripts/sprites.py`);
- `mini/<id>.png`, the follower for story mode.

`overview.png` has every front and back in a grid, and `sheet.png` puts each photo beside its drawings.

Rebuild them all with `python3 scripts/drawn/roster.py`, or one with `python3 scripts/drawn/roster.py carlmon`.

## How they're drawn

`scripts/drawn/kit.py` is a body kit: the same chibi body (a big head on a small body) for everyone, dressed from a `Look`:

- skin; hair (bald, short, slick, swept, quiff, messy, curly, long) and its colour;
- facial hair (stubble, beard, big beard, goatee, moustache, big moustache);
- eyes (open, heavy lids, happy, shades with a lens colour, glasses, round glasses, looking down) and mouth (smile, grin, laugh, smirk, flat);
- a hat (cap, trilby with a band, fila, headphones);
- the top: what's underneath and what's over it (an open shirt, a zipped jacket, a blazer, a gown), the neck (crew, collar, roll-neck, V, hood), short or long sleeves, a tie, bow tie, scarf or hood trim, and patterns (a check, stripes, flecks);
- a pose (arms down, hands on hips, arms folded, pointing, hand at the chin, holding something, a hand raised, both hands holding something, both hands at the mouth) and props (a fish, a stein, a can, a glass of red, a fake moustache, shades on the collar, a tricolour pin, chef's buttons, beads, a tattoo, a logo).

Each part is a shape with a three-tone colour ramp. The kit shades every part from the top left (a shadow band, a dithered half-shadow and a highlight), darkens the pixels where a part sits in front of another for the inner lines, paints the face on top and puts the game's 1-pixel outline round it.

`scripts/drawn/roster.py` describes each Ranemon in a few lines. A new one is a new entry there.

## Putting them in the game later

- **As a look**: add a variant (`variants.ts`) whose sprite is the drawn front, so it sits beside the photo. A back view needs `backSprite` on the creature and in `Sprite.tsx` (an earlier version of this branch did that for Cholokill).
- **Instead of the photos**: copy the files into `public/sprites/bw/` (and `shiny/`, `mini/`) under the Ranemon's own names.
- **Not done yet**: the evolved forms (they'd want drawn costume pieces in place of the ones `evolve()` lays over a photo), the second looks, the type glow on evolved forms, B&S, and solid 3D figures.
