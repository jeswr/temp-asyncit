import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  range,
  empty
  // wrap,
} from '../src';
import { MappingIterator } from '../src';
import { arrayToIterable, createIterChecks, LifetimeCheckOptions } from './util/util';

// TODO: Remove all the ArrayIterator stuff from this file and ensure that all the tests from
// https://github.com/RubenVerborgh/AsyncIterator/blob/main/test/MappingIterator-test.js are applied

describe('MappingIterator', () => {
  const iterChecks = createIterChecks(MappingIterator as any, 'MappingIterator', '[MappingIterator]');

  function lifetimeCheck<T>(options: LifetimeCheckOptions<T>) {
    iterChecks.lifetimeCheck<T>({
      ...options,
      postChecks: (iterator) => {

        it('should have an empty buffer', () => {
          // TODO: Check the name here
          expect((iterator as any)._buffer).toBeUndefined();
        });

        options.postChecks?.(iterator);
      }
    })
  }

  iterChecks.allEmptyIterators([
    [
      'the result when called with `new` an EmptyIterator source and identity map',
      () => new MappingIterator<never>(empty<never>(), (e: never) => e),
    ],
    [
      'the result when called with `new` an empty fromArray source and identity map',
      () => new MappingIterator<never>(fromArray([]), (e: never) => e),
    ],
    [
      'the result when called with `new` an empty fromArray source and map that returns null',
      () => new MappingIterator<never>(fromArray([]), (e: never) => null),
    ],
    [
      'the result when called with `new` an empty range and identity map',
      () => new MappingIterator<number>(range(0, -1), (e) => e),
    ],
    [
      'the result when called with `new` an empty source and map that returns null',
      () => new MappingIterator<number>(range(0, 1000), (e) => null),
    ],
  ])

  lifetimeCheck({
    iterator: new MappingIterator(new ArrayIterator([1]), e => e),
    startString: '[MappingIterator]',
    elements: [
      [1, '[MappingIterator]'],
    ],
    testName: 'An MappingIterator with a one-item ArrayIterator source'
  });

  // TODO: Properly name
  describe.each([
    ['MappingIterator - source: An ArrayIterator with a three-item array', [1, 2, 3]],
    ['MappingIterator - source: An ArrayIterator with an iterable object', arrayToIterable([1, 2, 3])]
  ])('%s', (testName, check) => {
    lifetimeCheck({
      iterator: new MappingIterator(new ArrayIterator(check), e => e),
      startString: '[MappingIterator]',
      elements: [
        [1, '[MappingIterator]'],
        [2, '[MappingIterator]'],
        [3, '[MappingIterator]'],
      ],
      testName
    });
  });

  function makeArray(size = 500) {
    let i = 0
    return Array(size).fill(1).map(() => i++)
  }

  describe.each([
    ['MappingIterator - source: An ArrayIterator with a five-hundred-item array', makeArray()],
    ['MappingIterator - source: An ArrayIterator with an five-hundred-item iterable object', arrayToIterable(makeArray())]
  ])('%s', (testName, check) => {
    lifetimeCheck({
      iterator: new MappingIterator(new ArrayIterator(check), e => e),
      startString: '[MappingIterator]',
      elements: makeArray().map(i => [i, `[MappingIterator]`]),
      testName
    });
  });

  describe('MappingIterator - source: An ArrayIterator with a six-item array', () => {
    const array = makeArray(6);
    iterChecks.toArrayChecks({
      getIterator: () => new MappingIterator(new ArrayIterator(array), e => e),
      result: array,
    });
  });  
});
