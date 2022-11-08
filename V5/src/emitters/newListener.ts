import { EMIT_DATA_PENDING_OR_RUNNING, FLOWING, READABLE } from '../constants';
import { queueDataEmission, queueReadable } from '../iteratorTask';

export function newListener<T>(this: any, eventName: string) {
  switch (eventName) {
    case 'readable': {
      // If we have switched back into readable mode then queue the readable event
      if (this[READABLE])
        queueReadable(this);
      break;
    }
    case 'data': {
      // If not already in flowing mode then switch back into it
      if (!this[FLOWING]) {
        this[FLOWING] = true;
        queueDataEmission(this);
      }
      break;
    }
  }
}
