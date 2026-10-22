import type { BattleState } from '../battle/engine';
import type { Choice, QueueItem } from '../ui/session';
import { RULES_VERSION, type LevelRule, type RoomView } from './rules';

/**
 * A phone's side of a live friend battle on the save server (`server.ts`): it sends choices and
 * polls for what happened, one call at a time so nothing arrives twice.
 */

/** Why a call failed, in words for the screen. */
export class LinkError extends Error {
  constructor(
    message: string,
    readonly code = '',
  ) {
    super(message);
  }
}

const WORDS: Record<string, string> = {
  update: 'You and the save server are on different versions of the game. Reload the page.',
  'wrong PIN': 'That PIN doesn’t match the name’s online save.',
  locked: 'Too many wrong PINs for that name. Try again in 15 minutes.',
  'no save': 'That name has no online save yet. Play Story mode with your PIN first.',
  'no room': 'There’s no battle with that code. Check it with your friend.',
  full: 'That battle already has two trainers.',
  closed: 'That battle has closed. Ask your friend for a new code.',
  'not in this room': 'You’re not in that battle any more.',
};

/** How often to ask the server what's new. */
export const POLL_MS = 1500;

export interface Joined {
  view: RoomView;
  token: string;
}

async function post(base: string, body: object): Promise<RoomView & { token?: string }> {
  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/+$/, '')}/battle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LinkError('Couldn’t reach the save server. Check your connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = String(data.error ?? res.status);
    if (error === 'team') throw new LinkError(`Your team can’t battle: ${data.why}`, error);
    throw new LinkError(WORDS[error] ?? `The save server said no (${error}).`, error);
  }
  return data;
}

/** Opens a room for a friend to join. */
export async function createRoom(
  base: string,
  name: string,
  pin: string,
  rule: LevelRule,
): Promise<Joined> {
  const { token, ...view } = await post(base, {
    op: 'create',
    name,
    pin,
    rule,
    rules: RULES_VERSION,
  });
  return { view, token: token! };
}

/** Joins a friend's room by its code, or comes back into one. */
export async function joinRoom(
  base: string,
  name: string,
  pin: string,
  code: string,
): Promise<Joined> {
  const { token, ...view } = await post(base, {
    op: 'join',
    name,
    pin,
    code,
    rules: RULES_VERSION,
  });
  return { view, token: token! };
}

type Listener = (state: BattleState, items: QueueItem[]) => void;

/**
 * One room, once joined. `onView` hears every answer (for the lobby); `listen` hears what
 * happened in the battle, in order, and gets anything that arrived before it listened.
 */
export class RoomLink {
  /** The steps seen so far. */
  n: number;
  private chain: Promise<unknown> = Promise.resolve();
  private listener: Listener | null = null;
  private waiting: { state: BattleState; items: QueueItem[] } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = 0;

  constructor(
    private base: string,
    readonly code: string,
    private token: string,
    after: number,
    private onView: (view: RoomView) => void,
    private onError: (message: string) => void,
  ) {
    this.n = after;
  }

  /** One call at a time, each asking only for what's new since the last. */
  private call(body: object): Promise<RoomView | null> {
    const next = this.chain.then(async () => {
      try {
        const view = await post(this.base, {
          ...body,
          code: this.code,
          token: this.token,
          after: this.n,
        });
        this.n = view.n;
        this.deliver(view);
        this.onView(view);
        return view;
      } catch (e) {
        // A choice for a turn the server has already played (for a player who was away too
        // long, say) is dropped; the next poll brings what happened instead.
        if (!(e instanceof LinkError && e.code === 'stale'))
          this.onError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        this.busy--;
      }
    });
    this.busy++;
    this.chain = next;
    return next;
  }

  private deliver(view: RoomView) {
    if (!view.state || view.items.length === 0) return;
    if (this.listener) return this.listener(view.state, view.items);
    this.waiting = {
      state: view.state,
      items: [...(this.waiting?.items ?? []), ...view.items],
    };
  }

  listen(fn: Listener): () => void {
    this.listener = fn;
    if (this.waiting) {
      const { state, items } = this.waiting;
      this.waiting = null;
      fn(state, items);
    }
    return () => {
      if (this.listener === fn) this.listener = null;
    };
  }

  /** Takes what has arrived but nobody has heard yet, to start the battle screen from. */
  take(): { state: BattleState; items: QueueItem[] } | null {
    const w = this.waiting;
    this.waiting = null;
    return w;
  }

  poll = () => this.call({ op: 'poll' });
  ready = () => this.call({ op: 'ready' });

  send(choice: Choice) {
    if (choice.kind === 'act')
      return this.call({ op: 'act', action: choice.action, turn: choice.turn });
    if (choice.kind === 'replace') return this.call({ op: 'replace', to: choice.to });
    return this.call({ op: 'forfeit' });
  }

  start() {
    this.timer ??= setInterval(() => {
      // A hidden tab stops asking; the server acts for a player who stays away too long.
      if (this.busy > 0) return;
      if (typeof document === 'undefined' || document.visibilityState === 'visible') this.poll();
    }, POLL_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.listener = null;
  }
}
