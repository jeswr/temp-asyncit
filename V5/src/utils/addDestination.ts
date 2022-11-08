import { DESTINATION } from '../constants';
import { emitError } from '../emitters';

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
  // TODO: See if these need to be "emit error destination"
  source.on('error', emitErrorDestination);
  addDestination.call(this, source);
}

export function removeSyncErrorForwardingDestination<T, K>(source: any) {
  source.off('error', emitErrorDestination);
  delete source[DESTINATION];
}
