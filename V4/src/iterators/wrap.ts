import { addDestination, addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../addDestination";
import { emitError, end, setReadable } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";
import { EventEmitter } from 'events';
import { DESTINATION } from "../constants";
import { fromArray } from "./ArrayIterator";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";

class IterableIterator<T> extends AsyncIterator<T> {
  constructor(private source: Iterator<T>) {
    super();
    this.readable = true;
  }

  read(): T | null {
    let next: IteratorResult<T>;
    while (!(next = this.source.next()).done) {
      if (next.value !== null)
        return next.value;
    }
    end.call(this);
    return null;
  }
}

class PromiseIterator<T> extends AsyncIterator<T> {
  private source: AsyncIterator<T> | null = null;
  private pendingError: any = null;

  constructor(_source: Promise<any>) {
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
        this.readable = false;
      }
  
      if (source.done) {
        // TODO: See if this needs to be called after the end event
        removeSyncErrorForwardingDestination.call(this, source);
        end.call(this);
      }
  
      if (this.pendingError !== null) {
        emitError.call(this, this.pendingError);
        this.pendingError = null;
      }
    }

    return null;
  }
}

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

class EventEmitterIterator<T> extends AsyncIterator<T> {
  sourceDone = false;
  pendingError = null;

  constructor(private source: EventEmitter & { read(): T | null; readable?: boolean }) {
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


// TODO: Make sure that the buffered iterator still attempts to do synchronous reads when possible.

/**
  Creates an iterator that wraps around a given iterator or readable stream.
  Use this to convert an iterator-like object into a full-featured AsyncIterator.
  After this operation, only read the returned iterator instead of the given one.
  @function
  @param [source] The source this iterator generates items from
  @param {object} [options] Settings of the iterator
  @returns {module:asynciterator.AsyncIterator} A new iterator with the items from the given iterator
*/
export function wrap<T>(source?: MaybePromise<IterableSource<T>> | null): AsyncIterator<T> {
  if (!source) {
    return empty();
  }

  if (source instanceof AsyncIterator) {
    return source;
  }

  if (Array.isArray(source)) {
    return fromArray(source);
  }

  if (isPromise(source)) {
    return new PromiseIterator(source);
  }

  if (isValidSource(source)) {
    return EventEmitterIterator(source);
  }
}
