import { EventEmitterSource } from "../types";
import { isEventEmitter } from "./isEventEmitter";
import { isFunction } from "./isFunction";

// Validates an AsyncIterator for use as a source within another AsyncIterator
export function isValidSource<T>(source: any): source is EventEmitterSource<T> {
  return isFunction(source.read) && isEventEmitter(source);
}
