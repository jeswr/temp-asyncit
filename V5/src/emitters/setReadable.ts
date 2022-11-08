import { DESTINATION, ON_PARENT_READABLE, ENDED, READABLE, EMIT_DATA_PENDING_OR_RUNNING, FLOWING, STATE } from '../constants';
import { emitData } from './emitData';
import { queueReadable } from "../iteratorTask";

export function setReadable(this: any) {
  if (!this[READABLE] && this[STATE] < ENDED) {
    // Note that we also keep checking if this[READABLE] is still true after the first action to avoid performing
    // unnecessary queuing / actions.
    this[READABLE] = true;

    if (DESTINATION in this) {
      // If there is a destination that we are piping into then let them know that we are readable immediately rather
      // than waiting a tick
      this[DESTINATION][ON_PARENT_READABLE](this);
    }

    if (this[READABLE] && this[FLOWING] && !this[EMIT_DATA_PENDING_OR_RUNNING]) {
      // If the iterator is already in flow mode then we can start emitting 'data' events right away
      this[EMIT_DATA_PENDING_OR_RUNNING] = true;
      emitData(this);
    }

    if (this[READABLE] && this.listenerCount('readable') !== 0) {
      // If the iterator is *still* readable then emit the readable event on the next tick
      queueReadable(this);
    }
  }
}
