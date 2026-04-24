import { computed, Signal } from '@angular/core';

export function toSignalMap<K, V>(
  listSignal: Signal<readonly V[]>,
  keySelector: (item: V) => K
): Signal<Map<K, V>> {
  return computed(() => {
    const list = listSignal();
    return list
      ? new Map(list.map(item => [keySelector(item), item] as const))
      : new Map();
  });
}
