import type { AsyncIterator } from '../iterators';

/**
  Creates an iterator with a single item.
  @param {object} item the item
 */
export function single<T>(item: T): AsyncIterator<T> {
  throw new Error('not implemented');
  // return new SingletonIterator<T>(item);
}
