import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '@/lib/battle/creature';
import { legalActions, startBattle, switchTargets, type Side } from '@/lib/battle/engine';
import { LEGEND } from '@/lib/battle/legend';
import { LONDON } from '@/lib/battle/london';
import { PETCHEMON } from '@/lib/battle/petchemon';
import { creatureById } from '@/lib/battle/roster';
import {
  entrantsOf,
  eventFor,
  HIDDEN,
  randomParties,
  RULES_VERSION,
  CHAMPION_SKIN,
  skinOf,
  stateFor,
  trainerId,
  validateTeam,
} from '@/lib/online/rules';
import {
  battleCall,
  makeCode,
  MAX_MISSED,
  normalCode,
  ROOM_MS,
  STEP_MS,
  type BattleContext,
  type CrownStore,
  type RoomStore,
} from '@/lib/online/server';
import { devSave } from '@/lib/story/devsave';
import { makeMember, type Member } from '@/lib/story/party';
import { playerId } from '@/lib/story/state';
import { reduce, startSession, type QueueItem } from '@/lib/ui/session';
import type { RoomView } from '@/lib/online/rules';
import { handle, type SaveRow, type SaveStore } from '../../save-api/handler';

const LATE = readFileSync('tests/fixtures/saves/main-late.json', 'utf8');
const EARLY = readFileSync('tests/fixtures/saves/live-early.json', 'utf8');
const partyOf = (raw: string) => JSON.parse(raw).party as Member[];

