import type { AsyncIterator } from '../iterators';
import { IterableIterator } from '../iterators/IterableIterator';
import { EventEmitter } from 'events';

/**
 Creates an iterator for the given Iterator.
 @param {Iterable} source the iterator
 */
 export function fromIterator<T>(source: Iterator<T>): AsyncIterator<T> {
  return new IterableIterator(source);
}

// TODO: Work out whether we should use this custom event emitter logic

// data
// error

// end
// readable

// const EVENTS = Symbol('events');
// const EVENTS_COUNT = Symbol('events_count');

// const READABLE = Symbol('readable_event');
// const DATA = Symbol('data_event');
// const ERROR = Symbol('error_event');
// const END = Symbol('end_event');

// const map = {
//   readable: READABLE,
//   data: DATA,
//   error: ERROR,
//   end: END,
// }

// function emit(emitter: any, evt: typeof READABLE | typeof END) {
//   const listeners = emitter[EVENTS][evt];

//   if (listeners) {

//     if (listeners.fn) {
//       if (listeners.once) // TODO DELETE HERE
//     }
  
//   }
// }

// function addListener(emitter: any, evt: 'readable' | 'data' | 'error' | 'end', fn: Function) {
//   emitter[EVENTS][map[evt]]
// }
