import type { AsyncIterator } from '../iterators';
import { PromiseIterator } from '../iterators/PromiseIterator';
import { IterableOrNullableSource } from '../types';

/**
  Creates an iterator for the given promise.
  @param {Promise} items a promise containing an AsyncIterable promise
 */
export function fromPromise<T>(items: Promise<IterableOrNullableSource<T>>): AsyncIterator<T> {
  return new PromiseIterator(items);
}
