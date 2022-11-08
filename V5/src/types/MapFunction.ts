/**
 * A synchronous mapping function from one element to another.
 * A return value of `null` means that nothing should be emitted for a particular item.
 */
export type MapFunction<S, D = S> = (item: S) => D | null;
