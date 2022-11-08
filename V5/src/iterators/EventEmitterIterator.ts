import { addDestination, addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils/addDestination";
import { emitError, end, setReadable } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";
import { EventEmitter } from 'events';
import { DESTINATION } from "../constants";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";
import { EventEmitterSource } from "../types";

function destinationSetReadable<T>(this: { [DESTINATION]: AsyncIterator<T> }) {
  setReadable.call(this[DESTINATION]);
}

function destinationSourceDone<T>(this: { [DESTINATION]: EventEmitterIterator<T> }) {
  this[DESTINATION].sourceDone = true;
  setReadable.call(this[DESTINATION]);
}

function destinationSetError<T>(this: { [DESTINATION]: { pendingError: any } & AsyncIteratorBase<T> }, error: any) {
  this[DESTINATION].pendingError = error;
  setReadable.call(this[DESTINATION]);
}

export class EventEmitterIterator<T> extends AsyncIterator<T> {
  // TODO: Make these symbols
  sourceDone = false;
  pendingError = null;

  constructor(private source: EventEmitterSource<T>) {
    super();
    this.source = source;
    addDestination.call(this, source);
    source.on('end', destinationSourceDone);
    source.on('error', destinationSetError);
    source.on('readable', destinationSetReadable);
  }

  read(): T | null {
    if (this.sourceDone) {
      end.call(this);
    } else if (this.pendingError !== null) {
      emitError.call(this, this.pendingError);
      // TODO: See if we need to end
    } else if (this.source.readable !== false) {
      const item = this.source.read();
      if (item !== null)
        return item;
      this.readable = false;
    }
    return null;
  }
}
