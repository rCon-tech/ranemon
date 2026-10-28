import type { SeshEntry, SeshStore } from './handler';

/** The Sesh's runs in memory, for the local save server and the tests. */
const row = ({ name, day, score, beaten, standing, turns, at }: SeshEntry) => ({
  name,
  day,
  score,
  beaten,
  standing,
  turns,
  at,
});
const best = (a: SeshEntry, b: SeshEntry) => b.score - a.score || a.at - b.at;

export function memorySesh(): SeshStore & { all: SeshEntry[] } {
  const all: SeshEntry[] = [];
  return {
    all,
    put: async (e) => {
      const i = all.findIndex((r) => r.id === e.id && r.day === e.day && r.seed === e.seed);
      if (i >= 0 && all[i].score >= e.score) return false;
      if (i >= 0) all[i] = e;
      else all.push(e);
      return true;
    },
    board: async (day, limit) =>
      all
        .filter((r) => r.day === day)
        .sort(best)
        .slice(0, limit)
        .map(row),
    winners: async (before, limit) =>
      [...new Set(all.map((r) => r.day))]
        .filter((d) => d !== 'free' && d < before)
        .sort()
        .reverse()
        .slice(0, limit)
        .map((d) => row(all.filter((r) => r.day === d).sort(best)[0])),
    mine: async (id, day, limit) =>
      all
        .filter((r) => r.id === id && (day === null ? r.day !== 'free' : r.day === day))
        .sort(day === null ? (a, b) => b.day.localeCompare(a.day) : best)
        .slice(0, limit)
        .map(row),
  };
}
