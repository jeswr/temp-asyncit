import { EventEmitter } from 'events';
import {
  ON_PARENT_READABLE,
  DESTINATION, FLOWING,
  EMIT_DATA_PENDING_OR_RUNNING,
  CAN_EMIT_READABLE,
  READABLE,
  STATE,
  OPEN,
  ENDED,
  GENERATE_ITEMS,
  CAN_RUN_ITEM_GENERATION
} from '../constants';
import { emitData } from '../emitters';
import { AsyncIteratorBase } from '../types/AsyncIteratorBase';

// Do the data emission tasks first since they are 
let ITERATOR_TASK_SCHEDULED = false;

let READABLE_QUEUE: AsyncIterator<any>[] | null = null;
let DATA_EMIT_QUEUE: AsyncIterator<any>[] | null = null;
let ITEM_GENERATION_QUEUE: AsyncIterator<any>[] | null = null;

let _ITEM_GENERATION_QUEUE: AsyncIterator<any>[] | null = null;
let _DATA_EMIT_QUEUE: AsyncIterator<any>[] | null = null;
let _READABLE_QUEUE: AsyncIterator<any>[] | null = null;

// USE THIS IN ENVIRONMENTS WHERE BLOCKING IS NOT OK (e.g. the main browser thread)
let taskCount = 0;

// Hand back control every x ms

/**
 * A single task to be run at most once per tick that triggers necessary iterator loading & events
 */
export function iteratorTask() {
  if (_ITEM_GENERATION_QUEUE === null && _DATA_EMIT_QUEUE === null && _READABLE_QUEUE === null) {
    // Localise queues for current tasks
    _ITEM_GENERATION_QUEUE = ITEM_GENERATION_QUEUE;
    _DATA_EMIT_QUEUE = DATA_EMIT_QUEUE;
    _READABLE_QUEUE = READABLE_QUEUE;

    // Set all of the global queues back to null so that any items added to them
    // will occur in the next tick
    ITEM_GENERATION_QUEUE = null;
    DATA_EMIT_QUEUE = null;
    READABLE_QUEUE = null;
  }

  let it: any, i: number;

  // Trigger item generation tasks
  if (_ITEM_GENERATION_QUEUE !== null) {
    for (i = 0; i < _ITEM_GENERATION_QUEUE.length; i++) {
      
      if (++taskCount === 100) {
        taskCount = 0;
        setImmediate(iteratorTask);
        _ITEM_GENERATION_QUEUE = _ITEM_GENERATION_QUEUE.splice(100);
        return;
        // TODO: Only increment `taskCount` when stuff is run (e.g. we don't need to increment when it[READABLE] is false)
      }

      it = _ITEM_GENERATION_QUEUE![i];
      it[CAN_RUN_ITEM_GENERATION] = true;
      it[GENERATE_ITEMS]!();
    }
    _ITEM_GENERATION_QUEUE = null;
  }

  // Emit data from iterators where appropriate
  if (_DATA_EMIT_QUEUE !== null) {
    for (i = 0; i < _DATA_EMIT_QUEUE!.length; i++) {

      if (++taskCount === 100) {
        taskCount = 0;
        setImmediate(iteratorTask);
        // Fix splicing
        _DATA_EMIT_QUEUE = _DATA_EMIT_QUEUE.splice(100);
        return;
      }

      it = _DATA_EMIT_QUEUE![i];
      if (it[READABLE])
        emitData(it);
      else
        it[EMIT_DATA_PENDING_OR_RUNNING] = false;
    }
    _DATA_EMIT_QUEUE = null;
  }

  // Emit pending readable events
  if (_READABLE_QUEUE !== null) {
    for (i = 0; i < _READABLE_QUEUE!.length; i++) {

      if (++taskCount === 100) {
        taskCount = 0;
        setImmediate(iteratorTask);
        _READABLE_QUEUE = _READABLE_QUEUE.splice(100);
        return;
      }

      it = _READABLE_QUEUE![i];
      it[CAN_EMIT_READABLE] = true;

      if (it[READABLE])
        it.emit('readable')
    }
    _READABLE_QUEUE = null;
  }

  // Unschedule iterator task so that it can be rescheduled
  if (READABLE_QUEUE === null && DATA_EMIT_QUEUE === null && ITEM_GENERATION_QUEUE === null) {
    ITERATOR_TASK_SCHEDULED = false;
  } else {
    queueMicrotask(iteratorTask);
  }
}
