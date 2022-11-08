import { ON_PARENT_READABLE } from '../../constants';
import { AsyncIterator } from '../AsyncIterator';

type ClonedIterator<T> = AsyncIterator<T>

// Stores the history of a source, so it can be cloned
class HistoryReader<T> {
  private _source: AsyncIterator<T>;
  // TODO: Use linkedlist here
  private _history: T[] = [];
  private _trackers: Set<ClonedIterator<T>> = new Set();
  private _offset = 0;

  // When the source becomes readable, makes all clones readable
  [ON_PARENT_READABLE]() {
    // TODO: Proportion this with the number of clones
    if (this._history.length >= 256) {
      // If the history is getting backed up then force the readable event to be emitted in order from most behind
      // clone to least behind clone

      const clones: ClonedIterator<T>[] = [];

      // We only need to worry about doing it for those trackers that are not currently readable
      for (const tracker of this._trackers) {
        if (!tracker.readable) {
          clones.push(tracker)
        }
      }

      for (const tracker of clones.sort((a, b) => (a as any)._readPosition - (b as any)._readPosition)) {
        tracker.readable = true;
      }

    } else {
      for (const tracker of this._trackers)
        tracker.readable = true;
    }
  }

  constructor(source: AsyncIterator<T>) {
    this._source = source;

    // If the source is still live, set up clone tracking;
    // otherwise, the clones just read from the finished history
    if (!source.done) {
      // When the source errors, re-emits the error
      const emitError = (error: Error) => {
        for (const tracker of this._trackers)
          tracker.emit('error', error);
      };

      // Listen to source events to trigger events in subscribed clones
      source.on('error', emitError);
    }
  }

  // Registers a clone for history updates
  register(clone: ClonedIterator<T>) {
    // Tracking is only needed if the source is still live
    if (!this._source.done)
      this._trackers.add(clone);
  }

  // Unregisters a clone for history updates
  unregister(clone: ClonedIterator<T>) {
    this._trackers.delete(clone);
  }

  // Tries to read the item at the given history position
  readAt(pos: number) {
    let item = null;
    pos -= this._offset;
    
    // Retrieve an item from history when available
    if (pos < this._history.length) {
      item = this._history[pos];

      // Clean up old parts of the history
      if (pos === 256) {
        // This is based on the truncateThreshold in the ArrayIterator (but made larger due to the overhead of tracker handling)
        // TODO: See what is done
        let min = pos;
        // TODO: See how impactful the cost of set iteration is
        for (const tracker of this._trackers) {
          min = Math.min(min, (tracker as any)._readPosition - this._offset)
        }
        
        if (min > 0) {
          this._history = this._history.slice(min);
          this._offset += min;
        }
      }
    }
    // Read a new item from the source when possible
    else if (!this._source.done && (item = this._source.read()) !== null)
      this._history[pos] = item; // TODO: Work out why this is not pushed
      // TODO: Don't use a history buffer if there is only one iterator
    


    return item;
  }

  // Determines whether the given position is the end of the source
  endsAt(pos: number) {
    return this._source.done && this._history.length === pos;
  }
}
