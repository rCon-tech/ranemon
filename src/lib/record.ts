/** The win/loss record. Kept in this browser until accounts arrive. */
export interface BattleRecord {
  wins: number;
  losses: number;
}

const KEY = 'ranemon.record';
const EMPTY: BattleRecord = { wins: 0, losses: 0 };
const listeners = new Set<() => void>();
let cache: { raw: string | null; record: BattleRecord } | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked (private windows); the record just doesn't persist.
    return null;
  }
}

function parse(raw: string | null): BattleRecord {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<BattleRecord>;
    return { wins: Number(parsed.wins) || 0, losses: Number(parsed.losses) || 0 };
  } catch {
    return EMPTY;
  }
}

/** The current record, the same object until it changes (for useSyncExternalStore). */
export function getRecord(): BattleRecord {
  const raw = readRaw();
  if (!cache || cache.raw !== raw) cache = { raw, record: parse(raw) };
  return cache.record;
}

export const getServerRecord = () => EMPTY;

export function subscribeRecord(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addResult(won: boolean) {
  const record = getRecord();
  const next = won
    ? { ...record, wins: record.wins + 1 }
    : { ...record, losses: record.losses + 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // See readRaw.
  }
  listeners.forEach((l) => l());
}
