// import { DESTINATION, ON_PARENT_READABLE } from "../constants";
// import { AsyncIterator } from "./AsyncIterator";

// interface History<T> {
//   source: AsyncIterator<T>;
//   history: T[];
//   trackers: Set<ClonedIterator<T>>;
//   offset: number;
//   [ON_PARENT_READABLE]: () => void;
// }

// // Stores the history of a source, so it can be cloned
// class HistoryReader<T> {
//   private _source: AsyncIterator<T>;
//   // TODO: Use linkedlist here
//   private _history: T[] = [];
//   private _trackers: Set<ClonedIterator<T>> = new Set();
//   private _offset = 0;

//   // When the source becomes readable, makes all clones readable
//   [ON_PARENT_READABLE]() {
//     for (const tracker of this._trackers)
//       tracker.readable = true;
//   }

//   constructor(source: AsyncIterator<T>) {
//     this._source = source;

//     // If the source is still live, set up clone tracking;
//     // otherwise, the clones just read from the finished history
//     if (!source.done) {
//       // When the source errors, re-emits the error
//       const emitError = (error: Error) => {
//         for (const tracker of this._trackers)
//           tracker.emit('error', error);
//       };

//       // Listen to source events to trigger events in subscribed clones
//       source.on('error', emitError);
//     }
//   }

//   // Registers a clone for history updates
//   register(clone: ClonedIterator<T>) {
//     // Tracking is only needed if the source is still live
//     if (!this._source.done)
//       this._trackers.add(clone);
//   }

//   // Unregisters a clone for history updates
//   unregister(clone: ClonedIterator<T>) {
//     this._trackers.delete(clone);
//   }

//   // Tries to read the item at the given history position
//   readAt(pos: number) {
//     let item = null;
//     pos -= this._offset;
    
//     // Retrieve an item from history when available
//     if (pos < this._history.length) {
//       item = this._history[pos];

//       // Clean up old parts of the history
//       if (pos === 256) {
//         // This is based on the truncateThreshold in the ArrayIterator (but made larger due to the overhead of tracker handling)
//         // TODO: See what is done
//         let min = pos;
//         // TODO: See how impactful the cost of set iteration is
//         for (const tracker of this._trackers) {
//           min = Math.min(min, (tracker as any)._readPosition - this._offset)
//         }
        
//         if (min > 0) {
//           this._history = this._history.splice(min);
//           this._offset += min;
//         }
//       }
//     }
//     // Read a new item from the source when possible
//     else if (!this._source.done && (item = this._source.read()) !== null)
//       this._history[pos] = item; // TODO: Work out why this is not pushed
//       // TODO: Don't use a history buffer if there is only one iterator
    
//     return item;
//   }

//   // Determines whether the given position is the end of the source
//   endsAt(pos: number) {
//     return this._source.done && this._history.length === pos;
//   }
// }



// // TODO: Ensure that the most 'behind' cloned iterator is set as readable first so that it can remove latent elements
// export class ClonedIterator<T> extends AsyncIterator<T> {
//   constructor(private source: AsyncIterator<T>) {
//     super();
  
//     if (!(DESTINATION in source)) {
      
//      source[DESTINATION] = {
//         source,
//         // [ON_PARENT_READABLE]
//       }
//     }

//     this[DESTINATION] = source[DESTINATION]

    
//   }
  
  
  
  
  
//   [ON_PARENT_READABLE]() {
//     this.readable = true;
//   }

//   // TODO: Throw an error when clones are registered after the first element has been read (or at least make this)
//   // opt-in

//     /* Tries to read an item */
//     read() {
//       const history: History<T> = this[DESTINATION] as any;


//       const source = this.source as InternalSource<T>;
//       let item = null;
//       if (!this.done && source) {
//         // Try to read an item at the current point in history
//         const history = source[DESTINATION] as any as HistoryReader<T>;
//         if ((item = history.readAt(this._readPosition)) !== null)
//           this._readPosition++;
//         else
//           this.readable = false;
//         // Close the iterator if we are at the end of the source
//         if (history.endsAt(this._readPosition))
//           this.close();
//       }
//       return item;
//     }
  
// }
