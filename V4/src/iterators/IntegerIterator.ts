import { end } from '../emitters';
import { AsyncIterator } from './AsyncIterator';
import { MappingIterator } from "./MappingIterator";

export class IntegerIterator extends AsyncIterator<number> {
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

export function range(start: number, end: number, step?: number): AsyncIterator<number> {
  return new IntegerIterator({ start, end, step });
}


// console.time('integeriterator')
// // let _it: AsyncIterator<AsyncIterator<number>> = new MappingIterator(range(0, 10000), () => range(0, 5000))
// // let it: AsyncIterator<number> = new UnionIterator(new MappingIterator(range(0, 1000), () => range(0, 10000)))
// // let it: AsyncIterator<number> = new UnionIterator(new MappingIterator(range(0, 1), () => range(0, 50)))
// // const __it = new UnionIterator(_it);

// // const it = __it

// // let x = 0

// // const it = new TransformIterator(__it, (item, done, push) => {
// //   x += 1;

// //   if (x === 10) {
// //     setTimeout(() => { push(100); done() }, 0)
// //   } else if (item === 100) {
// //     Promise.resolve().then(() => {
// //       push(item);
// //       done();
// //     })
// //   } else {
// //     push(item);
// //     done();
// //   }
// // })

// // const it = __it;

// let it = range(0, 10_000_000);

// for (let i = 0; i < 50; i++) {
//   // it = new MappingIterator(it, x => x + 1)
//   it = it.map(x => x + 1);
//   if (i % 2 === 0) {
//     it = it.map(x => x % 2 === 0 ? null : x);
//     // it = new MappingIterator(it, x => x % 2 === 0 ? null : x)
//   }
// }

// console.time('date')
// // let t = Date.now();
// // for (let i = 0; i < 100_000_000; i++) {
// //   const diff = - t + (t = Date.now())
// //   console.log(diff)
// // }
// console.timeEnd('date')

// let i = 0;

// // const it2 = new UnionIterator(new MappingIterator(range(0, 10), x => x === 0 ? it : range(1, 9)))

// it.on('data', (data) => {
//   i++;
// });
// it.on('end', () => {
//   console.log(i);
//   console.timeEnd('integeriterator');
// })
