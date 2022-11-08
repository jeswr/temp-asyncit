import type { AsyncIterator } from '../iterators';

/**
 Creates an iterator for the given Iterable.
 @param {Iterable} source the iterable
 */
 export function fromIterable<T>(source: Iterable<T>): AsyncIterator<T> {
  throw new Error('Not Implemented')
}
