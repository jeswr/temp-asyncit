import { ArrayIterator, fromArray, wrap, MappingIterator, range, IntegerIterator } from '../src';

// type Iterator = 

function emptyArrayIterators() {
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

  return [
    [
      'the result when called with `new` and no arguments',
      () => new ArrayIterator(),
    ],
    ...get(() => undefined, 'undefined'),
    ...get(function* () { }, 'empty iterable function'),
    ...get(() => [], 'empty array'),
    [
      'the result when called through `fromArray`',
      () => fromArray([])
    ],
    [
      'the result when called through `wrap`',
      () => wrap([])
    ]
  ]
}

function emptyRangeIterators() {
  return [
    [
      '',
      range(0, -1)
    ]
  ]
}

function emptyMappingIterators() {

}

function emptyCompositeMappingIterators() {

}

function allEmptyIterators() {

}
