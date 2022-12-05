import { AsyncIterator } from "./AsyncIterator";
import { addSyncErrorForwardingDestination, emitErrorDestination, removeSyncErrorForwardingDestination } from "../utils";
import { emitError, end } from "../emitters";
import { ERROR, GENERATE_ITEMS, ON_PARENT_READABLE } from "../constants";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";

// TODO: 

// TODO: Exploit the fact that we have access to synchronous readable events to go straight to the iterator
// that emitted readable.

function setPendingError<T>(this: UnionIterator<T>, error: any) {
  this[ERROR] = error;
}


// TODO: Bring over error from https://github.com/RubenVerborgh/AsyncIterator/pull/81/files
/**
  An iterator that generates items by reading from multiple other iterators.
  @extends module:asynciterator.AsyncIterator
*/
export class UnionIterator<T> extends AsyncIterator<T> {
  private maybeReadable: Set<AsyncIterator<T>> = new Set();
  private live: Set<AsyncIterator<T>> = new Set();
  protected source?: AsyncIterator<AsyncIterator<T>>;
  private [ERROR]?: any;

  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    source: AsyncIterator<AsyncIterator<T>> | AsyncIterator<T>[],
    private maxParallelIterators: number = Infinity,
    private preBuffer = true,
  ) {
    super();

    if (Array.isArray(source)) {
      this.live = new Set(source);

      for (const iterator of source) {
        if (!iterator.done && iterator.readable) {
          this.maybeReadable.add(iterator);
        }
      }

      this.readable = this.maybeReadable.size > 0;
    } else {
      // TODO: See if we need this
      // I don't think we do if we can assume the source is an asynciterator
      // ensureSourceAvailable(source);

      // In synchronous transformations we assume that .read() on super classes are only made at the same time
      // as the current read call and hence it is safe to forward the error immediately.
      addSyncErrorForwardingDestination.call(this, source);

      // We pre-buffer by default so that we only emit the readable event
      // when there is *actually* an element to read.
      if (preBuffer) {
        this.buffer();
      } else {
        this.readable = true;
      }
    }
  }

  // 
  private buffer() {
    const { source, maxParallelIterators } = this;

    if (!source)
      return;

    let iterator;
    source.off('error', emitErrorDestination);
    source.on('error', setPendingError)
    while (this.live.size < maxParallelIterators && source.readable && (iterator = source.read()) !== null) {
      // TODO: Re-enable this once we have ending states working
      // if (iterator.ending) {
      //   // This is just triggering the iterator to end
      //   // by convention it should only emit null, and not emit errors when in this ending state
      //   iterator.read();
      // } else 
      if (!iterator.done) {
        addSyncErrorForwardingDestination.call(this, iterator);
        this.live.add(iterator);

        if (iterator.readable) {
          this.maybeReadable.add(iterator);
          this.readable = true;
          return;
        }
      }
    }
    source.off('error', setPendingError)
    source.on('error', emitErrorDestination);
  }

  // private [GENERATE_ITEMS]() {

  // }

  // TODO: Fix this by adding AsyncIterator<T> | AsyncIterator<AsyncIterator<T>>
  [ON_PARENT_READABLE](parent: AsyncIteratorBase<any>) {
    if ((parent as any) !== this.source) {

      // TODO: Add performance optimisations to reduce the number of instances where the iterator is set to `.readable`
      // only for it to emit null. In this instance we should
      // 1. Check if the parent is readable because it is in and ending state. In that case we should not add to maybe
      // readable; instead we should unsubscribe it and only set to readable if this.live.size < this.maxParallelIterators && source.readable === true
      // Note that we can't just call read to see if it emits an element because of the error forwarding logic


      this.maybeReadable.add(parent as any);
      this.readable = true;
    } else if (this.live.size < this.maxParallelIterators && !this.readable) {
      this.buffer();
    }
  }

  // TODO: See if case of elements being added to maybeReadable during read() call needs to be handled
  // TODO: See if it is more performant to wrap this all in a try/catch rather than having 
  // addSyncErrorForwardingDestination and removeSyncErrorForwardingDestination listeners
  read(): T | null {
    const { maybeReadable, live, source, maxParallelIterators } = this;
    let item: | T | null = null;
    let iterator: AsyncIterator<T> | null;

    // TODO: Refactor this into a utility function for *all* iterators that have to handle
    // errors like this
    // TODO: See if we should be emitting null on erroring cases (I don't *think* we should but it is also worht checking)
    if (ERROR in this) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }

    // TODO: add an if ERROR in this check here
    // TODO: Investigate the performance impact of sets
    for (iterator of maybeReadable) {
      if (iterator.readable && (item = iterator.read()) !== null)
        return item;

      maybeReadable.delete(iterator);

      if (iterator.done) {
        removeSyncErrorForwardingDestination(iterator);
        live.delete(iterator);
      }
    }

    while (live.size < maxParallelIterators && source && source.readable && (iterator = source.read()) !== null) {
      addSyncErrorForwardingDestination.call(this, iterator);

      if (iterator.readable && (item = iterator.read()) !== null) {
        // TODO: Add a .ending check here before adding it to live and maybeReadable sets
        live.add(iterator);

        if (iterator.readable) {
          maybeReadable.add(iterator);
        }

        return item;
      }

      if (iterator.done)
        removeSyncErrorForwardingDestination(iterator);
      else
        live.add(iterator);
    }

    if (live.size === 0 && (!source || source.done))
      end.call(this);
    else
      this.readable = false;

    return null;
  }


  // TODO: Do not forward the cause!! (I think)
  destroy(cause?: Error | undefined) {
    super.destroy(cause);

    // TODO: Cleanup by destroying .live .readable etc.
    // Note - for now we have removed the destroy sources
    // option entirely and we are just doing it automatically
    for (const source of this.live) {
      source.destroy(cause);
    }

    // Destroy the original source
    // note that this is *not* going to destroy
    // any remaining elements in the source unless
    // we have a specialised way of doing that in
    // the source iterator
    this.source?.destroy(cause);
  }
}
