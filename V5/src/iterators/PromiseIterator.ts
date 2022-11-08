import { emitError, end } from "../emitters";
import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils";
import { AsyncIterator } from "./AsyncIterator";
import { wrap } from '../functions';
import { IterableOrNullableSource } from "../types";
import { ERROR } from "../constants";

export class PromiseIterator<T> extends AsyncIterator<T> {
  private source: AsyncIterator<T> | null = null;
  // TODO: Add tests for when the error is null, undefined etc. (since it can be)
  // this is why we cannot preset the value to null; since we need to do the *in* check
  // to see if it has been set, rather than just checking for null
  private [ERROR]: any = null;

  constructor(_source: Promise<IterableOrNullableSource<T>>) {
    super();
    _source.then(resolved => {
      // TODO: Make source a symbol rather than a named property
      const source = this.source = wrap(resolved);
      addSyncErrorForwardingDestination.call(this, source);
      this.readable = source.readable;
    }).catch(err => {
      this[ERROR] = err;
      this.readable = true;
    });
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
        removeSyncErrorForwardingDestination.call(this, source);
        end.call(this);
      }
    } else if (this[ERROR] !== null) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }

    return null;
  }
}
