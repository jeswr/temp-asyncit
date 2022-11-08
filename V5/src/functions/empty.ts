import { EmptyIterator, type AsyncIterator } from "../iterators";

/**
  Creates an empty iterator.
 */
export function empty<T>(): AsyncIterator<T> {
  return new EmptyIterator<T>();
}
