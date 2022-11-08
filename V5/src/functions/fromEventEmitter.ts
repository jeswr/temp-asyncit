import { AsyncIterator, EventEmitterIterator } from '../iterators';
import { EventEmitterSource } from '../types';

/**
  Creates an iterator for the given event emitter.
  @param {EventEmitterSource<T>} source an event emitter source to read items from
 */
  export function fromEventEmitter<T>(source: EventEmitterSource<T>): AsyncIterator<T> {
    return new EventEmitterIterator(source);
  }
  