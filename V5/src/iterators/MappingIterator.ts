import { end } from "../emitters";
import { MapFunction } from "../types";
import { bind } from "../utils";
import { SynchronousTransformIterator } from "./abstract/SynchronousTransformIterator";
import type { AsyncIterator } from './AsyncIterator';

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
    let mapped = null;

    if (this.root.readable) {
      const { mappings, root } = this;
      // TODO: See if any of these micro-optimisations are usefyul
      // for (
      //   let i, mapped = null;
      //   (mapped === null && (i = 0, mapped = root.read()) === null) || i === mappings.length;
      //   mapped = mappings[i++](mapped)
      // );


      // while ((mapped = this.root.read()) !== null) {
      //   for (let i = 0; (mapped = this.mappings[i++](mapped)) !== null && i < this.mappings.length;);

      //   if (mapped !== null)
      //     return mapped;
      // }


      while ((mapped = root.read()) !== null) {
        for (let i = 0; i < mappings.length && mapped !== null; mapped = mappings[i++](mapped));

        if (mapped !== null)
          return mapped;
      }
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
