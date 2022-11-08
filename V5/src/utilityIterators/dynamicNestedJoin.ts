import { union } from "../functions";
import type { AsyncIterator } from "../iterators";

// https://github.com/comunica/asyncjoin/blob/master/join/DynamicNestedLoopJoin.js
function dynamicNestedJoin<T, K, J>(iterator: AsyncIterator<T>, right: (item: T) => AsyncIterator<K>, join: (l: T, r: K) => J | null): AsyncIterator<J> {
  return union(map(iterator, x => map(right(x), y => join(x, y))));
}


