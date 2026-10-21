'use client';

import { limeStops, type LimeStop } from '@/lib/story/limepass';
import { Panel } from './Panels';

/** LIMEPASS, from the START menu: hop on a Lime and zip back to any town you've been to. */
export function LimepassPanel({
  flags,
  here,
  onGo,
  onClose,
}: {
  flags: ReadonlySet<string>;
  /** The map you're on, which isn't worth a ride. */
  here: string;
  onGo: (stop: LimeStop) => void;
  onClose: () => void;
}) {
  const stops = limeStops(flags);
  return (
    <Panel title="LIMEPASS" onClose={onClose}>
      <p className="text-[11px] leading-relaxed">Where to? Any town you’ve been to.</p>
      {stops.map((s) => (
        <button
          key={s.map}
          type="button"
          className="pixel-btn flex justify-between px-2 py-1.5 text-left text-[12px]"
          disabled={s.map === here}
          onClick={() => onGo(s)}
          data-testid={`lime-${s.map}`}
        >
          <span>{s.town}</span>
          {s.map === here && <span className="text-[10px] opacity-70">YOU’RE HERE</span>}
        </button>
      ))}
    </Panel>
  );
}
