// TODO: Set this out as follows
// 1 Base empty iterators
// 2 From/derived empty iterators
// 3 union of 1 + 2
// 4 Maps an unions of 1+2
// 5 Maps and unions of 1+2+4
// 6 Clonese of 1+2+4

import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  wrap,
  fromPromise,
  PromiseIterator,
  empty,
  EmptyIterator,
  single,
  SingletonIterator,
  fromIterable,
  fromIterator,
  fromEventEmitter
} from '../../src';
// import { arrayToIterable, createIterChecks, LifetimeCheckOptions } from './util/util';

import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { IterableOrNullableSource, MaybeIterableSource } from '../../src/types';
import { IterableIterator } from '../../src/iterators/IterableIterator';

type E = [ () => AsyncIterator<never>, string ];
type ES = E[];

const EMPTY_ITERABLES: [ () => Iterable<never>  , string ][] = [
  [function* () { }, 'empty iterable function'],
  [() => [], 'empty array'],
  [() => new Set(), 'empty set'],
];

const EMPTY_ASYNC_ITERABLES: [ () => AsyncIterable<never>  , string ][] = [
  [async function* () { }, 'empty async iterable function']
];

// TODO: Extend this
const EMPTY_ITERATORS: [ () => Iterator<never>  , string ][] = [
  [function* () { }, 'empty iterator function'],
  [() => ({ next: () => ({ done: true, value: null }) }), 'custom iterator returning null'],
  [() => ({ next: () => ({ done: true, value: undefined }) }), 'custom iterator returning undefined'],
  [() => ({ next: () => ({ done: true, value: true }) }), 'custom iterator returning true'],
];

const EMPTY_NOTHINGS: [ () => void | null | undefined , string ][] = [
  [() => undefined, 'undefined'],
  [() => null, 'null'],
  [() => {}, 'void'],
]

const EMPTY_EVENT_EMITTERS: [ () => EventEmitter, string ][] = [
  [() => new Readable(), 'constructed readable'],
  ...EMPTY_ITERABLES.map<[ () => EventEmitter, string ]>(([f, str]) => [ () => Readable.from(f()), `Readable.from wrapping ${str}` ]),
]

const EMPTY_BASES: [ () => IterableOrNullableSource<never> , string ][] = [
  ...EMPTY_ITERABLES,
  ...EMPTY_NOTHINGS,
  ...EMPTY_EVENT_EMITTERS,
]

const EMPTY_BASES_WITH_PROMISES: [ () => Promise<IterableOrNullableSource<never>>, string ][] = [
  ...EMPTY_BASES.map<[ () => Promise<IterableOrNullableSource<never>>, string ]>(([ f, str ]) => [ () => Promise.resolve(f()), `${str} wrapped in a Promise.resolve` ]),
  ...EMPTY_BASES.map<[ () => Promise<IterableOrNullableSource<never>>, string ]>(([ f, str ]) => [ () => new Promise(res => { res(f()) }), `${str} wrapped in a new Promise` ]),
]

const ALL_EMPTY_BASES: [ () => MaybeIterableSource<never>, string ][] = [
  ...EMPTY_BASES,
  ...EMPTY_BASES_WITH_PROMISES,
]

const EMPTY: ES = [
  [ () => empty(), 'empty iterator as a function call'],
  [ () => new EmptyIterator(), 'empty iterator as a function call'],
]

const SINGLETON_WITH_NULL: ES = [
  [ () => single<never>(null), 'singleton iterator as a function call'],
  [ () => new SingletonIterator<never>(null), 'singleton iterator as a constructor call'],
]

const WRAPPED_EMPTY_BASES: ES = ALL_EMPTY_BASES.map(([ f, str ]) => [ () => wrap(f()), str ])

const WRAPPED_EMPTY_PROMISES: ES = [
  ...EMPTY_BASES_WITH_PROMISES.map<E>(([ f, str ]) => [ () => fromPromise(f()), str ]),
  ...EMPTY_BASES_WITH_PROMISES.map<E>(([ f, str ]) => [ () => new PromiseIterator(f()), str ]),
]

const WRAPPED_EMPTY_ITERABLES = [
  ...EMPTY_ITERABLES.map<E>(([ f, str ]) => [ () => fromIterable(f()), str ]),
  ...EMPTY_ITERABLES.map<E>(([ f, str ]) => [ () => fromIterator(f()[Symbol.iterator]()), str ]),
  ...EMPTY_ITERABLES.map<E>(([ f, str ]) => [ () => new IterableIterator(f()[Symbol.iterator]()), str ]),
]

EMPTY_BASES.map(([ f, str ]) => [  ])
