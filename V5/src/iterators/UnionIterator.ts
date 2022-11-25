import { AsyncIterator } from "./AsyncIterator";
import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../utils";
import { end } from "../emitters";
import { GENERATE_ITEMS, ON_PARENT_READABLE } from "../constants";
import { AsyncIteratorBase } from "../types/AsyncIteratorBase";

// TODO: 

// TODO: Exploit the fact that we have access to synchronous readable events to go straight to the iterator
// that emitted readable.

/**
  An iterator that generates items by reading from multiple other iterators.
  @extends module:asynciterator.AsyncIterator
*/
export class UnionIterator<T> extends AsyncIterator<T> {
  private maybeReadable: Set<AsyncIterator<T>> = new Set();
  private live: Set<AsyncIterator<T>> = new Set();
  protected source?: AsyncIterator<AsyncIterator<T>>;
  
  /**
   * Applies the given mapping to the source iterator.
   */
   constructor(
    source: AsyncIterator<AsyncIterator<T>> | AsyncIterator<T>[],
    private maxParallelIterators: number = Infinity,
    private preBuffer = false,
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

    // TODO: Add a prebuffering mechanism here where we check
    if (preBuffer) {
// Note - the main caveat is in this case is that we cannot do sync error forwarding, instead what we need to do
    // is store the error as pending until we are prepared to handle it
    let iterator;
    while (this.live.size < maxParallelIterators && source.readable && (iterator = source.read()) !== null) {
      // TODO: Re-enable this
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
    }
    
    // this.readable = source.readable;
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
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
    } else if (this.live.size < this.maxParallelIterators) {
      this.readable = true;
    }
  }

  // TODO: See if case of elements being added to maybeReadable during read() call needs to be handled
  // TODO: See if it is more performant to wrap this all in a try/catch rather than having 
  // addSyncErrorForwardingDestination and removeSyncErrorForwardingDestination listeners
  read(): T | null {
    const { maybeReadable, live, source, maxParallelIterators } = this;
    let item: | T | null = null;
    let iterator: AsyncIterator<T> | null;

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
