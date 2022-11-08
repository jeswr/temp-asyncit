import type { AsyncIterator } from '../iterators';
import { fromIterator } from './fromIterator';

/**
 Creates an iterator for the given Iterable.
 @param {Iterable} source the iterable
 */
export function fromIterable<T>(source: Iterable<T>): AsyncIterator<T> {
  return fromIterator(source[Symbol.iterator]())
}
