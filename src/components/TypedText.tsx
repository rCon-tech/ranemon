'use client';

import { useEffect, useState } from 'react';

export const MS_PER_CHAR = 28;

/**
 * Types a line out a letter at a time, like the handhelds. The rest of the line is laid out
 * but hidden, so the box never reflows and the full text is always in the page for readers.
 * Give it a new `key` for each line.
 */
export function TypedText({ text, instant = false }: { text: string; instant?: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) clearInterval(id);
        return Math.min(n + 1, text.length);
      });
    }, MS_PER_CHAR);
    return () => clearInterval(id);
  }, [text]);
  if (instant) return <span>{text}</span>;
  return (
    <>
      <span>{text.slice(0, shown)}</span>
      <span className="invisible">{text.slice(shown)}</span>
    </>
  );
}
