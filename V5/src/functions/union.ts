import { AsyncIterator, UnionIterator } from '../iterators';
import { MaybeIterableSource } from '../types';
import { wrap } from './wrap';

/**
  Creates an iterator containing all items from the given iterators.
  @param {MaybeIterableSource<MaybeIterableSource<T>>} iterable the items
 */
export function union<T>(
  iterable: MaybeIterableSource<MaybeIterableSource<T>>,
  maxParallelIterators?: number
): AsyncIterator<T> {
  // return new UnionIterator<T>(wrap(iterable).map(iter => wrap(iter)), maxParallelIterators);
  throw new Error('not implemented')
}
