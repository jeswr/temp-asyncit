
import { ENDED, STATE, READABLE } from '../constants';

export function end<T>(this: any) {
  if (this[STATE] < ENDED) {
    this[STATE] = ENDED;
    this[READABLE] = false;
    this.emit('end');
    // TODO: See if we should also auto delete any destinations

    // Cleanup
    this.removeAllListeners();
  }
}
