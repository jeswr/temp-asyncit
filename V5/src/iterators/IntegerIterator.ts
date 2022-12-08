import { READABLE } from '../constants';
import { end, ending } from '../emitters';
import { AsyncIterator } from './AsyncIterator';

export class IntegerIterator extends AsyncIterator<number> {
  [READABLE] = true;
  // TODO: Make, next, step and last symbols
  private next: number;
  private step: number;
  private last: number;

  /**
    Creates a new `IntegerIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.start=0] The first number to emit
    @param {integer} [options.end=Infinity] The last number to emit
    @param {integer} [options.step=1] The increment between two numbers
  */
  constructor({ start = 0, step = 1, end } :
      { start?: number, step?: number, end?: number } = {}) {
    super();

    this.next = Number.isFinite(start) ? Math.trunc(start) : start;
    this.step = Number.isFinite(step) ? Math.trunc(step) : step;

    // Determine the last number
    const direction = step >= 0 ? Infinity : -Infinity;
    if (Number.isFinite(end))
      end = Math.trunc(end as number);
    else if (end !== -direction)
      end = direction;
    this.last = end;

    // Start iteration
    this.readable = true;
  }

  /* Reads an item from the iterator. */
  read() {
    const { next, step, last } = this;

    if (next === last && step !== 0) {
      ending.call(this);
    }

    if (step >= 0 ? next > last : next < last) {
      end.call(this);
      return null;
    }

    this.next += step;
    return next;
  }

  /* Generates details for a textual representation of the iterator. */
  protected _toStringDetails() {
    return `(${this.next}...${this.last})`;
  }

  toArray(options?: { limit?: number }): Promise<number[]> {
    if (this.done) {
      return Promise.resolve([])
    }

    let { step, last, next } = this;
    let limit = Math.min(
      typeof options?.limit === 'number' ? options.limit : Infinity,
      step >= 0 ? next - last : next - last
    );

    if (limit === Infinity) {
      throw new Error('Attempting to convert an infinite iterator to an Array');
    }

    let arr: number[] = [];
    for (; limit >= 0; limit--) {
      arr.push(next += step);
    }

    // TODO: Update next can call the end event if appropriate

    return Promise.resolve(arr);
  }
}
