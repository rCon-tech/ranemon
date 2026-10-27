import { MISSIONS, type Mission, type MissionStep } from '@/content/story/missions';

export { MISSIONS, type Mission, type MissionStep } from '@/content/story/missions';

export interface OpenMission {
  mission: Mission;
  /** What to do next. */
  step: MissionStep;
  /** How many of the step's `count` flags are set, and of how many, if it counts any. */
  progress?: { got: number; of: number };
}

export const isOpen = (m: Mission, flags: ReadonlySet<string>) =>
  (!m.start || flags.has(m.start)) && !flags.has(m.done) && !(m.hideIf && flags.has(m.hideIf));

/**
 * Every mission you have open, started but not finished, in the order of `MISSIONS`, each with
 * what to do next: the first step whose flag isn't set yet.
 */
export function openMissions(
  flags: ReadonlySet<string>,
  missions: readonly Mission[] = MISSIONS,
): OpenMission[] {
  return missions
    .filter((m) => isOpen(m, flags))
    .map((mission) => {
      // Every step done but the mission itself isn't: the last step is still the one to do.
      const step = mission.steps.find((s) => !flags.has(s.until)) ?? mission.steps.at(-1)!;
      const progress = step.count && {
        got: step.count.filter((f) => flags.has(f)).length,
        of: step.count.length,
      };
      return progress ? { mission, step, progress } : { mission, step };
    });
}
