import Link from 'next/link';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { ROSTER } from '@/lib/battle/roster';
import { SHINY_ODDS, shinyChance, shinyForm } from '@/lib/story/shiny';
import { TYPE_COLOR, TYPE_LABEL, TYPES, typeMultiplier, type RaneType } from '@/lib/battle/types';

export const metadata = { title: 'How to play' };

/** What each type is like, in a line. */
const TYPE_NOTE: Record<RaneType, string> = {
  brains: 'The clever ones. Out-think Brawn and Chill.',
  brawn: 'The strong ones. Flatten Chaos and Charm.',
  chaos: 'The unpredictable ones. Rattle Chill and Hype.',
  chill: 'The laid-back ones. Shrug off Charm and Brains.',
  charm: 'The smooth talkers. Win over Hype and Brawn.',
  hype: 'The loud ones. Drown out Brains and Chaos.',
};

const strongAgainst = (t: RaneType) => TYPES.filter((d) => typeMultiplier(t, d) === 2);
const weakAgainst = (t: RaneType) => TYPES.filter((d) => typeMultiplier(t, d) === 0.5);
const fearOf = (t: RaneType) => TYPES.filter((a) => typeMultiplier(a, t) === 2);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dialog flex flex-col gap-2 p-3 text-[12px] leading-relaxed">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function Guide() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-dex px-3 py-2 text-[18px] font-bold text-paper [text-shadow:1px_1px_0_rgb(0_0_0/0.4)]">
        <h1>HOW TO PLAY</h1>
        <Link href="/" className="text-[11px] underline underline-offset-4">
          BACK
        </Link>
      </div>

      <Section title="The game">
        <p>
          Ranemon is a monster-battling game where every monster is one of the lads. Each Ranemon
          has a type, five stats, four moves and one special move nobody else can use.
        </p>
        <ul className="list-disc pl-4">
          <li>
            <b>Battle</b> (PRESS START): pick 6 of the 16 Ranemon in 90 seconds. Your rival gets 6
            of the rest. You fight 6 against 6 until one side has nobody left standing.
          </li>
          <li>
            <b>Story mode</b>: walk from Co. Clare to Trinity College Dublin, catch Ranemon, beat
            nine county gyms and take on B&amp;S.
          </li>
          <li>
            <b>Ranedex</b>: every Ranemon and its evolution, with types, stats and moves.
          </li>
        </ul>
      </Section>

      <Section title="Types">
        <p>
          There are six types, and they’re personalities rather than elements. Every type hits two
          types hard, and two types shrug it off. Nothing is the obvious pick.
        </p>
        <ul className="flex flex-col gap-2">
          {TYPES.map((t) => (
            <li key={t} className="flex flex-col gap-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={t} /> {TYPE_NOTE[t]}
              </span>
              <span className="opacity-80">
                Strong against{' '}
                {strongAgainst(t)
                  .map((d) => TYPE_LABEL[d])
                  .join(' and ')}
                . Weak against{' '}
                {weakAgainst(t)
                  .map((d) => TYPE_LABEL[d])
                  .join(' and ')}
                . Watch out for{' '}
                {fearOf(t)
                  .map((d) => TYPE_LABEL[d])
                  .join(' and ')}
                .
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type match-ups">
        <p>
          Find the attacking move’s type on the left and the defender’s type along the top. 2× is
          super effective, ½ is not very effective.
        </p>
        <div className="overflow-x-auto">
          <table className="border-collapse text-center text-[10px]" data-testid="type-chart">
            <thead>
              <tr>
                <th className="p-1 text-left">ATK ↓ DEF →</th>
                {TYPES.map((d) => (
                  <th key={d} className="p-1" style={{ color: TYPE_COLOR[d] }}>
                    {TYPE_LABEL[d].slice(0, 5).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((a) => (
                <tr key={a}>
                  <th className="p-1 text-left" style={{ color: TYPE_COLOR[a] }}>
                    {TYPE_LABEL[a].toUpperCase()}
                  </th>
                  {TYPES.map((d) => {
                    const m = typeMultiplier(a, d);
                    return (
                      <td
                        key={d}
                        className="min-w-8 border border-frame p-1 font-bold"
                        style={{
                          background: m === 2 ? '#c8f0b0' : m === 0.5 ? '#f8c8c0' : 'transparent',
                        }}
                      >
                        {m === 2 ? '2×' : m === 0.5 ? '½' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          A Ranemon with two types takes both multipliers, so a hit can be 4×, 2×, 1×, ½ or ¼. Moves
          of a Ranemon’s own type get a 1.5× bonus.
        </p>
      </Section>

      <Section title="Battles">
        <ul className="list-disc pl-4">
          <li>
            Each turn you pick a move, swap Ranemon, use an item (story mode) or run. Switching
            always goes first, then faster moves, then the faster Ranemon.
          </li>
          <li>
            <b>Stats</b>: HP is how much it can take, ATK how hard its physical moves hit, DEF how
            well it takes them, SPI (Spirit) powers its other moves and guards against them, and SPD
            decides who goes first.
          </li>
          <li>
            Moves have PP, so they run out. A Ranemon with no PP left will flail. One hit in 24 is a
            critical hit for 1.5×.
          </li>
          <li>
            <b>Special moves</b> (★): every Ranemon has its own, from level 1. Their boosts last
            until it switches out.
          </li>
          <li>
            <b>Statuses</b>: <i>Flustered</i> halves Speed and sometimes loses a turn. <i>Hangry</i>{' '}
            halves Attack and costs 1/16 of HP each turn. <i>Asleep</i> can’t move for 1 to 3 turns.
          </li>
          <li>In battle mode you have 45 seconds a turn, or a random move is picked for you.</li>
        </ul>
      </Section>

      <Section title="Story mode">
        <ul className="list-disc pl-4">
          <li>
            <b>Controls</b>: the D-pad or arrow keys walk. A (or Z) talks, reads and interacts. B
            (or X) goes back, and holding it rides the bike once you have one. START (or Enter)
            opens the menu.
          </li>
          <li>
            <b>Start</b>: enter your trainer name. Use the same name to carry on later. Michael D
            gives you your first Ranemon at the old farm.
          </li>
          <li>
            <b>Catching</b>: walk in long grass or bog to meet wild Ranemon. Weaken one, then throw
            a Pint of Guinness. The weaker it is, the better your chances. You keep 6 in your party
            and the rest go to the Group Chat.
          </li>
          <li>
            <b>McGrattans</b> is the pub in every town. Dua Lipa heals your whole party for free. If
            everyone faints, you wake up in the last McGrattans you visited with a bar tab.
          </li>
          <li>
            <b>Vapes</b> is the shop. It sells pints, healing items and more, with better stock
            further along the road. It sells vapes too: use one in battle to raise a stat of the
            Ranemon that’s out, like Watermelon Ice for DEFENSE. They wear off after the battle.
          </li>
          <li>
            <b>Gyms</b>: beat each county’s gym leader for the county jersey. The Garda at the
            county line won’t let you through without it.
          </li>
          <li>
            <b>Levels</b>: Ranemon earn EXP from battles. A Blue Ghost gives one level straight
            away. Every Ranemon evolves once, at level 30.
          </li>
          <li>
            <b>Town Map</b>: pick MAP from the START menu, tap the place name at the top of the
            screen, or press M. It shows the road from Clare to Dublin, the towns you’ve been to,
            the jerseys you’ve won and where you are now.
          </li>
          <li>
            <b>Moves</b>: every Ranemon learns 6 sport moves as it levels up, from soccer, rugby,
            padel, golf, video games and F1. It fights with 4 at a time. When it learns a fifth,
            open PARTY, tap the Ranemon, tap the move to drop, then tap the new one.
          </li>
          <li>
            <b>Exp Share</b> is in the START menu, and starts off. Turn it on and every Ranemon in
            your party that’s still standing gets the same EXP as the one that fought, so the whole
            team levels up together. Turn it off to train one Ranemon at a time.
          </li>
          <li>
            <b>Legends</b>: the locals in Dublin tell an old story about a Ranemon nobody has seen
            in years. Some say it was never real. Listen to them, and you might find out.
          </li>
          <li>
            <b>Donegal</b>: the conductor in Dublin runs a train to Bundoran. Have a chat with Josh
            Lee down by the waves. He knows something about the sea that nobody else does.
          </li>
          <li>
            <b>Norm</b>: Sibeal in Limerick will lend you her dog. Norm walks behind you instead of
            your Ranemon, never fights, and every so often finds you something. Give him back to
            Sibeal in any McGrattans.
          </li>
          <li>
            <b>Your rival</b> is Margaret Thatcher, who picks the Ranemon that beats yours and turns
            up all along the road. Don’t let her win.
          </li>
          <li>
            The game saves as you go. The ▶ button at the top of the map and in battles speeds the
            whole game up to 2× or 4×.
          </li>
        </ul>
      </Section>

      <Section title="Shiny Ranemon">
        <div className="flex items-end justify-center gap-4" aria-hidden>
          <span className="flex flex-col items-center gap-1 text-[10px]">
            <span className="h-16 w-16">
              <Sprite creature={ROSTER[0]} />
            </span>
            {ROSTER[0].name}
          </span>
          <span className="flex flex-col items-center gap-1 text-[10px]">
            <span className="h-16 w-16">
              <Sprite creature={shinyForm(ROSTER[0])} />
            </span>
            <span>
              <span className="shiny-name">★</span>
              {ROSTER[0].name}
            </span>
          </span>
        </div>
        <ul className="list-disc pl-4">
          <li>
            Very rarely, a wild Ranemon is <b>shiny</b>: golden all over, ringed in gold and
            sparkling. Only 1 wild Ranemon in {SHINY_ODDS} is. Over a whole run of about 150 wild
            battles that’s roughly a {Math.round(shinyChance(150) * 100)}% chance of seeing even
            one, so most players never will.
          </li>
          <li>
            You can’t miss one. The screen flashes gold, it bursts into sparkles as it comes in, the
            text says “A shiny … appeared!”, and its name has a gold ★.
          </li>
          <li>
            Befriend it and it’s yours for good. It keeps its ★ in your party, the Group Chat and
            the Ranedex, follows you in gold, and stays shiny when it evolves.
          </li>
          <li>Shinies have the same stats and moves as any other. They’re for bragging rights.</li>
        </ul>
      </Section>
    </div>
  );
}
