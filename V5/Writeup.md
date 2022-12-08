## Custom Scheduling

TODO (Bring back the async one)

This re-write introduces a custom scheduler. From a memory perspective it is beneficial to do this as we no longer need to have a bunch of new arrow functions created that get added to the `queueMicrostask` queue. The implementation of this scheduler also avoids repeated queuing of readable events or item generation.

We have 3 queues for the custom scheduler - the:
  - `READABLE_QUEUE` which schedules iterators that need to emit the `readable` event; 
  - `ITEM_GENERATION_QUEUE` which is used to trigger asynchronous item generation tasks;
  - `DATA_EMIT_QUEUE` a queue of iterators that have just been switched into flowing mode and needed to wait a tick before starting.

### sync vs. async scheduling

We have introduced the ability to perform scheduling synchronously *or* asynchronously. 

The async scheduling mechanism should be used if the iterator is going to be used in situations where don't want the main event loop to be blocked (for instance when the iterator is in the main process in the browser, and we don't want it to block rendering). It gives up control to the main event loop regularly so that rendering can continue.

The sync scheduling mechanism should be used in cases where it is ok to block. A good example of this is if we have a high performance query engine running in a WebWorker.

## The readable event:
We emit readable events:
 - The tick after an iterable becomes readable (so long as it is still readable after that tick); and at least one `readable` listener was available.
 - The tick after a `readable` listener is attached if the iterator is readable when the `readable` listener is attached.

## The end event:
The `end` event must only be emitted during a `read()`; and that read call must return `null`.

NOTE: Users of the AsyncIterator package that implement their own custom iterators *must* be updated to also have this behaviour.

## Errors:
For the most part we try to ensure that errors occur during a *read* call; this provides better behaviour on chained iterators (for instance when we take the union of an AsyncIterator of AsyncIterators; we cannot immediately start forwarding all errors from element iterators, so it is much more preferable to have the error occur during a `.read()` call in the UnionIterator so that we can guarantee that we are forwarding errors to consumers of the `UnionIterator` at that time). This is achieved by:
 - In all iterators that do *synchronous* transformations (e.g. `MappingIterator` and `CompositeMappingIterator` we forward errors as they occur - since we also assume that their parent will only emit errors when read is called within their `.read()` call)
 - In all errors that do *asynchronous* transformations we have a `PENDING_ERROR` stored in the iterator that gets emitted/thrown on the *next* `.read()` call of the iterator. We have the same logic for `PENDING_ERROR`s when `wrap()`ing iterators/streams/promises from outside this package. 
 NOTE: This the primary reason that we now must *always* wrap iterators that do not extend the `AsyncIterator` before applying any transformations.
 This is also going to be one of the biggest migration pains for downstream consumers as they *may* need to update how errors are handled.

The *one* case in which we cannot enforce this assumption is when the downstream user calls `.emit('error')` themselves (though I was tempted to introduce the notion of a pending state here to; it creates too much extra overhead in `.read()` calls to check for pending errors on every synchronous transformations; especially in the case of the `CompositeMapping` iterator).
For the most part I would suggest that consumers *avoid* using `emit("error", ...)` themselves where possible, however, this is already a fairly common pattern in Comunica https://github.com/comunica/comunica/search?q=%27emit%28%22error%22%2C%27&type=.
As far as I can tell the erroring behavior won't be worse in these cases than it was before either - we can just have very slick erroring behavior if consumers avoid doing this.


The remaining question here (cc @rubensworks) is whether this behavior of delaying the error (noting that the error will still be called *before* the iterator emits another element)


## Destruction
Iterators can only 

A note on the `UnionIterator`. This was a problem before this PR, it will be a problem after; if I do something like.

```ts
const iterator = fromArray(Array(100).fill(true).map(() => range(100)))

const u = union(iterator);

console.log(u.read());
u.destroy();
```

Then only the `ArrayIterator` and first `range` iterator will be destroyed. This is *unavoidable* because if I instead took the union of

```ts
const iterator = range(0, Infinity).map(() => range(100))

```

and I had logic to destroy each of the element iterators it would just continually generate iterators. This is why the `UnionIterator` is the *only* special case in this library where I allow an array of iterators as input (so we *can* destroy all of the elements of the array) in addition to allowing an iterator as input.

What does this mean? We should either add an *option* to the `UnionIterator` like `{ destroyUnusedIterators: true }` *or* a wrapper iterator specifically for this case (Pseudocode for such an iterator is given below)

```ts
class DestroyElementIterator<T> extends SynchronousTransformIterator<AsyncIterator<T>> {

  constructor(private source) {

  }

  safeRead() {
    return source.read();
  }

  destroy() {
    source.on('data', iterator => {
      iterator.destroy();
    });

    source.on('end', () => {
      source.destroy();
      super.destroy();
    })
  }
}
```

The third option here is to provide iterators with an attribute that children can read such as setting `[IS_FINITE_ITERATOR]: true`

I honestly think we need to enable *both* as the former is more peformant; but requires knowledge of the input iterator into the union (when we might necessarily have that knowledge in cases like comunica where the input into the union could change depending on the query plan).

**SECOND NOTE: This becomes even more gnarly in the case of iterators with asynchronous item generation since we probably want to destroy all elements in the buffer; but not any more. Really this should call for a custom `TransformIterator` in the case of iterators that generate other iterators.

## Destruction Continued

Something that I *have not checked* for bugs associated with early destruction. For instance a nasty one I found recently is that if the `PromiseIterator` is destroyed before the promise is resolved, then the `PromiseIterator` will not destroy its parent if the promise has not yet resolved

## Cloning

<!-- TODO: Introduce a mechanism to pause cleanup - we should also wait a full tick after the first clone is subscribed before allowing cleanup to take place to give enough time for all clones to subscribe -->
Previously clones kept all past elements in memory; we have introduced a cleanup mechanism which tries to cleanup elements after they have been read by all cloned iterators.

The caveat of this approach is that we cannot keep cloning after iterators have started to read from the source.

## `UnionIterator`

The union iterator is now an iterator that synchronously transforms elements (in particular it does not buffer elements). Now instead it has a set of iterators that are in a `readable` state; iterates through them on a `.read()` call to find the first element that is readable.


For now this does tend to 

TODO: Introduce an on parent ending event
ON_PARENT_ENDING *must* be called before ON_PARENT_READABLE to ensure that the ending state is set prior to the parent iterator being readable

