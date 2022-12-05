import { DESTINATION, ERROR, SOURCE_DONE } from '../constants';
import { emitError, setReadable } from '../emitters';
import { EventEmitterIterator } from '../iterators';

export interface MinimalSource<T> {
  [DESTINATION]?: any;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export function addDestination<T, K>(this: any, source: any) {
  if (DESTINATION in source) {
    throw new Error("Attempted to add destination to asynciterator source with existing destination");
  }
  source[DESTINATION] = this;
}

export function emitErrorDestination<T>(this: any, error: any) {
  emitError.call(this[DESTINATION], error);
}

export function addSyncErrorForwardingDestination<T, K>(this: any, source: any) {
  source.on('error', emitErrorDestination);
  addDestination.call(this, source);
}

export function removeSyncErrorForwardingDestination<T, K>(source: any) {
  source.off('error', emitErrorDestination);
  delete source[DESTINATION];
}

export function addAsyncErrorForwardingDestination<T, K>(this: any, source: any) {
  source.on('error', destinationSetError);
  addDestination.call(this, source);
}

export function removeAsyncErrorForwardingDestination<T, K>(source: any) {
  source.off('error', destinationSetError);
  delete source[DESTINATION];
}

export function destinationSetReadable<T>(this: { [DESTINATION]: AsyncIterator<T> }) {
  setReadable.call(this[DESTINATION]);
}

export function destinationSourceDone<T>(this: { [DESTINATION]: EventEmitterIterator<T> }) {
  this[DESTINATION][SOURCE_DONE] = true;
  setReadable.call(this[DESTINATION]);
}

export function destinationSetError<T>(this: { [DESTINATION]: EventEmitterIterator<T> }, error: any) {
  this[DESTINATION][ERROR] = error;
  setReadable.call(this[DESTINATION]);
}
