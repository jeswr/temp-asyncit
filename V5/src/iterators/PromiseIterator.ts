import { emitError, end } from "../emitters";
import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils";
import { AsyncIterator } from "./AsyncIterator";
import { wrap } from '../functions';
import { IterableOrNullableSource } from "../types";

export class PromiseIterator<T> extends AsyncIterator<T> {
  private source: AsyncIterator<T> | null = null;
  private pendingError: any = null;

  constructor(_source: Promise<IterableOrNullableSource<T>>) {
    super();
    _source.then(resolved => {
      const source = this.source = wrap(resolved);
      addSyncErrorForwardingDestination.call(this, source);
      this.readable = source.readable;
    }).catch(err => {
      this.pendingError = err;
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
    } else if (this.pendingError !== null) {
      emitError.call(this, this.pendingError);
      this.pendingError = null;
    }

    return null;
  }
}
