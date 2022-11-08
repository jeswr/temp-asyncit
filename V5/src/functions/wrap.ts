import { isPromise, isValidSource } from '../checkers';
import { empty } from './empty';
import { fromArray } from './fromArray';
import { fromPromise } from './fromPromise';
import { MaybeIterableSource, IterableOrNullableSource } from '../types';
import { fromEventEmitter } from './fromEventEmitter';
import { AsyncIterator } from '../iterators';

/**
  Creates an iterator that wraps around a given iterator or readable stream.
  Use this to convert an iterator-like object into a full-featured AsyncIterator.
  After this operation, only read the returned iterator instead of the given one.
  @function
  @param [source] The source this iterator generates items from
  @returns {module:asynciterator.AsyncIterator} A new iterator with the items from the given iterator
*/
export function wrap<T>(source?: MaybeIterableSource<T>): AsyncIterator<T> {
  if (!source) {
    return empty();
  }

  if (source instanceof AsyncIterator) {
    return source;
  }

  if (Array.isArray(source)) {
    return fromArray(source);
  }

  if (isPromise<IterableOrNullableSource<T>>(source)) {
    return fromPromise(source);
  }

  if (isValidSource<T>(source)) {
    return fromEventEmitter(source);
  }

  throw new TypeError(`Invalid source: ${source}`);
}
