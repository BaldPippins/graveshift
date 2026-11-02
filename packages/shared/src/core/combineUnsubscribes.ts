import type { Unsubscribe } from './TypedEvent.ts';

export function combineUnsubscribes(unsubscribes: readonly Unsubscribe[]): Unsubscribe {
  return () => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  };
}
