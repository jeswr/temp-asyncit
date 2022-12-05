import { emitError, end } from "../emitters";
import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils";
import { AsyncIterator } from "./AsyncIterator";
import { wrap } from '../functions';
import { IterableOrNullableSource } from "../types";
import { ERROR } from "../constants";

export class PromiseIterator<T> extends AsyncIterator<T> {
  // TODO: Make the source entry a symbol
  private source: AsyncIterator<T> | null = null;
  // TODO: Add tests for when the error is null, undefined etc. (since it can be)
  // this is why we cannot preset the value to null; since we need to do the *in* check
  // to see if it has been set, rather than just checking for null
  private [ERROR]?: any;

  constructor(_source: Promise<IterableOrNullableSource<T>>) {
    super();
    _source.then(resolved => {
      // TODO: Make source a symbol rather than a named property
      if (!this.done) {
        const source = this.source = wrap(resolved);
        addSyncErrorForwardingDestination.call(this, source);
        this.readable = source.readable;
      } else if ((resolved as any)?.destroy === 'function') {
        // Handle the case where the `PromiseIterator` is destroyed
        // *before* the promise has resolved.
        (resolved as any)?.destroy();
      }
    }).catch(err => {
      if (!this.done) {
        // Only create error and emit readable if we have not already
        // destroyed the iterator
        this[ERROR] = err;
        this.readable = true;
      }
    });
  }

  destroy() {
    const { source } = this;
    if (source !== null) {
      source.destroy();
      removeSyncErrorForwardingDestination.call(this, source);
      this.source = null;
    }
  }

  read(): T | null {
    const { source } = this;

    if (source !== null) {
      if (source.readable) {
        const item = source.read();
        if (item !== null) {
          return item;
        }
        if (!source.done) {
          this.readable = false;
        }
      }
  
      if (source.done) {
        // TODO: See if this needs to be called after the end event
        // TODO: Create a general cleanup function that can be shared
        removeSyncErrorForwardingDestination.call(this, source);
        this.source = null;
        end.call(this);
      }
    } else if (ERROR in this) {
      // In most iterators pending errors need to be the first thing
      // checked since 
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }

    return null;
  }
}
