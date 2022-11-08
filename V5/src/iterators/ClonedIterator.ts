import { DESTINATION, ON_PARENT_READABLE, READABLE, ERROR } from "../constants";
import { emitError, end } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";

const TRACKERS = Symbol('trackers');
const HISTORY = Symbol('history');
// const OFFSET = Symbol('offset');
const READ_POSITION = Symbol('read_position');
const SOURCE = Symbol('source')

function onParentReadable<T>(this: History<T>) {
  // TODO: Proportion this with the number of clones
  if (this[HISTORY].length >= 256) {
    // If the history is getting backed up then force the readable event to be emitted in order from most behind
    // clone to least behind clone

    const clones: ClonedIterator<T>[] = [];

    // We only need to worry about doing it for those trackers that are not currently readable
    for (const tracker of this[TRACKERS]) {
      if (!tracker.readable) {
        clones.push(tracker)
      }
    }

    for (const tracker of clones.sort((a, b) => a[READ_POSITION] - b[READ_POSITION])) {
      tracker.readable = true;
    }

  } else {
    for (const tracker of this[TRACKERS])
      tracker.readable = true;
  }
}

// TODO: Create an AsyncIterator.from method

interface History<T> {
  [SOURCE]: AsyncIterator<T>;
  [HISTORY]: T[];
  [TRACKERS]: Set<ClonedIterator<T>>;
  // [OFFSET]: number;
  [ON_PARENT_READABLE]: () => void;
}

function emitClonedError<T>(this: { [DESTINATION]: History<T> }, error: Error) {
  // The error
  for (const tracker of this[DESTINATION][TRACKERS]) {
    tracker[ERROR] = error;
    delete tracker[SOURCE];
  }
  
  // TODO: Enable this if we want to forward errors synchronously
  // for (const tracker of this[DESTINATION][TRACKERS])
  //   tracker.emit('error', error);
};


export class ClonedIterator<T> extends AsyncIterator<T> {
  [READ_POSITION] = 0;
  [SOURCE]?: History<T>;
  [ERROR]?: any;

  constructor(source: AsyncIterator<T>) {
    super();

    // TODO: See if we need done checks like in the constructor of the history iterator

    if (!source[DESTINATION]) {
      // @ts-ignore
      source[DESTINATION] = <History<T>>{
        [ON_PARENT_READABLE]: onParentReadable,
        // [OFFSET]: 0,
        [TRACKERS]: new Set(),
        [HISTORY]: [],
        [SOURCE]: source
      }

      // Listen to source events to trigger events in subscribed clones
      source.on('error', emitClonedError);
    }

    this[SOURCE] = source[DESTINATION] as any;
    this[SOURCE]![TRACKERS].add(this);
    this.readable = source.readable
  }

  read() {
    const source = this[SOURCE];
    let item: T | null = null;

    // We are skipping the done check since we should only enter the done
    // state when we delete the source
    if (source) {
      const pos = this[READ_POSITION];

      if (pos < source[HISTORY].length) {
        item = source[HISTORY][pos];
        this[READ_POSITION] += 1;

        // Clean up old parts of the history
        // TODO: Ratio this with the number of iterators
        if (pos === 256) {
          // This is based on the truncateThreshold in the ArrayIterator (but made larger due to the overhead of tracker handling)
          // TODO: See what is done
          let min = Infinity;
          // TODO: See how impactful the cost of set iteration is
          for (const tracker of source[TRACKERS]) {
            min = Math.min(min, tracker[READ_POSITION])
          }

          if (min > 0) {
            source[HISTORY] = source[HISTORY].slice(min);
            for (const tracker of source[TRACKERS]) {
              tracker[READ_POSITION] -= min;
            }
          }
        }

      } 
      else if (!source[SOURCE].done && (item = source[SOURCE].read()) !== null) {
        // Read a new item from the source when possible
        source[HISTORY][pos] = item;
        this[READ_POSITION] += 1;
      } else if (source[SOURCE].done) {
        // End the iterator if we are at the end of the source
        source[TRACKERS].delete(this);

        // TODO: see if we need the following
        // I don't *think we to because because this should be cleaned up
        // when the iterator ends
        // source.off('error', emitError)

        delete this[SOURCE];
        end.call(this);
      } else {
        this[READABLE] = false;
      }
    } else if (ERROR in this) {
      emitError.call(this, this[ERROR]);
      delete this[ERROR];
    }
    // TODO: See if we need sync error handling here

    return item;
  }
}
