import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  range,
  empty
  // wrap,
} from '../src';
import { MappingIterator } from '../src/iterators/MappingIterator';
import { arrayToIterable, createIterChecks, LifetimeCheckOptions } from './util/util';

function get(creator: () => any, name: string): [string, () => ArrayIterator<any>][] {
  return [
    [
      `the result when called with 'new', ${name} and no options`,
      () => new ArrayIterator(creator()),
    ],
    [
      `the result when called with 'new', ${name} and preserve true`,
      () => new ArrayIterator(creator(), { preserve: false }),
    ],
    [
      `the result when called with 'new', ${name} and preserve true`,
      () => new ArrayIterator(creator(), { preserve: true }),
    ]
  ]
}

describe('ArrayIterator', () => {
  const iterChecks = createIterChecks(ArrayIterator as any, 'ArrayIterator', '[ArrayIterator (0)]');

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
      () => new MappingIterator<never>(empty(), (e) => e),
    ],
    [
      'the result when called with `new` an empty fromArray source and identity map',
      () => new MappingIterator<never>(fromArray([]), (e) => e),
    ],
    [
      'the result when called with `new` an empty fromArray source and map that returns null',
      () => new MappingIterator<never>(fromArray([]), (e) => null),
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
    iterator: new ArrayIterator([1]),
    startString: '[ArrayIterator (1)]',
    elements: [
      [1, '[ArrayIterator (0)]'],
    ],
    testName: 'An ArrayIterator with a one-item array'
  });

  describe.each([
    ['An ArrayIterator with a three-item array', [1, 2, 3]],
    ['An ArrayIterator with an iterable object', arrayToIterable([1, 2, 3])]
  ])('%s', (testName, check) => {
    lifetimeCheck({
      iterator: new ArrayIterator(check),
      startString: '[ArrayIterator (3)]',
      elements: [
        [1, '[ArrayIterator (2)]'],
        [2, '[ArrayIterator (1)]'],
        [3, '[ArrayIterator (0)]'],
      ],
      testName
    });
  });

  function makeArray(size = 500) {
    let i = 0
    return Array(size).fill(1).map(() => i++)
  }

  describe.each([
    ['An ArrayIterator with a five-hundred-item array', makeArray()],
    ['An ArrayIterator with an five-hundred-item iterable object', arrayToIterable(makeArray())]
  ])('%s', (testName, check) => {
    lifetimeCheck({
      iterator: new ArrayIterator(check),
      startString: '[ArrayIterator (500)]',
      elements: makeArray().map(i => [i, `[ArrayIterator (${499 - i})]`]),
      testName
    });
  });

  describe('An ArrayIterator with a six-item array', () => {
    const array = makeArray(6);
    iterChecks.toArrayChecks({
      getIterator: () => new ArrayIterator(array),
      result: array,
    });
  });  
});
