import {
  CAN_EMIT_READABLE, CAN_RUN_ITEM_GENERATION, EMIT_DATA_PENDING_OR_RUNNING, GENERATE_ITEMS, READABLE
} from '../constants';
import { emitData } from "../emitters/emitData";

// Do the data emission tasks first since they are 
let ITERATOR_TASK_SCHEDULED = false;

let READABLE_QUEUE: AsyncIterator<any>[] | null = null;
let DATA_EMIT_QUEUE: AsyncIterator<any>[] | null = null;
let ITEM_GENERATION_QUEUE: AsyncIterator<any>[] | null = null;

let _ITEM_GENERATION_QUEUE: AsyncIterator<any>[] | null = null;
let _DATA_EMIT_QUEUE: AsyncIterator<any>[] | null = null;
let _READABLE_QUEUE: AsyncIterator<any>[] | null = null;

// USE THIS WHEN WE ARE IN ENVIRONMENTS WHERE BLOCKING IS OK (e.g. webworkers)
/**
 * A single task to be run at most once per tick that triggers necessary iterator loading & events
 */
export function iteratorTask() {
  // console.log('running iteratorTask')

  // Localise queues for current tasks
  _ITEM_GENERATION_QUEUE = ITEM_GENERATION_QUEUE;
  _DATA_EMIT_QUEUE = DATA_EMIT_QUEUE;
  _READABLE_QUEUE = READABLE_QUEUE;

  // Set all of the global queues back to null so that any items added to them
  // will occur in the next tick
  ITEM_GENERATION_QUEUE = null;
  DATA_EMIT_QUEUE = null;
  READABLE_QUEUE = null;

  let it: any, i: number;

  // Trigger item generation tasks
  if (_ITEM_GENERATION_QUEUE !== null) {
    for (i = 0; i < _ITEM_GENERATION_QUEUE.length; i++) {
      // console.log('item generation')
      it = _ITEM_GENERATION_QUEUE![i];
      it[CAN_RUN_ITEM_GENERATION] = true;
      it[GENERATE_ITEMS]();
    }
    _ITEM_GENERATION_QUEUE = null;
  }

  // Emit data from iterators where appropriate
  if (_DATA_EMIT_QUEUE !== null) {
    for (i = 0; i < _DATA_EMIT_QUEUE!.length; i++) {
      it = _DATA_EMIT_QUEUE![i];
      // console.log(`data emit ${it}`, it[READABLE])

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
      // console.log('readable emit')

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

export function queueReadable(iterator: any) {
  if (iterator[CAN_EMIT_READABLE]) {
    iterator[CAN_EMIT_READABLE] = false;

    if (READABLE_QUEUE === null) {

      if (!ITERATOR_TASK_SCHEDULED) {
        ITERATOR_TASK_SCHEDULED = true;
        queueMicrotask(iteratorTask);
      }

      READABLE_QUEUE = [];
    }

    READABLE_QUEUE.push(iterator)
  }
}

export function queueItemGeneration(iterator: any) {
  if (iterator[CAN_RUN_ITEM_GENERATION]) {
    iterator[CAN_RUN_ITEM_GENERATION] = true;

    if (ITEM_GENERATION_QUEUE === null) {

      if (!ITERATOR_TASK_SCHEDULED) {
        ITERATOR_TASK_SCHEDULED = true;
        queueMicrotask(iteratorTask);
      }

      ITEM_GENERATION_QUEUE = [];
    }

    ITEM_GENERATION_QUEUE.push(iterator)
  }
}

export function queueDataEmission(iterator: any) {
  if (!iterator[EMIT_DATA_PENDING_OR_RUNNING]) {
    iterator[EMIT_DATA_PENDING_OR_RUNNING] = false;

    if (DATA_EMIT_QUEUE === null) {

      if (!ITERATOR_TASK_SCHEDULED) {
        ITERATOR_TASK_SCHEDULED = true;
        queueMicrotask(iteratorTask);
      }

      DATA_EMIT_QUEUE = [];
    }

    DATA_EMIT_QUEUE.push(iterator)
  }
}
