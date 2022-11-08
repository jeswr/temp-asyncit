// Returns a function that calls `fn` with `self` as `this` pointer. */
export function bind<T extends Function>(fn: T, self?: object): T {
  return self ? fn.bind(self) : fn;
}
