import { EMIT_DATA_PENDING_OR_RUNNING, FLOWING } from "../constants";

// Emits new items though `data` events as long as there are `data` listeners
export function emitData<T>(it: any) {
  // While there are `data` listeners and items, emit them
  let item: T | null;
  while (it[FLOWING] && (item = it.read()) !== null)
    it.emit('data', item);

  it[EMIT_DATA_PENDING_OR_RUNNING] = false;
}
