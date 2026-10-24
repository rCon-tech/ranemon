# Drawn Ranemon: an experiment

Today every Ranemon's sprite is its friend's photo, cut out and shrunk to a palette (`scripts/sprites.py`). This experiment draws one as pixel art instead, the way the handhelds' sprites look, using the photo only as reference. The worked example is **Cholokill** (Killemon given the Flannel Shirt), whose photo is the bald, bearded lad in the green flannel in the pub.

## What's in it

- `scripts/drawn_cholokill.py` draws him at 96 pixels: a big bald head with a shine, the ginger beard, heavy-lidded eyes and a smirk, the flannel's check, the white tee under the open shirt, one hand on his hip and the other pointing at the foe (Whabam).
- A **back view of his own** for your side of the battle. The game has only ever mirrored the front; `Creature.backSprite` (and `Variant.backSprite`) now lets a sprite bring one, and anything without one is mirrored as before.
- His shiny front and back (the usual gold from `gild` in `sprites.py`) and a 40-pixel follower.
- It goes in as a third look, **Drawn**, beside Classic in `variants.ts`, so it's the same Ranemon with the same Hype type, stats, Whabam and moves.
- It stays flat in the 3D look (no `solid`).

## How it's drawn

Each part (legs, shoes, arms, shirt, tee, head, beard) is a simple shape with a three-tone colour ramp. The script then:

1. shades every part from the top left: a shadow band along its bottom-right edge, a dithered half-shadow inside that, and a highlight on the top-left edge;
2. darkens the pixels where a part sits in front of another, which gives the inner lines;
3. paints the face on top unshaded (eyes, lids, brows, nose, mouth, the head's shine);
4. puts the game's usual 1-pixel outline round the whole figure.

Patterns like the flannel come from a function of x and y, so a check, stripes or a logo print are a few lines.

## Making more

- **A body kit.** Most of the script is a chibi body: head, ears, torso, arms, legs and shoes at fixed spots. Pulling that into a module with options (build, head shape, hair or bald, beard, glasses, pose: hand on hip, pointing, thumbs up, holding something) makes a new Ranemon a short description: skin, hair and beard colours, outfit pattern, pose and one prop.
- **The photo gives the colours.** Skin, hair and clothing colours can be sampled from the cut-outs `sprites.py` already makes, then checked by eye.
- **A sheet to approve.** Each one gets a contact sheet (photo, front, back, shiny, follower) to approve before it goes in, like the friend's approval in the Creature Studio plan.
- **Effort.** With the kit, a new one is a description plus a round or two of touch-ups. Without it, like this one, it's mostly placing shapes by hand.
- **Where they go.** Either as a Drawn look beside the photo (as here, nothing else changes), or replacing the photo as the Classic look, line by line. Evolutions would then want drawn costume pieces, instead of the ones `evolve()` lays over a photo.

Not done yet: evolved costumes for drawn sprites, the type glow evolved forms have, and a solid 3D figure.
