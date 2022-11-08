import { IntegerIterator, type AsyncIterator } from "../iterators";

export function range(start: number, end: number, step?: number): AsyncIterator<number> {
  return new IntegerIterator({ start, end, step });
}
