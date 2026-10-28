'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { BattleScreen, type BagEntry } from '@/components/BattleScreen';
import { useMusic, SoundButton } from '@/components/Sound';
import { SpeedButton } from '@/components/SpeedButton';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { MoveCard } from '@/components/MoveCard';
import { MemberRow, MovesPanel, Panel } from '@/components/story/Panels';
import { moveById } from '@/lib/battle/moves';
import type { BattleInput } from '@/lib/sesh/battle';
import {
  battleOf,
  bossNext,
  choices,
  freshSeed,
  mapOf,
  newRun,
  offieStock,
  play,
  restMoves,
  scoreOf,
  stageOf,
  type SeshAction,
  type SeshRun,
} from '@/lib/sesh/run';
import { bossAt } from '@/lib/sesh/foes';
import {
  lastSeshPlayer,
  loadBests,
  loadSesh,
  recordBest,
  storeSesh,
  type SeshBest,
  type SeshSave,
} from '@/lib/sesh/save';
import { QUICK_STAGES } from '@/lib/sesh/stages';
import { ownSpeed } from '@/lib/speed';
import { playSfx } from '@/lib/sound/engine';
import { canUseOn, holdsItem, ITEMS, itemById, type ItemId } from '@/lib/story/items';
import {
  creatureOf,
  expProgress,
  nameOf,
  speciesById,
  statsOf,
  type Member,
} from '@/lib/story/party';
import { NODE_LOOK, SeshMap } from './SeshMap';

const euro = (n: number) => `€${n.toLocaleString('en-IE')}`;
const noSubscribe = () => () => {};

/** The bag as the battle screen shows it: food and vapes. */
function battleBag(bag: SeshRun['bag']): BagEntry[] {
  return ITEMS.filter(
    (i) => (bag[i.id] ?? 0) > 0 && (i.use.kind === 'heal' || i.use.kind === 'vape'),
  ).map((i) => ({ id: i.id, name: i.name, count: bag[i.id]!, use: i.use, about: i.about }));
}

/** A box of lines to tap through, over whatever's on screen. */
function Lines({ lines, onNext }: { lines: string[]; onNext: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <button
        type="button"
        className="dialog min-h-[76px] w-full px-4 py-3 text-left text-[14px] leading-[1.8]"
        onClick={onNext}
        data-testid="sesh-line"
      >
        {lines[0]}
        <span className="blink ml-1 inline-block">▼</span>
      </button>
    </div>
  );
}

/** A row of the party's faces with their HP, for the top of the map. */
function PartyStrip({ party, gone }: { party: Member[]; gone: Member[] }) {
  return (
    <div className="flex flex-wrap gap-1" aria-label="Your party">
      {party.map((m) => (
        <span key={m.uid} className="flex w-11 flex-col items-center" title={nameOf(m)}>
          <span className="h-9 w-9">
            <Sprite creature={creatureOf(m)} />
          </span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-bezel">
            <span
              className="block h-full rounded-full bg-hp-high"
              style={{ width: `${Math.round((m.hp / statsOf(m).hp) * 100)}%` }}
            />
          </span>
          <span className="text-[8px]">Lv{m.level}</span>
        </span>
      ))}
      {gone.map((m) => (
        <span
          key={m.uid}
          className="flex w-11 flex-col items-center opacity-30 grayscale"
          title={`${nameOf(m)}: gone home in a taxi`}
        >
          <span className="h-9 w-9">
            <Sprite creature={creatureOf(m)} />
          </span>
          <span className="text-[8px]">TAXI</span>
        </span>
      ))}
    </div>
  );
}

