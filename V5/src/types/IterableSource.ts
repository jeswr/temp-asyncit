
import type { EventEmitter } from 'events';

export type IterableSource<T> =
  | T[]
  | AsyncIterator<T>
  | EventEmitter
  | Iterator<T>
  | Iterable<T>
  ;

export type IterableOrNullableSource<T> = 
  | IterableSource<T>
  | null
  | undefined
  ;

export type MaybePromise<T> = T | Promise<T>;

export type MaybeIterableSource<T> = MaybePromise<IterableOrNullableSource<T>>
