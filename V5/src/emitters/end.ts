
import { ENDED, STATE, READABLE, ENDING } from '../constants';

// Call when an iterator has no more
// elements to return but *has not
export function ending(this: any) {
  if (this[STATE] < ENDING) {
    this[STATE] = ENDING
  }
}

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
