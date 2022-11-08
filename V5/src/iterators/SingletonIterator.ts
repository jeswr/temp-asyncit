import { READABLE } from '../constants';
import { end } from '../emitters';
import { AsyncIterator } from "./AsyncIterator";

/**
  An iterator that emits a single item.
  @extends module:asynciterator.AsyncIterator
*/
export class SingletonIterator<T> extends AsyncIterator<T> {
  [READABLE] = true;

  /**
    Creates a new `SingletonIterator`.
    @param {object} item The item that will be emitted.
  */
  constructor(private item: T | null) {
    super();
  }

  read() {
    const { item } = this;

    if (item === null)
      end.call(this);
    else
      this.item = null;

    return item;
  }
}
