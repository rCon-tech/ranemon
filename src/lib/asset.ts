/** Prefixes a file in `public/` with the base path, which is set when the game is hosted under a subfolder. */
export function asset(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}
