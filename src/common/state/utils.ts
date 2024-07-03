import type { PicardState } from '@/types';

export function filterItems<U extends { origin: string }, T extends Record<string, Array<U>>>(
  items: T,
  names: Array<string>,
  collector: Array<U>,
) {
  return Object.fromEntries(
    Object.entries(items).map(([key, values]) => [
      key,
      values.filter((value) => {
        if (names.includes(value.origin)) {
          collector.push(value);
          return false;
        }

        return true;
      }),
    ]),
  ) as T;
}

export function mergeItems<U extends { origin: string }, T extends Record<string, Array<U>>>(
  items: T,
  collector: Array<U>,
  getKey: (val: U) => string,
) {
  return Object.fromEntries(
    Object.entries(items).map(([key, values]) => [key, [...values, ...collector.filter((v) => getKey(v) === key)]]),
  ) as T;
}

export function getActiveMfNames(state: PicardState) {
  return state.microfrontends.filter((m) => m.flags === 0).map((m) => m.name);
}
