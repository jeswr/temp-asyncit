import { AsyncIterator, IntegerIterator, range } from '../src';
import { createIterChecks } from './util';

export function emptyIntegerIterators(): [string, () => AsyncIterator<any>, string][] {
  const params = [
    [0, -1, 1],
    [0, -1, 0],
    [0, -1],
    [0, 1, -1]
  ];
  return [

    ...params.map((p: number[]) => [
      `Range with params ${p.join(', ')}` , () => range(p[0], p[1], p[2]),
      `[IntegerIterator (${p[0]}...${p[1]})]`
    ] as [string, () => AsyncIterator<any>, string]),

    ...params.map((p: number[]) => [
      `Range with params start: ${p[0]}, end: ${p[1]}, step: ${p[2]}` ,
      () => new IntegerIterator({ start: p[0], end: p[1], step: p[2] }),
      `[IntegerIterator (${p[0]}...${p[1]})]`
    ] as [string, () => AsyncIterator<any>, string]),

  ]
}

describe('IntegerIterator', () => {
  const iterChecks = createIterChecks(IntegerIterator as any, 'IntegerIterator', '[IntegerIterator]');
  iterChecks.allEmptyIterators(emptyIntegerIterators());

  iterChecks.lifetimeCheck({
    iterator: new IntegerIterator({ start: -5, end: 10, step: 5 }),
    startString: `[IntegerIterator (-5...10)]`,
    endString: `[IntegerIterator (15...10)]`,
    testName: 'An IntegerIterator from -5 to 10 in steps of 5',
    elements: [
      [-5, `[IntegerIterator (0...10)]`], 
      [0, `[IntegerIterator (5...10)]`], 
      [5, `[IntegerIterator (10...10)]`], 
      [10, `[IntegerIterator (15...10)]`]
    ],
  });

  iterChecks.lifetimeCheck({
    iterator: new IntegerIterator({ start: 10, end: -5, step: -5 }),
    startString: `[IntegerIterator (10...-5)]`,
    endString: `[IntegerIterator (-10...-5)]`,
    testName: 'An IntegerIterator from 10 to -5 in steps of -5',
    elements: [
      [10, `[IntegerIterator (5...-5)]`], 
      [5, `[IntegerIterator (0...-5)]`], 
      [0, `[IntegerIterator (-5...-5)]`], 
      [-5, `[IntegerIterator (-10...-5)]`]
    ],
  });
  
  function infinityCheck(params: { testName: string, startString: string, start?: number, step?: number, doesNotEnd?: false, elements?: [number, string][] }) {
    iterChecks.lifetimeCheck({
      iterator: new IntegerIterator({ start: params.start, step: params.step }),
      startString: params.startString,
      endString: params.startString,
      testName: params.testName,
      doesNotEnd: params.doesNotEnd === false ? false : true,
      elements: params.elements ?? [
        [params.start, params.startString],
        [params.start, params.startString],
        [params.start, params.startString],
      ],
    });
  }

  infinityCheck({
    start: Infinity,
    testName: 'An IntegerIterator starting at Infinity',
    startString: '[IntegerIterator (Infinity...Infinity)]'
  });
  infinityCheck({
    start: Infinity,
    step: -1,
    testName: 'An IntegerIterator starting at Infinity and counting down',
    startString: '[IntegerIterator (Infinity...-Infinity)]'
  });
  infinityCheck({
    start: -Infinity,
    testName: 'An IntegerIterator starting at -Infinity',
    startString: '[IntegerIterator (-Infinity...Infinity)]'
  });
  infinityCheck({
    step: Infinity,
    testName: 'An IntegerIterator with Infinity as step size',
    startString: '[IntegerIterator (0...Infinity)]',
    elements: [
      [0, '[IntegerIterator (Infinity...Infinity)]'],
      [Infinity, '[IntegerIterator (Infinity...Infinity)]'],
      [Infinity, '[IntegerIterator (Infinity...Infinity)]']
    ]
  });

  // TODO: Add #toArray checks
})
