import type { EventEmitter } from 'events';
import { isFunction } from './isFunction';

// Determines whether the given object is an EventEmitter
export function isEventEmitter(object: any): object is EventEmitter {
  return isFunction(object.on);
}
