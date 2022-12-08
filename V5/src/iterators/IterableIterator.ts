import { READABLE } from "../constants";
import { end } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";

// *Note* - we cannot do ending without a lookahead here

export class IterableIterator<T> extends AsyncIterator<T> {
  [READABLE] = true;

  constructor(private source: Iterator<T>) {
    super();
  }

  destroy() {
    // @ts-ignore
    this.source = null;
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
