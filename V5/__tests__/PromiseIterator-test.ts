import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  range,
  empty,
  UnionIterator,
  PromiseIterator
  // wrap,
} from '../src';
import { MappingIterator } from '../src';
import { arrayToIterable, createIterChecks, LifetimeCheckOptions } from './util/util';

function promiseCallback() {
  let resolve;
  const promise = new Promise(res => { resolve = res });
  return { promise, resolve }
}

// TODO: Remove all the ArrayIterator stuff from this file and ensure that all the tests from
// TODO: Add controllable checks like in https://github.com/RubenVerborgh/AsyncIterator/blob/3171521759194b3ce463f989d8253e35978ef690/test/WrappingIterator-test.js#L82-L107
// https://github.com/RubenVerborgh/AsyncIterator/blob/main/test/MappingIterator-test.js are applied

describe('PromiseIterator', () => {
  const iterChecks = createIterChecks(PromiseIterator as any, 'PromiseIterator', '[PromiseIterator]');

  // TODO: Refactor this into the errorIterators (and also test wrap / maps of them)
  // --------------------------------
  const err = new Error('boo')
  iterChecks.errorChecks<never>({
    getIterator() {
      return new PromiseIterator<never>(Promise.reject(err))
    },
    err
  });

  const pc = promiseCallback();

  // --------------------------------

  // function lifetimeCheck<T>(options: LifetimeCheckOptions<T>) {
  //   iterChecks.lifetimeCheck<T>({
  //     ...options,
  //     postChecks: (iterator) => {

  //       it('should have an empty buffer', () => {
  //         // TODO: Check the name here
  //         expect((iterator as any)._buffer).toBeUndefined();
  //       });

  //       options.postChecks?.(iterator);
  //     }
  //   })
  // }

  // iterChecks.allEmptyIterators([
  //   [
  //     'the result when called with `new` an EmptyIterator source',
  //     () => new UnionIterator<never>(empty<never>()),
  //   ],
  //   [
  //     'the result when called with `new` an empty fromArray source',
  //     () => new UnionIterator<never>(fromArray([])),
  //   ],
  //   [
  //     'the result when called with `new` a fromArray source containing empty iterators',
  //     () => new UnionIterator<never>(fromArray([empty<never>(), empty<never>(), empty<never>()])),
  //   ],
  //   [
  //     'the result when called with `new` a fromArray source containing empty fromArray iterators',
  //     () => new UnionIterator<never>(fromArray([fromArray([]), fromArray([]), fromArray([])])),
  //   ],
  //   [
  //     'the result when called with `new` a fromArray source containing empty fromArray iterators and empty iterators',
  //     () => new UnionIterator<never>(fromArray([fromArray([]), fromArray([]), empty<never>(), fromArray([])])),
  //   ],
  // ])

  // lifetimeCheck({
  //   iterator: new UnionIterator(fromArray([ fromArray([1]) ])),
  //   startString: '[UnionIterator]',
  //   elements: [
  //     [1, '[UnionIterator]'],
  //   ],
  //   testName: 'An UnionIterator with a one-item ArrayIterator source'
  // });

  // lifetimeCheck({
  //   iterator: new UnionIterator(fromArray([ empty<never>(), fromArray([1]), fromArray([]) ])),
  //   startString: '[UnionIterator]',
  //   elements: [
  //     [1, '[UnionIterator]'],
  //   ],
  //   testName: 'An UnionIterator with a one-item ArrayIterator source amongst empty iterators'
  // });

  // // // TODO: Properly name
  // // describe.each([
  // //   ['MappingIterator - source: An ArrayIterator with a three-item array', [1, 2, 3]],
  // //   ['MappingIterator - source: An ArrayIterator with an iterable object', arrayToIterable([1, 2, 3])]
  // // ])('%s', (testName, check) => {
  // //   lifetimeCheck({
  // //     iterator: new MappingIterator(new ArrayIterator(check), e => e),
  // //     startString: '[MappingIterator]',
  // //     elements: [
  // //       [1, '[MappingIterator]'],
  // //       [2, '[MappingIterator]'],
  // //       [3, '[MappingIterator]'],
  // //     ],
  // //     testName
  // //   });
  // // });

  // // function makeArray(size = 500) {
  // //   let i = 0
  // //   return Array(size).fill(1).map(() => i++)
  // // }

  // // describe.each([
  // //   ['MappingIterator - source: An ArrayIterator with a five-hundred-item array', makeArray()],
  // //   ['MappingIterator - source: An ArrayIterator with an five-hundred-item iterable object', arrayToIterable(makeArray())]
  // // ])('%s', (testName, check) => {
  // //   lifetimeCheck({
  // //     iterator: new MappingIterator(new ArrayIterator(check), e => e),
  // //     startString: '[MappingIterator]',
  // //     elements: makeArray().map(i => [i, `[MappingIterator]`]),
  // //     testName
  // //   });
  // // });

  // // describe('MappingIterator - source: An ArrayIterator with a six-item array', () => {
  // //   const array = makeArray(6);
  // //   iterChecks.toArrayChecks({
  // //     getIterator: () => new MappingIterator(new ArrayIterator(array), e => e),
  // //     result: array,
  // //   });
  // // });
});
