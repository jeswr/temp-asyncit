import type { EventEmitter } from 'events';

export type EventEmitterSource<T> = EventEmitter & {
  read(): T | null;
  readable?: boolean | undefined;
}
