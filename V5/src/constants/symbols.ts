/** @internal Whether an iterator is readable or not */
export const READABLE = Symbol('readable')

/** @internal Key indicating the current consumer of a source. */
export const DESTINATION = Symbol('destination');

/** @internal Key for function that is invoked when a parent iterator is made readable */
export const ON_PARENT_READABLE = Symbol('on_parent_readable');

/** @internal Boolean for whether an iterator is in flowing mode */
export const FLOWING = Symbol('flowing')

/** @internal True when an iterator is pending emitData or running it */
export const EMIT_DATA_PENDING_OR_RUNNING = Symbol('emitting');

/** @internal True when a data can emit the readable event - false otherwise */
export const CAN_EMIT_READABLE = Symbol('emit_readable');

/** @internal The error that has been emitted, or is pending emission from the iterator */
export const ERROR = Symbol('error')

/** @internal The current state of the iterator */
export const STATE = Symbol('state');

/** @internal Whether item generation is scheduled for the iterator */
export const CAN_RUN_ITEM_GENERATION = Symbol('schedule');

/** @internal Run item generation on the iterator */
export const GENERATE_ITEMS = Symbol('generate');

/** @internal If the source of an iterator is done */
export const SOURCE_DONE = Symbol('source_done')

/** @internal */
export const PROPERTIES = Symbol('properties');

/** @internal */
export const PROPERTY_CALLBACKS = Symbol('property_callbacks');
