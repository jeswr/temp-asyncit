import { READABLE, ERROR, SOURCE_DONE } from "../constants";
import { emitError, end, ending } from "../emitters";
import { AsyncIterator as _AsyncIterator } from "./AsyncIterator";

const ELEM = Symbol('elem');

export class AsyncIterableIterator<T> extends _AsyncIterator<T> {
  [READABLE] = true;
  [ELEM]: T | null = null;
  [ERROR]?: any;
  [SOURCE_DONE]?: boolean;

  // TODO: use an internal constant for source
  constructor(private source: AsyncIterator<T, T>) {
    super();
    // TODO: Introduce a pre-buffering mechanism
    this.buffer();
  }

  buffer() {
    this.source.next().then(value => {
      if (value.done) {
        ending.call(this);
        this[SOURCE_DONE] = true;
      } else {
        this[ELEM] = value.value;
      }
      this.readable = true;
    }).catch(err => {
      this[ERROR] = err;
      // We need to set readable when there is an error to
      // ensure it gets propogated
      this.readable = true;
    });
  }

  read(): T | null {
    const item = this[ELEM];
    this[ELEM] = null;

    if (ERROR in this) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }

    if (this[SOURCE_DONE]) {
      // @ts-ignore
      delete this.source;
      end.call(this);
    } else {
      this[READABLE] = false;
      this.buffer();
    }
    return item;
  }
}