describe('online teams', () => {
  it('files a trainer name the way story saves do', () => {
    for (const name of ['Rich', '  Con  Boyde ', 'Ois!', 'A'.repeat(30), 'jam_mon-2'])
      expect(trainerId(name)).toBe(playerId(name));
  });

  it('takes the teams real saves have', () => {
    for (const party of [partyOf(LATE), partyOf(EARLY), devSave().party]) {
      const checked = validateTeam(party);
      expect(checked).toHaveProperty('team');
    }
  });

  it('turns away a team the game couldn’t have given', () => {
    const late = partyOf(LATE);
    const bad = (party: unknown) => (validateTeam(party) as { error: string }).error;
    expect(bad([])).toMatch(/empty/);
    expect(bad([...late, makeMember('enda', 10, 99)])).toMatch(/at most 6/);
    expect(bad([{ ...late[0], species: 'mewtwo' }])).toMatch(/isn’t in this version/);
    expect(bad([{ ...late[0], level: MAX_LEVEL + 1 }])).toMatch(/outside/);
    expect(bad([{ ...late[0], level: 20 }])).toMatch(/can’t have evolved/);
    expect(bad([{ ...late[3], moves: ['hole-in-one'] }])).toMatch(/can’t know hole-in-one/);
    expect(bad([{ ...late[3], moves: ['dark-web', 'dark-web'] }])).toMatch(/twice/);
    expect(bad([late[0], { ...late[1], uid: late[0].uid }])).toMatch(/twice/);
    expect(bad([{ ...late[0], variant: 'gold-plated' }])).toMatch(/look/);
    expect(bad([{ ...late[0], held: 'pint' }])).toMatch(/holding/);
    expect(bad([makeMember(PETCHEMON.id, 40, 1), makeMember(PETCHEMON.id, 40, 2)])).toMatch(
      /only one/,
    );
    expect(bad([{ ...makeMember('bns', 50, 1) }])).toMatch(/can’t join/);
  });

  it('sets levels by the rule, at full health', () => {
    const team = [makeMember('enda', 12, 1), makeMember(LEGEND.id, 55, 2)];
    for (const m of team) m.hp = 1;
    const levels = (rule: 'flat50' | 'cap50' | 'caught') =>
      entrantsOf(team, rule).map((e) => e.level);
    expect(levels('flat50')).toEqual([50, 50]);
    expect(levels('cap50')).toEqual([12, 50]);
    expect(levels('caught')).toEqual([12, 55]);
    expect(entrantsOf(team, 'flat50')[0]).not.toHaveProperty('hp');
  });

  it('takes the newest Ranemon and items from Story mode', () => {
    const uk = { ...makeMember('carlmon', 34, 1, 'uk'), held: 'xanax' as const };
    const cholo = { ...makeMember('killemon', 40, 2), species: 'cholokill' };
    cholo.moves = cholo.moves.map((id) => (id === 'this-ones-for-africa' ? 'whabam' : id));
    cholo.learned = [...cholo.moves];
    const london = { ...makeMember('oystermon', 40, 3), held: 'friendship-bracelet' as const };
    const team = [uk, cholo, london, makeMember('wickmon', 20, 4)];
    const checked = validateTeam(team);
    expect(checked).toHaveProperty('team');
    const entrants = entrantsOf((checked as { team: Member[] }).team, 'flat50');
    expect(entrants[0]).toMatchObject({ calm: true, held: { spirit: 1.2 } });
    expect(entrants[0].creature.sprite).toBe('/sprites/drawn/carlizard.png');
    expect(entrants[1].creature.id).toBe('cholokill');
    expect(entrants[2]).toMatchObject({ held: { defense: 1.2 } });
    expect(entrants[2].creature.id).toBe('crowdbat');
  });

  it('deals two random parties at Lv100, with nobody on both', () => {
    const [a, b] = randomParties(42);
    expect(a).toHaveLength(6);
    expect(b).toHaveLength(6);
    const species = [...a, ...b].map((m) => m.species);
    expect(new Set(species).size).toBe(12);
    expect(species).not.toContain('bns');
    // Only the Ranemon made from photos, in their photo or drawn look.
    const london = new Set(LONDON.map((c) => c.id));
    expect(species.filter((id) => london.has(id))).toEqual([]);
    const looks = new Set([...a, ...b].map((m) => m.variant ?? 'photo'));
    expect([...looks].sort()).toEqual(['photo', 'uk']);
    for (const party of [a, b]) {
      expect(validateTeam(party)).toHaveProperty('team');
      expect(entrantsOf(party, 'random').map((e) => e.level)).toEqual(Array(6).fill(MAX_LEVEL));
    }
    expect(randomParties(42)).toEqual([a, b]);
    expect(randomParties(7)).not.toEqual([a, b]);
  });

  it('reads the skin a save is wearing, only when it’s been unlocked', () => {
    expect(skinOf({ skin: 'bhav', skins: ['bhav'] })).toBe('bhav');
    expect(skinOf({ skin: 'bhav', skins: [] })).toBeUndefined();
    expect(skinOf({ skin: 'bhav' })).toBeUndefined();
    expect(skinOf({ skin: '<script>', skins: ['<script>'] })).toBeUndefined();
    expect(skinOf({ skins: ['bhav'] })).toBeUndefined();
    expect(skinOf(null)).toBeUndefined();
  });

  it('has a rules version both sides can compare', () => {
    expect(RULES_VERSION).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('what each phone sees', () => {
  const teams = () =>
    [
      ['enda', 'jammon', 'owemon'].map(creatureById),
      ['carlmon', 'oismon', 'killemon'].map(creatureById),
    ] as [never, never];

  it('puts your own team first, and hides the foe’s bench', () => {
    const { state } = startBattle(teams(), 7);
    const theirs = stateFor(state, 1, [0]);
    expect(theirs.teams[0].battlers[0].creature.id).toBe('carlmon');
    expect(theirs.teams[1].battlers[0].creature.id).toBe('enda');
    expect(theirs.teams[1].battlers[1].creature).toBe(HIDDEN);
    expect(theirs.teams[1].battlers[1].hp).toBe(1);
    expect(JSON.stringify(theirs.teams[1])).not.toMatch(/jammon|owemon/);
  });

  it('turns events round for the second player', () => {
    expect(eventFor({ kind: 'faint', side: 0 }, 1)).toEqual({ kind: 'faint', side: 1 });
    expect(eventFor({ kind: 'win', winner: 1 }, 1)).toEqual({ kind: 'win', winner: 0 });
    expect(eventFor({ kind: 'swap-hp', side: 0, hp: [10, 20] }, 1)).toEqual({
      kind: 'swap-hp',
      side: 1,
      hp: [20, 10],
    });
    expect(eventFor({ kind: 'say', text: 'hi' }, 1)).toEqual({ kind: 'say', text: 'hi' });
    expect(eventFor({ kind: 'faint', side: 0 }, 0)).toEqual({ kind: 'faint', side: 0 });
  });
});

/** The battle logic against memory, with a clock to move on. */
function world(saves: Record<string, string | null> = { rich: LATE, con: LATE }, crowned = true) {
  const rooms = new Map<string, { doc: string; version: number }>();
  const store: RoomStore = {
    get: async (code) => rooms.get(code) ?? null,
    put: async (code, doc, version) => {
      const row = rooms.get(code);
      if ((row?.version ?? 0) !== version) return false;
      rooms.set(code, { doc, version: version + 1 });
      return true;
    },
  };
  let champion: { doc: string; version: number } | null = null;
  const crown: CrownStore = {
    get: async () => champion,
    put: async (doc, version) => {
      if ((champion?.version ?? 0) !== version) return false;
      champion = { doc, version: version + 1 };
      return true;
    },
  };
  let clock = 1_000_000;
  let n = 0;
  const ctx: BattleContext = {
    rooms: store,
    ...(crowned && { crown }),
    auth: async (id, pin) => (!(id in saves) ? 'nosave' : pin === '1234' ? 'ok' : 'pin'),
    save: async (id) => saves[id] ?? null,
    now: () => clock,
    seed: () => 42,
    token: () => `token-${++n}`,
    random: () => (n++ * 0.37) % 1,
  };
  const call = async (body: object) => {
    const r = await battleCall(body, ctx);
    return r as { status: number; body: RoomView & { token?: string; error?: string } };
  };
  return { call, rooms, tick: (ms: number) => (clock += ms) };
}

/** Rich opens a room and Con joins it; both ready up. */
async function started(w = world(), rule = 'flat50') {
  const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION, rule });
  const code = a.body.code;
  const b = await w.call({ op: 'join', name: 'Con', pin: '1234', rules: RULES_VERSION, code });
  const players = [
    { token: a.body.token!, after: 0 },
    { token: b.body.token!, after: 0 },
  ];
  await w.call({ op: 'ready', code, token: players[0].token });
  const ready = await w.call({ op: 'ready', code, token: players[1].token });
  return { w, code, players, ready };
}

describe('the Online Champion', () => {
  const saves = () => ({ rich: LATE, con: LATE, ois: LATE });
  const champion = async (w: ReturnType<typeof world>) =>
    (await w.call({ op: 'champion' })).body as unknown as {
      champion: { id: string; name: string; defences: number; from?: string } | null;
    };
  /** `a` opens a room, `b` joins, both ready, and `loser` forfeits. */
  async function fight(w: ReturnType<typeof world>, a: string, b: string, loser: string) {
    const rules = RULES_VERSION;
    const one = await w.call({ op: 'create', name: a, pin: '1234', rules });
    const code = one.body.code;
    const two = await w.call({ op: 'join', name: b, pin: '1234', rules, code });
    await w.call({ op: 'ready', code, token: one.body.token });
    await w.call({ op: 'ready', code, token: two.body.token });
    const token = loser === a ? one.body.token : two.body.token;
    const other = loser === a ? two.body.token : one.body.token;
    const lost = await w.call({ op: 'forfeit', code, token });
    const won = await w.call({ op: 'poll', code, token: other, after: 0 });
    return { code, lost: lost.body, won: won.body };
  }

  it('starts with nobody, and goes to whoever wins the first battle', async () => {
    const w = world(saves());
    expect(await champion(w)).toEqual({ champion: null });
    const { won, lost } = await fight(w, 'Rich', 'Con', 'Con');
    expect(won.crown).toEqual({ holder: 'Rich', change: 'claimed' });
    expect(lost.crown).toEqual({ holder: 'Rich', change: 'claimed' });
    expect(won.you).toMatchObject({ name: 'Rich', champion: true, skin: CHAMPION_SKIN });
    expect(lost.foe).toMatchObject({ name: 'Rich', champion: true, skin: CHAMPION_SKIN });
    expect(lost.you).not.toHaveProperty('champion');
    expect((await champion(w)).champion).toMatchObject({ id: 'rich', name: 'Rich', defences: 0 });
    expect((await champion(w)).champion).not.toHaveProperty('from');
  });

  it('passes to whoever beats the Champion, skin and all', async () => {
    const w = world(saves());
    await fight(w, 'Rich', 'Con', 'Con');
    const { won, lost } = await fight(w, 'Con', 'Rich', 'Rich');
    expect(won.crown).toEqual({ holder: 'Con', change: 'took' });
    expect(won.you).toMatchObject({ name: 'Con', champion: true, skin: CHAMPION_SKIN });
    // Rich lost it, and the skin with it.
    expect(lost.you).not.toHaveProperty('champion');
    expect(lost.you).not.toHaveProperty('skin');
    expect((await champion(w)).champion).toMatchObject({ id: 'con', from: 'Rich', defences: 0 });
    // Back in a room, Con is dressed as Champion and Rich isn't.
    const rules = RULES_VERSION;
    const room = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules });
    expect(room.body.you).not.toHaveProperty('skin');
    const con = await w.call({ op: 'join', name: 'Con', pin: '1234', rules, code: room.body.code });
    expect(con.body.you).toMatchObject({ champion: true, skin: CHAMPION_SKIN });
  });

  it('counts a defence once, however often the phones ask', async () => {
    const w = world(saves());
    await fight(w, 'Rich', 'Con', 'Con');
    const { code, won } = await fight(w, 'Con', 'Rich', 'Con');
    expect(won.crown).toEqual({ holder: 'Rich', change: 'kept' });
    const again = await w.call({
      op: 'join',
      name: 'Rich',
      pin: '1234',
      rules: RULES_VERSION,
      code,
    });
    await w.call({ op: 'poll', code, token: again.body.token, after: 0 });
    expect((await champion(w)).champion).toMatchObject({ id: 'rich', defences: 1 });
  });

  it('stays put when two others battle', async () => {
    const w = world(saves());
    await fight(w, 'Rich', 'Con', 'Con');
    const { won } = await fight(w, 'Ois', 'Con', 'Con');
    expect(won).not.toHaveProperty('crown');
    expect((await champion(w)).champion).toMatchObject({ id: 'rich', defences: 0 });
  });

  it('goes to the winner when the Champion runs out the clock', async () => {
    const w = world(saves());
    await fight(w, 'Rich', 'Con', 'Con');
    const rules = RULES_VERSION;
    const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules });
    const code = a.body.code;
    const b = await w.call({ op: 'join', name: 'Con', pin: '1234', rules, code });
    await w.call({ op: 'ready', code, token: a.body.token });
    const live = await w.call({ op: 'ready', code, token: b.body.token });
    for (let i = 0; i < MAX_MISSED; i++) {
      const state = (await w.call({ op: 'poll', code, token: b.body.token })).body.state!;
      if (state.phase.kind === 'choose')
        await w.call({
          op: 'act',
          code,
          token: b.body.token,
          turn: state.turn,
          action: legalActions(state, 0)[0],
        });
      w.tick(STEP_MS + 1);
    }
    expect(live.body.stage).toBe('live');
    const over = await w.call({ op: 'poll', code, token: b.body.token });
    expect(over.body).toMatchObject({ stage: 'over', why: 'timeout' });
    expect(over.body.crown).toEqual({ holder: 'Con', change: 'took' });
  });

  it('can’t be put on by a save that just says it has the skin', async () => {
    const forged = JSON.stringify({
      ...JSON.parse(LATE),
      skin: CHAMPION_SKIN,
      skins: [CHAMPION_SKIN],
    });
    const w = world({ rich: LATE, con: forged });
    const r = await w.call({ op: 'create', name: 'Con', pin: '1234', rules: RULES_VERSION });
    expect(r.body.you).not.toHaveProperty('skin');
    expect(r.body.you).not.toHaveProperty('champion');
  });

  it('starts with Ollie, when the server has his save', async () => {
    const w = world({ ...saves(), ollie: LATE });
    expect((await champion(w)).champion).toMatchObject({ id: 'ollie', name: 'Ollie' });
    const room = await w.call({ op: 'create', name: 'Ollie', pin: '1234', rules: RULES_VERSION });
    expect(room.body.you).toMatchObject({ champion: true, skin: CHAMPION_SKIN });
    // Two others battling leave him the crown.
    expect((await fight(w, 'Rich', 'Con', 'Con')).won).not.toHaveProperty('crown');
    const { won } = await fight(w, 'Rich', 'Ollie', 'Ollie');
    expect(won.crown).toEqual({ holder: 'Rich', change: 'took' });
    expect((await champion(w)).champion).toMatchObject({ id: 'rich', from: 'Ollie' });
  });

  it('isn’t there on a server without the crown', async () => {
    const w = world(saves(), false);
    expect(await champion(w)).toEqual({ champion: null });
    const { won } = await fight(w, 'Rich', 'Con', 'Con');
    expect(won).not.toHaveProperty('crown');
    expect(won.you).not.toHaveProperty('champion');
  });
});

