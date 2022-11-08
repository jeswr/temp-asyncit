import { EventEmitter } from 'events';
import { addDestination, addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from '../addDestination';
import {
  ON_PARENT_READABLE,
  DESTINATION, FLOWING,
  EMIT_DATA_PENDING_OR_RUNNING,
  CAN_EMIT_READABLE,
  READABLE,
  STATE,
  OPEN,
  ENDED,
  GENERATE_ITEMS,
  CAN_RUN_ITEM_GENERATION,
  PROPERTIES,
  PROPERTY_CALLBACKS
} from '../constants';
import { setReadable, removeListener, newListener, end } from '../emitters';
import { MapFunction } from '../types';
import { AsyncIteratorBase } from '../types/AsyncIteratorBase';


/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends module:asynciterator.EventEmitter
*/
export abstract class AsyncIterator<T> extends EventEmitter {
  private [STATE]: number;

  // Handling readable status and events
  private [READABLE]: boolean = false;
  private [CAN_EMIT_READABLE]: boolean = true;

  // Handling flowing mode
  private [FLOWING]: boolean = false;
  private [EMIT_DATA_PENDING_OR_RUNNING]: boolean = false;

  // For optimised chaining of iterators
  private [DESTINATION]?: AsyncIteratorBase<any>;
  private [ON_PARENT_READABLE]?(parent: AsyncIteratorBase<any>): void;

  // For iterators with asynchronous item generation
  private [CAN_RUN_ITEM_GENERATION]?: boolean;
  private [GENERATE_ITEMS]?: () => void;

  // For attaching metadata to iterators
  private [PROPERTIES]?: { [name: string]: any };
  private [PROPERTY_CALLBACKS]?: { [name: string]: [(value: any) => void] };

  /** Creates a new `AsyncIterator`. */
  constructor(state = OPEN) {
    super();
    this[STATE] = OPEN
    this.on('removeListener', removeListener);
    this.on('newListener', newListener);
  }

  /**
    Gets or sets whether this iterator might have items available for read.
    A value of `false` means there are _definitely_ no items available;
    a value of `true` means items _might_ be available.
    @type boolean
    @emits module:asynciterator.AsyncIterator.readable
  */
  get readable() {
    return this[READABLE];
  }

  set readable(readable) {
    if (readable)
      setReadable.call(this);
    else
      this[READABLE] = false;
  }

  /**
    Gets whether the iterator will not emit anymore items,
    either due to being closed or due to being destroyed.
    @type boolean
    @readonly
  */
  get done() {
    return this[STATE] >= ENDED;
  }

  abstract read(): T | null;

  map<K>(map: MapFunction<T, K>, self?: any): AsyncIterator<K> {
    return new MappingIterator(this, bind(map, self));
  }

  /* Generates a textual representation of the iterator. */
  toString() {
    const details = this._toStringDetails();
    return `[${this.constructor.name}${details ? ` ${details}` : ''}]`;
  }

  // TODO: Implement a custom #toArray() for the buffered iterator where we go straight to the item generation calls
  toArray(options?: { limit?: number }): Promise<T[]> {
    return new Promise((res, rej) => {
      let items: T[] = [];
      const limit = typeof options?.limit === 'number' ? options.limit : Infinity;
  
      const reject = (reason: any) => {
        delete this[DESTINATION];
        this.off('error', reject);
        rej(reason);
      }

      const readable = () => {
        if (this.readable && !this.done) {

          if (this[EMIT_DATA_PENDING_OR_RUNNING]) {
            throw new Error('AsyncIterator#toArray() should not be called while data listeners are attached');
          }

          this[EMIT_DATA_PENDING_OR_RUNNING] = true;

          let item: T | null;
          while (items.length < limit && (item = this.read()) !== null) {
            items.push(item);
          }

          this[EMIT_DATA_PENDING_OR_RUNNING] = false;
        }
        if (items.length >= limit || this.done) {
          this.off('error', reject);
          delete this[DESTINATION];
          res(items)
        }
      }

      addDestination.call({ [ON_PARENT_READABLE]: readable }, this);
      readable();
    });
  }


  /**
    Destroy the iterator and stop it from generating new items.
    This will not do anything if the iterator was already ended or destroyed.
    All internal resources will be released an no new items will be emitted,
    even not already generated items.
    Implementors should not override this method,
    but instead implement {@link module:asynciterator.AsyncIterator#_destroy}.
    @param {Error} [cause] An optional error to emit.
    @emits module:asynciterator.AsyncIterator.end
    @emits module:asynciterator.AsyncIterator.error Only if an error is passed.
  */
  destroy(cause?: Error) {
    if (!this.done) {
      this._destroy(cause, error => {
        cause = cause || error;
        if (cause)
          this.emit('error', cause);
        // TODO: Make sure cleanup is done here
        // it look likes this was right w.r.t the spec of not requiring to emit anything; we just need to make
        // sure we do the appropriate cleanup
        // this._end(true);
      });
    }
  }

  /**
    Called by {@link module:asynciterator.AsyncIterator#destroy}.
    Implementers can override this, but this should not be called directly.
    @param {?Error} cause The reason why the iterator is destroyed.
    @param {Function} callback A callback function with an optional error argument.
  */
  protected _destroy(cause: Error | undefined, callback: (error?: Error) => void) {
    callback();
  }

  /**
    Generates details for a textual representation of the iterator.
    @protected
  */
  protected _toStringDetails() {
    return '';
  }
}

/**
 An iterator that synchronously transforms every item from its source
 by applying a mapping function.
 @extends module:asynciterator.AsyncIterator
*/
abstract class SynchronousTransformIterator<S, D = S> extends AsyncIterator<D> {
  // TODO: See if we don't need to bind to this
  // Optimisation - in the case of the composite iterator
  // public onParentReadable = setReadable.bind(this);

  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    protected source: AsyncIterator<S>
  ) {
    super();
    // TODO: See if we need this
    // I don't think we do if we can assume the source is an asynciterator
    // ensureSourceAvailable(source);

    // In synchronous transformations we assume that .read() on super classes are only made at the same time
    // as the current read call and hence it is safe to forward the error immediately.
    addSyncErrorForwardingDestination.call(this, source);
    this.readable = source.readable;
  }

  protected abstract safeRead(): D | null;

  /* Tries to read the next item from the iterator. */
  read(): D | null {
    // Try to read an item that maps to a non-null value
    // TODO: See if we actually need to *check* readability here
    // Close this iterator if the source is empty
    // if (this.source.done) {
    //   removeSyncErrorForwardingDestination(this.source);
    //   end.call(this);
    // }

    if (this.source.readable) {
      const item = this.safeRead();
      if (item !== null) {
        return item;
      }
    }

    this.readable = false;

    // Close this iterator if the source is empty
    if (this.source.done) {
      removeSyncErrorForwardingDestination(this.source);
      end.call(this);
    }

    return null;
  }
}

