import { AsyncIterator } from "./AsyncIterator";
import { SynchronousTransformIterator } from "./SynchronousTransformIterator";

export class MappingIterator<S, D = S> extends SynchronousTransformIterator<S, D> {
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

export class CompositeMappingIterator<S, D = S> extends SynchronousTransformIterator<S, D> {
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
    if (!this.root.readable) {
      this.readable = false;
      return null;
    }

    let mapped : any = null;
    while (mapped === null && (mapped = this.root.read()) !== null) {
      for (let i = 0; i < this.mappings.length; i++) {
        mapped = this.mappings[i](mapped);
        if (mapped === null)
          break;
      }
    }
    return mapped;
  }

  map<K>(map: MapFunction<D, K>, self?: any): AsyncIterator<K> {
    return new CompositeMappingIterator(this.root, [...this.mappings, bind(map, self)], this);
  }
}

// Returns a function that calls `fn` with `self` as `this` pointer. */
export function bind<T extends Function>(fn: T, self?: object): T {
  return self ? fn.bind(self) : fn;
}
