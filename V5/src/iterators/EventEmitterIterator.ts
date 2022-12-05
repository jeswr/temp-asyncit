import { addAsyncErrorForwardingDestination, addDestination, addSyncErrorForwardingDestination, destinationSetError, destinationSetReadable, destinationSourceDone, removeSyncErrorForwardingDestination } from "../utils/addDestination";
import { emitError, end, setReadable } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";
import { EventEmitter } from 'events';
import { DESTINATION, ERROR, SOURCE_DONE } from "../constants";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";
import { EventEmitterSource } from "../types";

export class EventEmitterIterator<T> extends AsyncIterator<T> {
  // TODO: Make these symbols
  [SOURCE_DONE] = false;
  [ERROR]?: any;

  constructor(private source: EventEmitterSource<T>) {
    super();
    // TODO: Make sure to removeAsyncErrorForwardingDestination
    addAsyncErrorForwardingDestination.call(this, source);
    source.on('end', destinationSourceDone);
    // *note* we cannot use the ON_PARENT_READABLE trick here since the
    // source is *not* an asynciterator from this library
    source.on('readable', destinationSetReadable);
  }

  read(): T | null {
    if (this[SOURCE_DONE]) {
      // TODO: Make sure to handle cleanup here
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
