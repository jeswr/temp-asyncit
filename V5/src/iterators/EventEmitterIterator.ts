import { addDestination, addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils/addDestination";
import { emitError, end, setReadable } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";
import { EventEmitter } from 'events';
import { DESTINATION, ERROR } from "../constants";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";
import { EventEmitterSource } from "../types";

const SOURCE_DONE = Symbol('source_done')

function destinationSetReadable<T>(this: { [DESTINATION]: AsyncIterator<T> }) {
  setReadable.call(this[DESTINATION]);
}

function destinationSourceDone<T>(this: { [DESTINATION]: EventEmitterIterator<T> }) {
  this[DESTINATION][SOURCE_DONE] = true;
  setReadable.call(this[DESTINATION]);
}

function destinationSetError<T>(this: { [DESTINATION]: EventEmitterIterator<T> }, error: any) {
  this[DESTINATION][ERROR] = error;
  setReadable.call(this[DESTINATION]);
}

export class EventEmitterIterator<T> extends AsyncIterator<T> {
  // TODO: Make these symbols
  [SOURCE_DONE] = false;
  [ERROR]?: any;

  constructor(private source: EventEmitterSource<T>) {
    super();
    this.source = source;
    addDestination.call(this, source);
    source.on('end', destinationSourceDone);
    source.on('error', destinationSetError);
    source.on('readable', destinationSetReadable);
  }

  read(): T | null {
    if (this[SOURCE_DONE]) {
      end.call(this);
    } else if (!(ERROR in this)) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
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
