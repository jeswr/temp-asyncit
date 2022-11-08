export function emitError<T>(this: any, error: any) {
  if (this.listenerCount('error') === 0)
    throw error;
  else
    this.emit('error', error);
}
