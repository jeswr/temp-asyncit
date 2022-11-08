import { FLOWING } from "../constants";

export function removeListener<T>(this: any, eventName: string) {
  if (eventName === 'data' && this.listenerCount('data') === 0) {
    this[FLOWING] = false;
  }
}
