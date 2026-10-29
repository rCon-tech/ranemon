"""Puts the drawn lads and their evolutions in the game: the UK forms (`src/lib/battle/uk.ts`).

    python3 scripts/drawn/game.py

For every Ranemon already in public/sprites/drawn/ it draws the front again (`roster.py` for the
lads, `evolved.py` for the evolutions) and writes the front, the shiny front, the follower and the
shiny follower. The Megas (`mega.py`), the London Ranemon (`london.py`) and the footballers
(`footballers.py`) write their own.
"""

from pathlib import Path

import evolved
import kit
import roster

PUBLIC = Path(__file__).resolve().parents[2] / "public" / "sprites"


def main():
    ids = sorted(p.stem for p in (PUBLIC / "drawn").glob("*.png"))
    for id in ids:
        f = kit.front(roster.LOOKS[id]) if id in roster.LOOKS else evolved.draw(id)[0]
        f.save(PUBLIC / "drawn" / f"{id}.png")
        kit.sprites.gild(f, True).save(PUBLIC / "shiny" / "drawn" / f"{id}.png")
        m = kit.mini(f)
        m.save(PUBLIC / "drawn" / "mini" / f"{id}.png")
        kit.sprites.gild(m, False).save(PUBLIC / "shiny" / "drawn" / "mini" / f"{id}.png")
    print(f"Drew {len(ids)}: {', '.join(ids)}")


if __name__ == "__main__":
    main()