SynchronousTransformIterator.prototype[ON_PARENT_READABLE] = setReadable;

class MappingIterator<S, D = S> extends SynchronousTransformIterator<S, D> {
  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    source: AsyncIterator<S>,
    private _map: MapFunction<S, D>
  ) {
    super(source);
  }

  /* Tries to read the next item from the iterator. */
  safeRead(): D | null {
    let item: D | S | null;
    while ((item = this.source.read()) !== null) {
      if ((item = this._map(item)) !== null)
        return item;
    }
    return null;
  }

  map<K>(map: MapFunction<D, K>, self?: any): AsyncIterator<K> {
    return new CompositeMappingIterator(this.source, [this._map, bind(map, self)], this);
  }
}

class CompositeMappingIterator<S, D = S> extends SynchronousTransformIterator<S, D> {
  constructor(
    private root: AsyncIterator<S>,
    private mappings: MapFunction<any, any>[] = [],
    source: AsyncIterator<any>
  ) {
    super(source);
  }

  safeRead() {
    // TODO: See if this is actually necessary
    // A source should only be read from if readable is true

    if (this.root.readable) {
      const { mappings, root } = this;
      for (
        let i, mapped = null;
        (mapped === null && (i = 0, mapped = root.read()) === null) || i === mappings.length;
        mapped = mappings[i++](mapped)
      );


      while ((mapped = this.root.read()) !== null) {
        for (let i = 0; (mapped = this.mappings[i++](mapped)) !== null && i < this.mappings.length;);

        if (mapped !== null)
          return mapped;
      }


      // while ((mapped = this.root.read()) !== null) {
      //   for (let i = 0; i < this.mappings.length && mapped !== null; mapped = this.mappings[i++](mapped));

      //   if (mapped !== null)
      //     return mapped;
      // }
    }

    // TODO Remove this case?
    if (this.source.readable && this.source.read() !== null) {
      throw new Error('boo')
    }

    this.readable = false;

    if (this.source.done) {
      end.call(this);
    }

    return mapped;
  }

  map<K>(map: MapFunction<D, K>, self?: any): AsyncIterator<K> {
    return new CompositeMappingIterator(this.root, [...this.mappings, bind(map, self)], this);
  }
}

// Returns a function that calls `fn` with `self` as `this` pointer. */
function bind<T extends Function>(fn: T, self?: object): T {
  return self ? fn.bind(self) : fn;
}

