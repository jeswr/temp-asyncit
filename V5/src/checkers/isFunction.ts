// Determines whether the given object is a function
export function isFunction(object: any): object is Function {
  return typeof object === 'function';
}
