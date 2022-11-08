import { READABLE, ERROR } from "../constants";
import { emitError, end } from "../emitters";
import { AsyncIterator as _AsyncIterator } from "./AsyncIterator";

const ELEM = Symbol('elem');
// TODO: Use a 
const DONE = Symbol('done');


export class IterableIterator<T> extends _AsyncIterator<T> {
  [READABLE] = true;
  [ELEM]: T | null = null;
  [ERROR]?: any;
  [DONE]?: boolean;

  // TODO: use an internal constant for source
  constructor(private source: AsyncIterator<T, T>) {
    super();

    source.next().then(value => {
      if (value.done) {
        this[DONE] = true;
      } else {
        this[ELEM] = value.value;
      }
      this.readable = true;
    }).catch(err => {
      this[ERROR] = err;
    });
  }

  read(): T | null {
    const item = this[ELEM];
    if (item !== null) {
      this[ELEM] = null;
      this[READABLE] = false;

      // TODO: Refactor this into another function and work out whether we should have a 
      this.source.next().then(value => {
        if (value.done) {
          this[DONE] = true;
        } else {
          this[ELEM] = value.value;
        }
        this.readable = true;
      }).catch(err => {
        this[ERROR] = err;
      });

      return item;
    }
    if (this[DONE]) {
      end.call(this);
    }
    if (this[ERROR]) {
      emitError.call(this, this[ERROR]);
    }
    return null;
  }
}