describe('friend battles on the save server', () => {
  it('opens a room with a code anyone can type', async () => {
    expect(makeCode(() => 0.5)).toMatch(/^[A-Z]{4}-\d{2}$/);
    expect(normalCode('boka42')).toBe('BOKA-42');
    expect(normalCode(' Boka-42 ')).toBe('BOKA-42');
    expect(normalCode('nope')).toBe('');
    const w = world();
    const r = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ stage: 'waiting', you: { name: 'Rich' }, foe: null });
  });

  it('turns away a wrong PIN, a name with no save and an old version of the game', async () => {
    const w = world();
    const rules = RULES_VERSION;
    expect((await w.call({ op: 'create', name: 'Rich', pin: '0000', rules })).status).toBe(401);
    expect((await w.call({ op: 'create', name: 'Ois', pin: '1234', rules })).status).toBe(404);
    expect((await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: 'old' })).body).toEqual({
      error: 'update',
    });
  });

  it('starts once both are ready, with each player’s own team in front', async () => {
    const { ready, w, code, players } = await started();
    expect(ready.body.stage).toBe('live');
    // The second player got the start in their answer; the first gets it on their next poll.
    const first = await w.call({ op: 'poll', code, token: players[0].token, after: 0 });
    for (const view of [first.body, ready.body]) {
      expect(view.items).toEqual([
        { kind: 'send-out', side: 1, index: 0 },
        { kind: 'send-out', side: 0, index: 0 },
      ]);
      expect(view.state!.teams[0].battlers[0].level).toBe(50);
      expect(view.state!.teams[1].battlers[1].creature).toEqual(HIDDEN);
      expect(view.state!.rng).toBe(0);
    }
    expect(first.body.foe).toMatchObject({ name: 'Con', ready: true, size: 6 });
  });

  it('shows each trainer in their Story mode skin', async () => {
    const dressed = JSON.stringify({ ...JSON.parse(LATE), skin: 'bhav', skins: ['bhav'] });
    const w = world({ rich: dressed, con: LATE });
    const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION });
    expect(a.body.you.skin).toBe('bhav');
    const code = a.body.code;
    const b = await w.call({ op: 'join', name: 'Con', pin: '1234', rules: RULES_VERSION, code });
    expect(b.body.foe).toMatchObject({ name: 'Rich', skin: 'bhav' });
    // Wearing the usual look sends nothing, so an older phone sees what it always did.
    expect(b.body.you).not.toHaveProperty('skin');
    const poll = await w.call({ op: 'poll', code, token: a.body.token });
    expect(poll.body.foe).not.toHaveProperty('skin');
  });

  it('turns away a team its save couldn’t have', async () => {
    const bad = JSON.stringify({ ...JSON.parse(LATE), party: [{ species: 'mewtwo' }] });
    const w = world({ rich: LATE, con: bad });
    const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION });
    const code = a.body.code;
    const b = await w.call({ op: 'join', name: 'Con', pin: '1234', rules: RULES_VERSION, code });
    const r = await w.call({ op: 'ready', code, token: b.body.token });
    expect(r).toEqual({
      status: 422,
      body: { error: 'team', why: expect.stringMatching(/mewtwo/) },
    });
  });

  it('deals random parties at Lv100, whatever the saves hold, and leaves the saves alone', async () => {
    const bad = JSON.stringify({ ...JSON.parse(LATE), party: [] });
    const saves = { rich: LATE, con: bad };
    const { ready, w, code, players } = await started(world(saves), 'random');
    expect(ready.body.rule).toBe('random');
    expect(ready.body.stage).toBe('live');
    const first = await w.call({ op: 'poll', code, token: players[0].token, after: 0 });
    const mine = first.body.state!.teams[0].battlers;
    const theirs = ready.body.state!.teams[0].battlers;
    expect(mine).toHaveLength(6);
    expect(theirs).toHaveLength(6);
    for (const b of [...mine, ...theirs]) expect(b.level).toBe(MAX_LEVEL);
    const own = new Set(partyOf(LATE).map((m) => m.species));
    expect(mine.map((b) => b.creature.id).every((id) => own.has(id))).toBe(false);
    expect(saves).toEqual({ rich: LATE, con: bad });
  });

  it('keeps a third trainer out, and lets a player back in with their PIN', async () => {
    const w = world({ rich: LATE, con: LATE, ois: LATE });
    const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION });
    const code = a.body.code;
    await w.call({ op: 'join', name: 'Con', pin: '1234', rules: RULES_VERSION, code });
    const third = await w.call({
      op: 'join',
      name: 'Ois',
      pin: '1234',
      rules: RULES_VERSION,
      code,
    });
    expect(third.status).toBe(409);
    const back = await w.call({
      op: 'join',
      name: 'rich',
      pin: '1234',
      rules: RULES_VERSION,
      code,
    });
    expect(back.body).toMatchObject({ you: { name: 'Rich' }, foe: { name: 'Con' } });
    // The old token stops working.
    expect((await w.call({ op: 'poll', code, token: a.body.token })).status).toBe(403);
    expect((await w.call({ op: 'poll', code, token: back.body.token })).status).toBe(200);
  });

  it('plays a whole battle, the same for both players', async () => {
    const { w, code, players } = await started();
    const seen: QueueItem[][] = [[], []];
    let view: RoomView[] = [];
    for (let i = 0; i < 400; i++) {
      view = [];
      for (const side of [0, 1] as Side[]) {
        const p = players[side];
        const polled = (await w.call({ op: 'poll', code, token: p.token, after: p.after })).body;
        p.after = polled.n;
        seen[side].push(...polled.items);
        view.push(polled);
      }
      if (view[0].stage === 'over') break;
      for (const side of [0, 1] as Side[]) {
        const p = players[side];
        const state = view[side].state!;
        const body =
          state.phase.kind === 'choose'
            ? { op: 'act', action: legalActions(state, 0)[0], turn: state.turn }
            : state.phase.kind === 'replace' && state.phase.sides.includes(0)
              ? { op: 'replace', to: switchTargets(state, 0)[0] }
              : null;
        if (!body) continue;
        const r = await w.call({ ...body, code, token: p.token, after: p.after });
        if (r.status !== 200) continue;
        p.after = r.body.n;
        seen[side].push(...r.body.items);
      }
    }
    expect(view[0].stage).toBe('over');
    expect(view[0].why).toBe('battle');
    // Both saw the same battle, each from their own side.
    const opening = (items: QueueItem[]) => [...items.slice(0, 2).reverse(), ...items.slice(2)];
    expect(seen[1]).toEqual(opening(seen[0]).map((e) => eventFor(e, 1)));
    const win = seen[0].find((e) => e.kind === 'win');
    expect(win).toBeDefined();
  });

  it('turns away a move for the wrong turn, or one that isn’t allowed', async () => {
    const { w, code, players } = await started();
    const token = players[0].token;
    const stale = await w.call({
      op: 'act',
      code,
      token,
      turn: 7,
      action: { kind: 'move', index: 0 },
    });
    expect(stale.status).toBe(409);
    const illegal = await w.call({
      op: 'act',
      code,
      token,
      turn: 1,
      action: { kind: 'move', index: 9 },
    });
    expect(illegal.status).toBe(400);
    const pass = await w.call({ op: 'act', code, token, turn: 1, action: { kind: 'pass' } });
    expect(pass.status).toBe(400);
  });

  it('waits for both choices before playing the turn', async () => {
    const { w, code, players } = await started();
    const action = { kind: 'move', index: 0 };
    const one = await w.call({
      op: 'act',
      code,
      token: players[0].token,
      turn: 1,
      action,
      after: 1,
    });
    expect(one.body.items).toEqual([]);
    const two = await w.call({
      op: 'act',
      code,
      token: players[1].token,
      turn: 1,
      action,
      after: 1,
    });
    expect(two.body.items.length).toBeGreaterThan(0);
    expect(two.body.state!.turn).toBe(2);
  });

  it('acts for a player who has gone quiet, and ends it after they miss twice', async () => {
    const { w, code, players } = await started();
    const action = { kind: 'move', index: 0 };
    const rich = players[0].token;
    await w.call({ op: 'act', code, token: rich, turn: 1, action });
    w.tick(STEP_MS + 1);
    const first = await w.call({ op: 'poll', code, token: rich, after: 1 });
    expect(first.body.state!.turn).toBe(2);
    expect(first.body.stage).toBe('live');
    for (let missed = 1; missed < MAX_MISSED; missed++) {
      const turn = (await w.call({ op: 'poll', code, token: rich })).body.state!.turn;
      if ((await w.call({ op: 'poll', code, token: rich })).body.state!.phase.kind === 'choose')
        await w.call({ op: 'act', code, token: rich, turn, action });
      w.tick(STEP_MS + 1);
    }
    const end = await w.call({ op: 'poll', code, token: rich, after: 0 });
    expect(end.body.stage).toBe('over');
    expect(end.body.why).toBe('timeout');
    expect(end.body.items.at(-2)).toEqual({ kind: 'say', text: 'Con left the battle.' });
    expect(end.body.items.at(-1)).toEqual({ kind: 'win', winner: 0 });
  });

  it('ends the battle when a player forfeits', async () => {
    const { w, code, players } = await started();
    await w.call({ op: 'forfeit', code, token: players[0].token });
    const con = await w.call({ op: 'poll', code, token: players[1].token, after: 1 });
    expect(con.body.stage).toBe('over');
    expect(con.body.why).toBe('forfeit');
    expect(con.body.items).toEqual([
      { kind: 'say', text: 'Rich forfeited the battle.' },
      { kind: 'win', winner: 0 },
    ]);
    expect(con.body.state!.phase).toEqual({ kind: 'over', winner: 0 });
  });

  it('closes a room nobody starts', async () => {
    const w = world();
    const a = await w.call({ op: 'create', name: 'Rich', pin: '1234', rules: RULES_VERSION });
    w.tick(ROOM_MS + 1);
    const r = await w.call({ op: 'poll', code: a.body.code, token: a.body.token });
    expect(r.body.stage).toBe('closed');
    const late = await w.call({
      op: 'join',
      name: 'Con',
      pin: '1234',
      rules: RULES_VERSION,
      code: a.body.code,
    });
    expect(late.status).toBe(410);
  });

  it('runs on the save server, checking PINs against online saves', async () => {
    const rows = new Map<string, SaveRow>();
    const saves: SaveStore = {
      get: async (id) => rows.get(id) ?? null,
      put: async (r) => void rows.set(r.id, r),
      fails: async () => null,
      setFails: async () => {},
      clearFails: async () => {},
    };
    const rooms = new Map<string, { doc: string; version: number }>();
    const opts = {
      origins: ['https://rcon-tech.github.io'],
      battles: {
        call: battleCall,
        rooms: {
          get: async (code: string) => rooms.get(code) ?? null,
          put: async (code: string, doc: string, version: number) => {
            if ((rooms.get(code)?.version ?? 0) !== version) return false;
            rooms.set(code, { doc, version: version + 1 });
            return true;
          },
        },
      },
    };
    const post = async (path: string, body: object) => {
      const res = await handle(
        new Request(`https://saves.example/api/${path}`, {
          method: 'POST',
          headers: { origin: 'https://rcon-tech.github.io', 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
        saves,
        opts,
      );
      return {
        status: res.status,
        body: await res.json(),
        cors: res.headers.get('access-control-allow-origin'),
      };
    };
    await post('save', { id: 'rich', pin: '1234', raw: LATE });
    const wrong = await post('battle', {
      op: 'create',
      name: 'Rich',
      pin: '9999',
      rules: RULES_VERSION,
    });
    expect(wrong.status).toBe(401);
    const ok = await post('battle', {
      op: 'create',
      name: 'Rich',
      pin: '1234',
      rules: RULES_VERSION,
    });
    expect(ok.status).toBe(200);
    expect(ok.cors).toBe('https://rcon-tech.github.io');
    expect(ok.body.token).toMatch(/^[\w-]{24}$/);
    expect(ok.body.code).toMatch(/^[A-Z]{4}-\d{2}$/);
  });
});

describe('the battle screen online', () => {
  const start = () =>
    startBattle(
      [['enda', 'jammon'].map(creatureById), ['carlmon', 'oismon'].map(creatureById)] as [
        never,
        never,
      ],
      3,
    );

  it('sends your choice and waits for the friend’s', () => {
    const begun = start();
    let s = startSession(begun, 'normal', { remote: true, foe: { kind: 'trainer', name: 'Con' } });
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    expect(s.mode).toBe('menu');
    s = reduce(s, { type: 'act', action: { kind: 'move', index: 0 }, random: 1 });
    expect(s.mode).toBe('waiting');
    expect(s.message).toBe('Waiting for Con…');
    expect(s.outbox).toEqual({ kind: 'act', action: { kind: 'move', index: 0 }, turn: 1, n: 1 });
    // The engine didn't play the turn here.
    expect(s.state).toBe(begun.state);

    const next = { ...begun.state, turn: 2 };
    s = reduce(s, {
      type: 'remote',
      state: next,
      items: [{ kind: 'move', side: 1, moveId: 'nozzy-call' }],
    });
    expect(s.mode).toBe('playing');
    expect(s.state.turn).toBe(2);
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    expect(s.mode).toBe('menu');
  });

  it('runs the timer out into a choice to send, and sends a forfeit', () => {
    let s = startSession(start(), 'normal', { remote: true });
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    s = { ...s, timeLeft: 1 };
    s = reduce(s, { type: 'tick', random: 0.5 });
    expect(s.mode).toBe('waiting');
    expect(s.outbox?.kind).toBe('act');
    const quit = reduce({ ...s, mode: 'menu' }, { type: 'forfeit' });
    expect(quit.mode).toBe('over');
    expect(quit.outbox).toEqual({ kind: 'forfeit', n: 2 });
    // What the server says after you've forfeited doesn't reopen the battle.
    expect(reduce(quit, { type: 'remote', state: s.state, items: [] }).mode).toBe('over');
  });
});

describe('a friend battle played back on a phone', () => {
  it('brings the foe’s next Ranemon in at full health', async () => {
    const { w, code, players, ready } = await started();
    const rich = players[0];
    const first = await w.call({ op: 'poll', code, token: rich.token, after: 0 });
    rich.after = first.body.n;
    let s = startSession({ state: first.body.state!, events: first.body.items }, 'normal', {
      remote: true,
      foe: { kind: 'trainer', name: 'Con' },
    });
    expect(ready.body.stage).toBe('live');
    let checked = 0;
    const play = () => {
      for (let i = 0; i < 500 && s.mode === 'playing'; i++) {
        s = reduce(s, { type: 'step', random: i });
        const last = s.last;
        if (last && 'side' in last && last.kind === 'send-out' && last.side === 1) {
          const b = s.state.teams[1].battlers[last.index];
          expect(s.view[1].hp[last.index]).toBe(b.stats.hp);
          checked++;
        }
      }
    };
    play();
    for (let turn = 0; turn < 300 && s.mode !== 'over'; turn++) {
      // Rich picks through the session; Con answers straight to the server.
      if (s.mode === 'menu') {
        s = reduce(s, { type: 'act', action: legalActions(s.state, 0)[0], random: 1 });
      } else if (s.mode === 'forced-switch') {
        s = reduce(s, { type: 'replace', to: switchTargets(s.state, 0)[0] });
      }
      const out = s.outbox;
      if (out?.kind === 'act')
        await w.call({ op: 'act', code, token: rich.token, turn: out.turn, action: out.action });
      if (out?.kind === 'replace')
        await w.call({ op: 'replace', code, token: rich.token, to: out.to });
      const con = (await w.call({ op: 'poll', code, token: players[1].token, after: -1 })).body;
      const cs = con.state!;
      if (con.stage === 'live' && cs.phase.kind === 'choose')
        await w.call({
          op: 'act',
          code,
          token: players[1].token,
          turn: cs.turn,
          action: legalActions(cs, 0)[0],
        });
      if (con.stage === 'live' && cs.phase.kind === 'replace' && cs.phase.sides.includes(0))
        await w.call({ op: 'replace', code, token: players[1].token, to: switchTargets(cs, 0)[0] });
      const news = (await w.call({ op: 'poll', code, token: rich.token, after: rich.after })).body;
      rich.after = news.n;
      if (news.items.length > 0)
        s = reduce(s, { type: 'remote', state: news.state!, items: news.items });
      play();
    }
    expect(s.mode).toBe('over');
    // Con's lead plus at least one replacement.
    expect(checked).toBeGreaterThan(1);
  });
});
