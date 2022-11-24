// import { addDestination } from "../addDestination";
// import { emitError, end } from "../emitters";
// import { destinationSetError } from "../emitters/destinationSetError";
// import { LinkedList } from "../linkedlist";
// import { taskScheduler } from "../taskScheduler";
// import { AsyncIterator } from "./AsyncIterator";

import { CAN_RUN_ITEM_GENERATION, ERROR, GENERATE_ITEMS, ON_PARENT_READABLE } from "../constants";
import { LinkedList } from "../datatypes/LinkedList";
import { emitError, end } from "../emitters";
import { queueItemGeneration } from "../iteratorTask";
import { addDestination } from "../utils";
import { AsyncIterator } from './AsyncIterator';

/**
  An iterator that generates items based on a source iterator.
  This class serves as a base class for other iterators.
  @extends module:asynciterator.BufferedIterator
*/
export class TransformIterator<S, D = S> extends AsyncIterator<D> {
  private buffer: LinkedList<D> = new LinkedList<D>();
  private transformScheduled = false;
  private boundPush = (e: D) => this.buffer.push(e);
  private [ERROR]?: any;
  private next = () => {
    // TODO: Check this
    // console.log('next', this.buffer.length)

    this.readable ||= this.buffer.length > 0;

    if (!this.transformScheduled &&
        this.buffer.length < this.maxBufferSize &&
        !(ERROR in this) &&
        this.source.readable
        ) {
          queueItemGeneration(this);
        }
  };
  private pendingError: any = null;

  constructor(
    private source: AsyncIterator<S>,
    private transform: (item: S, done: () => void, push: (i: D) => void) => void,
    private maxBufferSize = 4,
    private preBuffer = true,
  ) {
    super();
    // Add this as a destination of the source iterator
    addDestination.call(this, source);

    // Set pendingError on an error event
    source.on('error', destinationSetError);

    if (this.preBuffer)
      this[GENERATE_ITEMS]();
  }

  private [ON_PARENT_READABLE]() {
    if (this.source.done) {
      this.readable = true;
    } else {
      this[GENERATE_ITEMS]();
    }
  }

  private [GENERATE_ITEMS]() {
    let item;
    while (
      this[CAN_RUN_ITEM_GENERATION] &&
      this.buffer.length < this.maxBufferSize &&
      this.pendingError === null &&
      this.source.readable && 
      (item = this.source.read()) !== null
    ) {
      this.transform(item, this.next, this.boundPush);
      this.readable ||= this.buffer.length > 0;
    }
  }

  read(): D | null {
    const { buffer } = this;
    let item: D | null = null;

    if (!buffer.empty) {
      item = buffer.shift() as D;
      this[GENERATE_ITEMS]();
      return item;
    } else if (this.source) {
      this.readable = false
      this[GENERATE_ITEMS]();
    }

    if (ERROR in this) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }

    if (buffer.empty && this.source.done) {
      // TODO: Cleanup (destroy the buffer and if item generation is currently scheduled)
      end.call(this);
    }

    return null;
  }
}
