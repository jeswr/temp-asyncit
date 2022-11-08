
import { MapFunction } from './MappingIterator';
import { SynchronousTransformIterator } from './SynchronousTransformIterator';
import { AsyncIterator } from './AsyncIterator';

// type MapFunctions<S, D> = any extends infer K ? [...MapFunctions<S, K>, MapFunction<K, D>] : never[];

// type MapFunctions<S, D> = [MapFunction<S, any extends infer K ? K : never>, MapFunction<any extends infer K ? K : never, D>];

// type MapFunctions<S, D> = [ MapFunction<S, D> ] | [ MapFunctions<S, any extends infer K ? K : never>, MapFunction<any extends infer K ? K : never, D> ]


// type MapFunctionsArray<S, D, R, K extends MapFunctionsArray<D, any, R, []> | []> = [ MapFunction<S, D>, ...K ]



// [
//   // MapFunction<S, any extends infer K ? K : never>,
//   MapFunction<S, any extends infer K ? K : never>,
// ];



// type RArray<t> = (string | RArray<t>)[];

// TODO: Set up a way of bypassing the series of .readable calls

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
      throw new Error('root is not readable');
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
function bind<T extends Function>(fn: T, self?: object): T {
  return self ? fn.bind(self) : fn;
}
