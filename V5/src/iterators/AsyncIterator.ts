import { EventEmitter } from 'events';
import { addDestination, addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from '../utils';
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

// TODO: Double check that we do not need to be emitting the end event when destroy is called

/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends module:asynciterator.EventEmitter
*/
export abstract class AsyncIterator<T> extends EventEmitter implements globalThis.AsyncIterable<T> {
  private [STATE]: number;

  // Handling readable status and events
  protected [READABLE]: boolean = false;
  private [CAN_EMIT_READABLE]: boolean = true;

  // Handling flowing mode
  private [FLOWING]: boolean = false;
  private [EMIT_DATA_PENDING_OR_RUNNING]: boolean = false;

  // For optimised chaining of iterators
  private [DESTINATION]?: AsyncIteratorBase<any>;
  [ON_PARENT_READABLE]?(parent: AsyncIteratorBase<any>): void;

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

  // TODO: see if we should be using a custom symbol here rather than null
  abstract read(): T | null;

  /* Generates a textual representation of the iterator. */
  toString() {
    const details = this._toStringDetails();
    return `[${this.constructor.name}${details ? ` ${details}` : ''}]`;
  }

  // TODO: Implement a custom #toArray() for the buffered iterator where we go straight to the item generation calls
  toArray(options?: { limit?: number, preserve?: boolean }): Promise<T[]> {
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

          // TODO: Also make sure we destroy other iterators.
          if (options?.preserve !== true) {
            this.destroy();
          }

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
    Implementers should not override this method,
    but instead implement {@link module:asynciterator.AsyncIterator#_destroy}.
    @param {Error} [cause] An optional error to emit.
    @emits module:asynciterator.AsyncIterator.end
    @emits module:asynciterator.AsyncIterator.error Only if an error is passed.
  */
  destroy(cause?: Error) {
    if (!this.done) {
      this._destroy(cause, error => {
        cause = cause || error;
        // TODO: Make sure that this only is called synchronously
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

  // async next(...args: [] | [undefined]): Promise<IteratorResult<T, T>> {
  //   const arr = await this.toArray({ limit: 1 });
  //   if (arr.length === 1)
  //     return { value: arr[0] }
  //   else
  //     return { done: true, value: null }
  // }


  // TODO: Implement this so we can just do `Readable.from` in Comunica
  // when the readable type is needed
  async *[Symbol.asyncIterator]() {
    let item: T | null = null;
    
    if (DESTINATION in this) {
      throw new Error('Cannot iterate using "for await" syntax when iterator has another destination');
    }

    const destination = this[DESTINATION] = Object.create(null);
    const wait = () => new Promise<true>(res => { destination[ON_PARENT_READABLE] = res });

    while (!this.done && (this.readable || (await wait(), true)))
      while ((item = this.read()) !== null)
        yield item;

    delete this[DESTINATION];
  }

  // async *[Symbol.asyncIterator]() {
  //   let item: T | null = null;

  //   const wait = () => new Promise<true>(res => {
  //     this[DESTINATION] = {
  //       [ON_PARENT_READABLE]: () => {
  //         delete this[DESTINATION];
  //         res(true);
  //       }
  //     } as any;
  //   });

  //   while (!this.done && (this.readable || await wait()))
  //     while ((item = this.read()) !== null)
  //       yield item;
  // }

  // [Symbol.asyncIterator]() {
  //   let item: T | null = null;
  //   let err;

  //   const next = () => this.toArray({ limit: 1 })

  //   const self = this;

  // const gen = async function*() {
  // while ((item = self.read()) !== null) {
  //   yield item;
  // }
  //   }


  //   return this;
  // }
  // TODO: Work out how to handle map etc. operations across files
}


