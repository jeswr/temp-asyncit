import { type AsyncIterator, SingletonIterator } from '../iterators';

/**
  Creates an iterator with a single item.
  @param {object} item the item
 */
export function single<T>(item: T | null): AsyncIterator<T> {
  return new SingletonIterator<T>(item);
}
