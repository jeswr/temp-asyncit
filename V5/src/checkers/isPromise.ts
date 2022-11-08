import { isFunction } from "./isFunction";

// Determines whether the given object is a promise
export function isPromise<T>(object: any): object is Promise<T> {
  return isFunction(object.then);
}
