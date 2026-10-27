'use client';

import { useState } from 'react';
import {
  backups,
  describe,
  exportCode,
  importCode,
  parseSave,
  type Backup,
} from '@/lib/story/save';
import { modeOf, type StoryMode, type StoryState } from '@/lib/story/state';

const WHY: Record<Backup['why'], string> = {
  auto: 'While playing',
  update: 'Before an update',
  restore: 'Before a restore',
  import: 'Before an import',
  clash: 'The save you didn’t pick',
};

const when = (at: number) =>
  new Date(at).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Why a save code from the other game can't be loaded here, by the game it's from. */
const OTHER_GAME: Record<StoryMode, string> = {
  dublin: 'That’s a Ranemon Dublin save. Load it from STORY MODE on the home screen.',
  london: 'That’s a Ranemon London save. Load it from SKIP TO RANEMON LONDON on the home screen.',
};

/** A save read from a code, if it's from this game (Dublin, or a London-only game). */
function forMode(
  found: { state: StoryState } | { error: string },
  mode: StoryMode,
): { state: StoryState } | { error: string } {
  if ('error' in found) return found;
  const from = modeOf(found.state);
  return from === mode ? found : { error: OTHER_GAME[from] };
}

/**
 * Backups for one trainer, from the title screen: the copies this browser keeps, and a save code
 * (or file) to carry the save to another device or keep it safe. A London-only game has its own,
 * and a save code only loads into the game it came from.
 */
export function SaveTools({
  name,
  storage,
  current,
  onUse,
  onClose,
  mode = 'dublin',
}: {
  name: string;
  mode?: StoryMode;
  storage: Storage | null;
  /** The trainer's save as it stands, if they have one. */
  current: StoryState | null;
  /** Makes this the trainer's save and carries on from it. */
  onUse: (s: StoryState, why: 'restore' | 'import') => void;
  onClose: () => void;
}) {
  const copies = backups(storage, name, mode)
    .map((b) => ({ ...b, state: parseSave(b.raw) }))
    .filter(
      (b): b is Backup & { state: StoryState } => b.state !== null && modeOf(b.state) === mode,
    );
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState('');
  const [found, setFound] = useState<{ state: StoryState } | { error: string } | null>(null);
  /** The copy waiting for a second tap to confirm, by its time. */
  const [confirm, setConfirm] = useState<number | null>(null);
  const trainer = name.trim();

  function copy() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  function download() {
    if (!code) return;
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranemon-${trainer.toLowerCase().replace(/\W+/g, '-')}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div
      className="flex flex-1 flex-col gap-4 px-4 py-6 text-left text-ink"
      data-testid="save-tools"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold">SAVES FOR {trainer.toUpperCase()}</h1>
        <button type="button" className="pixel-btn px-2 py-1 text-[11px]" onClick={onClose}>
          BACK
        </button>
      </div>

      <section className="dialog flex flex-col gap-2 p-3">
        <h2 className="text-[13px] font-bold">SAVE CODE</h2>
        <p className="text-[10px] leading-relaxed text-frame">
          Your whole save as a code. Keep it somewhere safe, or load it on another phone or computer
          to carry on there.
        </p>
        {current ? (
          code ? (
            <>
              <textarea
                className="dialog h-28 w-full px-2 py-1 text-[10px]"
                readOnly
                value={code}
                onFocus={(e) => e.currentTarget.select()}
                data-testid="save-code"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="pixel-btn text-[12px]" onClick={copy}>
                  {copied ? 'COPIED' : 'COPY'}
                </button>
                <button type="button" className="pixel-btn text-[12px]" onClick={download}>
                  DOWNLOAD
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="pixel-btn menu-item text-[12px]"
              onClick={() => setCode(exportCode(current))}
            >
              MAKE MY SAVE CODE
            </button>
          )
        ) : (
          <p className="text-[11px]">No save under this name in this browser yet.</p>
        )}
      </section>

      <section className="dialog flex flex-col gap-2 p-3">
        <h2 className="text-[13px] font-bold">LOAD A SAVE CODE</h2>
        <textarea
          className="dialog h-16 w-full px-2 py-1 text-[10px]"
          placeholder="Paste a code that starts RANEMON1"
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setFound(null);
          }}
          data-testid="load-code"
        />
        <label className="text-[10px] text-frame">
          or pick a save file:{' '}
          <input
            type="file"
            accept=".txt,.json,text/plain,application/json"
            className="text-[10px]"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setFound(forMode(importCode(await file.text()), mode));
            }}
          />
        </label>
        {!found && (
          <button
            type="button"
            className="pixel-btn menu-item text-[12px]"
            disabled={!pasted.trim()}
            onClick={() => setFound(forMode(importCode(pasted), mode))}
          >
            READ CODE
          </button>
        )}
        {found && 'error' in found && <p className="text-[11px] text-accent">{found.error}</p>}
        {found && 'state' in found && (
          <>
            <p className="text-[11px]">{describe(found.state)}</p>
            <button
              type="button"
              className="pixel-btn menu-item text-[12px]"
              onClick={() => onUse(found.state, 'import')}
              data-testid="use-code"
            >
              {current ? `REPLACE ${trainer.toUpperCase()}’S SAVE WITH THIS` : 'PLAY THIS SAVE'}
            </button>
            {current && (
              <p className="text-[10px] text-frame">
                Your current save is kept as a copy below first.
              </p>
            )}
          </>
        )}
      </section>

      <section className="dialog flex flex-col gap-2 p-3">
        <h2 className="text-[13px] font-bold">COPIES IN THIS BROWSER</h2>
        <p className="text-[10px] leading-relaxed text-frame">
          The game keeps a copy every 10 minutes while you play, and before an update or a restore
          changes your save.
        </p>
        {copies.length === 0 && <p className="text-[11px]">No copies yet.</p>}
        {copies.map((b) => (
          <div key={b.at + b.why} className="flex items-center gap-2" data-testid="backup">
            <div className="min-w-0 flex-1 text-[10px] leading-snug">
              <b>{when(b.at)}</b> · {WHY[b.why]}
              <br />
              {describe(b.state)}
            </div>
            <button
              type="button"
              className="pixel-btn shrink-0 px-2 py-1 text-[11px]"
              onClick={() => (confirm === b.at ? onUse(b.state, 'restore') : setConfirm(b.at))}
            >
              {confirm === b.at ? 'SURE?' : 'RESTORE'}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
