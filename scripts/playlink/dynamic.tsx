import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

/** next/dynamic on the play link: everything is in the one file, so it just waits a tick. */
export default function dynamic<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  options?: { loading?: () => ReactNode },
) {
  const Lazy = lazy(load);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={options?.loading?.() ?? null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