/** The party before the night starts: who you've been dealt. */
function PartyPreview({ run, onStart }: { run: SeshRun; onStart: () => void }) {
  return (
    <Panel title="YOUR PARTY TONIGHT">
      <p className="text-[11px] leading-relaxed">
        Six for the night, at Lv{run.party[0]?.level}. Anyone still fainted after a battle goes home
        in a taxi. Beat the boss at The Pub, The Nightclub and The Afterparty.
      </p>
      {run.party.map((m) => {
        const s = speciesById(m.species);
        return (
          <div key={m.uid} className="flex items-center gap-2 rounded border-2 border-bezel p-1.5">
            <span className="h-12 w-12 shrink-0">
              <Sprite creature={creatureOf(m)} />
            </span>
            <span className="flex flex-1 flex-col gap-1 text-[11px]">
              <span>
                {nameOf(m)} Lv{m.level}
              </span>
              <span className="flex gap-1">
                {s.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
              {m.held && (
                <span className="text-[9px] opacity-80">Holding {itemById(m.held).name}</span>
              )}
            </span>
          </div>
        );
      })}
      <button
        type="button"
        className="pixel-btn menu-item mt-1 text-[15px]"
        data-cmd="fight"
        onClick={onStart}
        data-testid="sesh-go"
      >
        START THE NIGHT
      </button>
    </Panel>
  );
}

/** PARTY outside battle: who's out, their moves, and what they're holding. */
function PartyOverlay({
  run,
  act,
  onClose,
}: {
  run: SeshRun;
  act: (a: SeshAction) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [moves, setMoves] = useState(false);
  const m = run.party.find((p) => p.uid === open);
  if (m && moves) {
    return (
      <MovesPanel
        m={m}
        onSwap={(slot, move) => act({ kind: 'swap', uid: m.uid, slot, move })}
        onClose={() => setMoves(false)}
      />
    );
  }
  if (m) {
    const max = statsOf(m).hp;
    return (
      <Panel title={nameOf(m).toUpperCase()} onClose={() => setOpen(null)}>
        <div className="flex items-center gap-2">
          <span className="h-14 w-14 shrink-0">
            <Sprite creature={creatureOf(m)} />
          </span>
          <span className="flex flex-col gap-1 text-[11px]">
            <span>
              Lv{m.level} · HP {m.hp}/{max}
              {m.status ? ` · ${m.status.toUpperCase()}` : ''}
            </span>
            <span className="flex gap-1">
              {speciesById(m.species).types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </span>
            <span className="text-[9px]">
              {m.held ? `Holding ${itemById(m.held).name}` : 'Holding nothing'}
            </span>
          </span>
        </div>
        {m.moves.map((id, j) => (
          <MoveCard
            key={id}
            id={id}
            pp={m.pp[j]}
            stab={speciesById(m.species).types.includes(moveById(id).type!)}
          />
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="pixel-btn text-[12px]" onClick={() => setMoves(true)}>
            SWAP MOVES
          </button>
          <button
            type="button"
            className="pixel-btn text-[12px]"
            disabled={!m.held}
            onClick={() => act({ kind: 'unhold', uid: m.uid })}
          >
            TAKE ITEM BACK
          </button>
        </div>
      </Panel>
    );
  }
  return (
    <Panel title="PARTY" onClose={onClose}>
      {run.party.map((p) => (
        <MemberRow key={p.uid} m={p} onClick={() => setOpen(p.uid)} />
      ))}
      {run.gone.length > 0 && (
        <p className="text-[10px] leading-relaxed opacity-70">
          Gone home in a taxi: {run.gone.map(nameOf).join(', ')}.
        </p>
      )}
    </Panel>
  );
}

/** The BAG outside battle: food, Blue Ghosts and things to hold, used on someone. */
function BagOverlay({
  run,
  act,
  onClose,
}: {
  run: SeshRun;
  act: (a: SeshAction) => void;
  onClose: () => void;
}) {
  const [pick, setPick] = useState<ItemId | null>(null);
  const items = ITEMS.filter((i) => (run.bag[i.id] ?? 0) > 0);
  if (pick) {
    const item = itemById(pick);
    return (
      <Panel title={item.name.toUpperCase()} onClose={() => setPick(null)}>
        <p className="text-[11px] leading-relaxed">{item.about}</p>
        <p className="text-[11px]">Use it on which Ranemon?</p>
        {run.party.map((m) => {
          const ok =
            (item.use.kind === 'hold' && holdsItem(item, m.species)) ||
            (item.use.kind !== 'hold' &&
              !(item.use.kind === 'heal' && item.use.effect.kind === 'revive') &&
              item.use.kind !== 'vape' &&
              canUseOn(item, m));
          return (
            <MemberRow
              key={m.uid}
              m={m}
              disabled={!ok}
              onClick={() => {
                act({ kind: 'use', item: pick, uid: m.uid });
                if ((run.bag[pick] ?? 0) <= 1) setPick(null);
              }}
            />
          );
        })}
      </Panel>
    );
  }
  return (
    <Panel title="BAG" onClose={onClose}>
      <p className="text-[11px]">Cash: {euro(run.cash)}</p>
      {items.length === 0 && <p className="text-[11px]">The bag is empty.</p>}
      {items.map((i) => {
        const inBattle =
          i.use.kind === 'vape' || (i.use.kind === 'heal' && i.use.effect.kind === 'revive');
        return (
          <button
            key={i.id}
            type="button"
            className="pixel-btn flex flex-col gap-0.5 text-left text-[12px]"
            disabled={inBattle}
            onClick={() => setPick(i.id)}
          >
            <span className="flex justify-between">
              <span>{i.name}</span>
              <span>×{run.bag[i.id]}</span>
            </span>
            <span className="text-[9px] opacity-75">
              {inBattle ? 'Use it in a battle.' : i.about}
            </span>
          </button>
        );
      })}
    </Panel>
  );
}

/** The Offie: buy what's on the shelves, then go on. */
function Offie({ run, act }: { run: SeshRun; act: (a: SeshAction) => void }) {
  const stock = offieStock(run);
  return (
    <Panel title="THE OFFIE">
      <p className="text-[11px] leading-relaxed">
        The off-licence is still open. You’ve {euro(run.cash)}.
      </p>
      {stock.map((id) => {
        const item = itemById(id);
        return (
          <button
            key={id}
            type="button"
            className="pixel-btn flex flex-col gap-0.5 text-left text-[12px]"
            disabled={run.cash < item.price!}
            onClick={() => act({ kind: 'buy', item: id })}
            data-testid={`buy-${id}`}
          >
            <span className="flex justify-between">
              <span>{item.name}</span>
              <span>{euro(item.price!)}</span>
            </span>
            <span className="text-[9px] opacity-75">
              {item.about} You have {run.bag[id] ?? 0}.
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="pixel-btn menu-item mt-1"
        onClick={() => act({ kind: 'leave' })}
        data-testid="leave-offie"
      >
        BACK OUT INTO THE NIGHT
      </button>
    </Panel>
  );
}

/** The Smoking Area: heal the party, learn a move, or a Blue Ghost. */
function SmokingArea({ run, act }: { run: SeshRun; act: (a: SeshAction) => void }) {
  const [learning, setLearning] = useState<number | null>(null);
  const [move, setMove] = useState<string | null>(null);
  const m = run.party.find((p) => p.uid === learning);
  if (m && move) {
    return (
      <Panel title="LEARN A MOVE" onClose={() => setMove(null)}>
        <p className="text-[11px] leading-relaxed">
          Which move should {nameOf(m)} forget for {moveById(move).name}?
        </p>
        {m.moves.map((id, slot) => (
          <MoveCard
            key={id}
            id={id}
            pp={m.pp[slot]}
            stab={speciesById(m.species).types.includes(moveById(id).type!)}
            onClick={() => act({ kind: 'rest', choice: 'move', uid: m.uid, move, slot })}
          />
        ))}
      </Panel>
    );
  }
  if (m) {
    return (
      <Panel title="LEARN A MOVE" onClose={() => setLearning(null)}>
        <p className="text-[11px] leading-relaxed">
          Someone in the smoking area shows {nameOf(m)} a move. Pick one.
        </p>
        {restMoves(run, m).map((id) => (
          <MoveCard
            key={id}
            id={id}
            stab={speciesById(m.species).types.includes(moveById(id).type!)}
            onClick={() => setMove(id)}
          />
        ))}
      </Panel>
    );
  }
  return (
    <Panel title="THE SMOKING AREA">
      <p className="text-[11px] leading-relaxed">
        A sit-down outside under the heater. You’ve time for one thing.
      </p>
      <button
        type="button"
        className="pixel-btn menu-item flex flex-col gap-0.5"
        onClick={() => act({ kind: 'rest', choice: 'heal' })}
        data-testid="rest-heal"
      >
        <span>HEAL THE PARTY</span>
        <span className="text-[9px] opacity-75">
          Full HP, PP and no status for everyone still out.
        </span>
      </button>
      <button
        type="button"
        className="pixel-btn menu-item flex flex-col gap-0.5"
        onClick={() => act({ kind: 'rest', choice: 'ghost' })}
        data-testid="rest-ghost"
      >
        <span>TAKE A BLUE GHOST</span>
        <span className="text-[9px] opacity-75">+1 level for one of the party, from the BAG.</span>
      </button>
      <h3 className="mt-1 text-[11px] font-bold">OR LEARN A MOVE</h3>
      {run.party.map((p) => (
        <MemberRow key={p.uid} m={p} onClick={() => setLearning(p.uid)} />
      ))}
    </Panel>
  );
}

/** Before a battle: who it is, and what they say. */
function Briefing({ run, onFight }: { run: SeshRun; onFight: () => void }) {
  const battle = battleOf(run)!;
  const { foe } = battle;
  const kind = foe.kind === 'boss' ? 'BOSS' : NODE_LOOK[foe.kind].label;
  return (
    <Panel title={`${kind}: ${foe.name.toUpperCase()}`}>
      <p className="dialog px-3 py-2 text-[13px] leading-[1.8]">{foe.before}</p>
      <p className="text-[11px]">
        {foe.name} has {foe.team.length} Ranemon
        {foe.kind === 'boss' ? `, the strongest at Lv${foe.team.at(-1)!.level}` : ''}.
        {foe.mega ? ' Their ace can Mega evolve.' : ''}
      </p>
      <div className="flex gap-1" aria-hidden>
        {foe.team.map((m) => (
          <span key={m.uid} className="h-3 w-3 rounded-full border-2 border-bezel bg-accent" />
        ))}
      </div>
      <button
        type="button"
        className="pixel-btn menu-item mt-2 text-[15px]"
        data-cmd="fight"
        onClick={onFight}
        data-testid="sesh-fight"
      >
        BATTLE!
      </button>
    </Panel>
  );
}

/** The results card: how the night went, the score, and PLAY AGAIN. */
function Results({
  run,
  bests,
  onAgain,
}: {
  run: SeshRun;
  bests: SeshBest[];
  onAgain: () => void;
}) {
  const won = run.over === 'won';
  return (
    <Panel title={won ? 'WHAT A NIGHT!' : 'HOME IN A TAXI'}>
      <p className="text-[12px] leading-relaxed" data-testid="sesh-result">
        {won
          ? 'You beat the boss at The Pub, The Nightclub and The Afterparty. Legend.'
          : `You got as far as ${QUICK_STAGES[Math.min(run.stage, QUICK_STAGES.length - 1)].name}.`}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <span className="dialog flex flex-col py-1">
          <span className="text-[18px] font-bold">
            {run.beaten}/{QUICK_STAGES.length}
          </span>
          BOSSES
        </span>
        <span className="dialog flex flex-col py-1">
          <span className="text-[18px] font-bold">{run.party.length}</span>
          STANDING
        </span>
        <span className="dialog flex flex-col py-1">
          <span className="text-[18px] font-bold">{run.turns}</span>
          TURNS
        </span>
      </div>
      <p className="text-center text-[14px] font-bold" data-testid="sesh-score">
        SCORE {scoreOf(run).toLocaleString('en-IE')}
      </p>
      <PartyStrip party={run.party} gone={run.gone} />
      {bests.length > 0 && (
        <>
          <h3 className="mt-1 text-[11px] font-bold">YOUR BEST NIGHTS</h3>
          <ol className="flex flex-col gap-0.5 text-[10px]">
            {bests.map((b, i) => (
              <li key={`${b.at}-${i}`} className="flex justify-between">
                <span>
                  {i + 1}. {b.beaten}/{QUICK_STAGES.length} bosses, {b.standing} standing
                </span>
                <span>{b.score.toLocaleString('en-IE')}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <button
        type="button"
        className="pixel-btn menu-item mt-1 text-[15px]"
        data-cmd="fight"
        onClick={onAgain}
        data-testid="sesh-again"
      >
        PLAY AGAIN
      </button>
      <Link href="/" className="text-center text-[11px] underline underline-offset-4">
        TITLE SCREEN
      </Link>
    </Panel>
  );
}

/**
 * The Sesh (`docs/sesh.md`): Quick Sesh, a roguelike night out with a random party. Its own
 * saves, its own speed (2× to start), and every screen in 2D, whatever look is picked.
 */
export function Sesh() {
  const remembered = useSyncExternalStore(noSubscribe, lastSeshPlayer, () => undefined);
  const [typed, setTyped] = useState<string | null>(null);
  const name = (typed ?? remembered ?? '').trim();
  /** The trainer playing, once they've started or carried on. */
  const [player, setPlayer] = useState<string | null>(null);
  const [save, setSave] = useState<SeshSave | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [briefed, setBriefed] = useState(false);
  const [overlay, setOverlay] = useState<'party' | 'bag' | 'quit' | null>(null);
  const [bests, setBests] = useState<SeshBest[]>([]);
  const [fightBag, setFightBag] = useState<SeshRun['bag']>({});

  // The Sesh plays at its own speed, 2× to start.
  useEffect(() => ownSpeed('sesh', 2), []);

  const run = save?.run ?? null;
  const fighting =
    !!run && !run.over && briefed && !!run.at && run.at !== 'offie' && run.at !== 'smoke';
  const stage = run && !run.over ? stageOf(run) : null;
  useMusic(fighting ? undefined : run?.over === 'won' ? 'victory' : (stage?.music ?? 'title'));

  // A battle starts from the node, so it's the same battle every time it's opened.
  const nodeKey = run ? `${run.stage}:${run.path.join('.')}:${run.at}` : '';
  const battle = useMemo(
    () => (run && !run.over && run.at ? battleOf(run) : null),
    // Only when you move to another node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeKey, run?.over],
  );

  const saved = name ? loadSesh(name) : null;
  const canContinue = !!saved && !saved.run.over;

  function begin(next: SeshSave, who: string) {
    setPlayer(who);
    setSave(next);
    setReady(next.actions.length > 0);
    setBriefed(false);
    setLines([]);
    setBests(loadBests(who));
  }

  function newGame() {
    if (!name) return;
    playSfx('select');
    const next: SeshSave = { v: 1, run: newRun(freshSeed()), actions: [] };
    storeSesh(name, next);
    begin(next, name);
  }

  function act(a: SeshAction) {
    if (!save || !player) return;
    let out: { run: SeshRun; lines: string[] };
    try {
      out = play(save.run, a);
    } catch (e) {
      setLines([e instanceof Error ? e.message : 'That can’t be done right now.']);
      return;
    }
    const next: SeshSave = { v: 1, run: out.run, actions: [...save.actions, a] };
    storeSesh(player, next);
    setSave(next);
    setLines(out.lines);
    if (out.run.over && !save.run.over) {
      setBests(
        recordBest(player, {
          score: scoreOf(out.run),
          beaten: out.run.beaten,
          standing: out.run.party.length,
          at: new Date().toISOString(),
        }),
      );
    }
  }

  function finishBattle(inputs: BattleInput[]) {
    setBriefed(false);
    act({ kind: 'battle', inputs });
  }

  // ---------- the start screen ----------
  if (remembered === undefined) return <div className="flex-1" />;
  if (!save || !player) {
    return (
      <div className="gb-body flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
        <SoundButton className="absolute right-2 top-2 z-10" />
        <h1 className="text-[40px] font-bold leading-none text-gold [-webkit-text-stroke:2px_#1c4f96]">
          QUICK SESH
        </h1>
        <p className="max-w-[320px] text-[12px] leading-relaxed text-[#e6e2ff]">
          A random party of six at Lv50 and the best part of the night: The Pub, The Nightclub and
          The Afterparty, with a boss at each. Anyone still fainted after a battle goes home in a
          taxi. About 20 minutes a run.
        </p>
        <form
          className="flex w-full max-w-[320px] flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canContinue && saved) begin(saved, name);
            else newGame();
          }}
        >
          <label className="flex flex-col gap-1 text-left text-[12px] text-[#e6e2ff]">
            TRAINER NAME
            <input
              className="dialog px-3 py-2 text-[16px] text-ink outline-none"
              value={typed ?? remembered ?? ''}
              maxLength={20}
              autoComplete="username"
              onChange={(e) => setTyped(e.target.value)}
              data-testid="sesh-name"
            />
          </label>
          {canContinue && (
            <button type="submit" className="pixel-btn menu-item text-[14px]" data-cmd="fight">
              CARRY ON THE NIGHT
            </button>
          )}
          <button
            type="button"
            className="pixel-btn menu-item text-[14px]"
            data-cmd={canContinue ? 'bag' : 'fight'}
            disabled={!name}
            onClick={newGame}
            data-testid="sesh-new"
          >
            {canContinue ? 'NEW RUN (ENDS THIS ONE)' : 'NEW RUN'}
          </button>
        </form>
        <Link href="/" className="text-[11px] text-[#e6e2ff] underline underline-offset-4">
          BACK TO THE TITLE
        </Link>
      </div>
    );
  }

  const night = save.run;

  // ---------- a battle ----------
  if (fighting && battle) {
    return (
      <BattleScreen
        key={nodeKey}
        start={battle.start}
        difficulty={battle.foe.ai}
        scene={stageOf(night).scene}
        music={battle.foe.kind === 'fight' ? 'trainer' : 'boss'}
        flat
        story={{
          bag: battleBag(fightBag),
          rate: 0,
          onUse: (id) => setFightBag((b) => ({ ...b, [id]: (b[id as ItemId] ?? 0) - 1 })),
          expOf: (i) => (night.party[i] ? expProgress(night.party[i]) : 0),
        }}
        onFinish={(_, __, ___, inputs) => finishBattle(inputs as BattleInput[])}
      />
    );
  }

  // ---------- everything else ----------
  let body: React.ReactNode;
  if (night.over) {
    body = (
      <Results
        run={night}
        bests={bests}
        onAgain={() => {
          const next: SeshSave = { v: 1, run: newRun(freshSeed()), actions: [] };
          storeSesh(player, next);
          begin(next, player);
        }}
      />
    );
  } else if (!ready) {
    body = <PartyPreview run={night} onStart={() => setReady(true)} />;
  } else if (night.at === 'offie') {
    body = <Offie run={night} act={act} />;
  } else if (night.at === 'smoke') {
    body = <SmokingArea run={night} act={act} />;
  } else if (night.at) {
    body = (
      <Briefing
        run={night}
        onFight={() => {
          setFightBag(night.bag);
          setBriefed(true);
        }}
      />
    );
  } else {
    const st = stageOf(night);
    const boss = bossAt(night.seed, st, night.stage, night.bosses[night.stage]);
    body = (
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[18px] font-bold leading-none" data-testid="sesh-stage">
              {st.name.toUpperCase()}
            </h2>
            <p className="text-[10px] opacity-80">
              {st.place} · Stage {night.stage + 1} of {QUICK_STAGES.length} · {euro(night.cash)}
            </p>
          </div>
          <div className="flex gap-1">
            <SoundButton />
            <SpeedButton />
          </div>
        </div>
        <PartyStrip party={night.party} gone={night.gone} />
        {night.path.length === 0 && <p className="dialog px-3 py-2 text-[11px]">{st.intro}</p>}
        <SeshMap
          map={mapOf(night)}
          path={night.path}
          open={choices(night)}
          bossOpen={bossNext(night)}
          bossName={boss.name}
          onPick={(col) => {
            playSfx('select');
            act({ kind: 'pick', col });
          }}
          onBoss={() => {
            playSfx('select');
            act({ kind: 'boss' });
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className="pixel-btn text-[12px]"
            data-cmd="party"
            onClick={() => setOverlay('party')}
          >
            PARTY
          </button>
          <button
            type="button"
            className="pixel-btn text-[12px]"
            data-cmd="bag"
            onClick={() => setOverlay('bag')}
          >
            BAG
          </button>
          <button
            type="button"
            className="pixel-btn text-[12px]"
            data-cmd="run"
            onClick={() => setOverlay('quit')}
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-3 bg-shell p-3 text-ink" data-testid="sesh">
      {body}
      {overlay === 'party' && (
        <PartyOverlay run={night} act={act} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'bag' && <BagOverlay run={night} act={act} onClose={() => setOverlay(null)} />}
      {overlay === 'quit' && (
        <Panel title="GO HOME?" onClose={() => setOverlay(null)}>
          <p className="text-[12px] leading-relaxed">
            Call it a night? The run ends here, and your score is what you’ve done so far.
          </p>
          <button
            type="button"
            className="pixel-btn menu-item"
            onClick={() => {
              setOverlay(null);
              act({ kind: 'quit' });
            }}
          >
            YES, GET ME A TAXI
          </button>
        </Panel>
      )}
      {lines.length > 0 && <Lines lines={lines} onNext={() => setLines((l) => l.slice(1))} />}
    </div>
  );
}
