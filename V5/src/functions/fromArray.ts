import { ArrayIterator, type AsyncIterator } from '../iterators';

/**
  Creates an iterator for the given array.
  @param {Array} items the items
 */
export function fromArray<T>(items: Iterable<T>): AsyncIterator<T> {
  return new ArrayIterator<T>(items);
}
