import { EventEmitter } from 'events';
import { AsyncIterator } from '../../src';

function spyFactory<T, I extends AsyncIterator<T>>(proto: typeof AsyncIterator) {
  return function createSpy(instance: I): jest.SpyInstance<boolean, [eventName: string | symbol, ...args: any[]]> {
    return jest
      .spyOn(proto.prototype, 'emit')
      .mockImplementation((...args) => EventEmitter.prototype.emit.call(instance, ...args));
  }
}

export function arrayToIterable(items: any[]) {
  const iterable = {
    next: () => ({ done: items.length === 0, value: items.shift() }),
    [Symbol.iterator]: () => iterable,
  };
  return iterable;
}

export interface LifetimeCheckOptions<T> {
  iterator: AsyncIterator<T>;
  startString?: string;
  elements?: [T, string][];
  testName?: string;
  preChecks?(iterator: AsyncIterator<T>): void;
  postChecks?(iterator: AsyncIterator<T>): void;
}

export function createIterChecks(cls: typeof AsyncIterator, name: string, emptyString: string) {
  let iterator: AsyncIterator<any>;
  let emitSpy: jest.SpyInstance<boolean, [eventName: string | symbol, ...args: any[]]>;

  function setIterator(iter: AsyncIterator<any>) {
    iterator = iter
    emitSpy = spyFactory(cls)(iterator);
    emitSpy.mockClear();
  }

  function stringCheck(str: string) {
    it('should provide a readable `toString` representation', () => {
      expect(iterator.toString()).toEqual(str);
    });
  }

  function readCheck(item: any) {
    it('should read the correct item', () => {
      expect(iterator.read()).toEqual(item);
    });
  }

  function readNullCheck() {
    it('should return null when read is called', () => {
      expect(iterator.read()).toBeNull();
    });
  }

  function notDone() {
    it('should not have emitted `end`', () => {
      expect(emitSpy).not.toHaveBeenCalledWith('end');
    });

    // it('should not have been destroyed', () => {
    //   iterator.destroyed.should.be.false;
    // });

    // it('should not have ended', () => {
    //   iterator.ended.should.be.false;
    // });

    it('should not be done', () => {
      expect(iterator.done).toEqual(false);
    });
  }

  function readable() {
    it('should be readable', () => {
      expect(iterator.readable).toEqual(true);
    });
  }

  function notReadable() {
    it('should not be readable', () => {
      expect(iterator.readable).toEqual(false);
    });
  }

  function reading(item: any, stringAfterItem: string) {
    readCheck(item);
    stringCheck(stringAfterItem);
    notDone();
    readable();
  }

  function noEventEmitted() {
    it('should not have emitted any event [including `readable`, `data` and `end`]', () => {
      expect(emitSpy).not.toHaveBeenCalled();
    });
  }

  function emitReadableOnSubscribe() {
    it('should emit readable when a readable listener is subscribed', done => {
      iterator.on('readable', done);
    });
  }

  function beforeReadTest(str: string) {
    describe('before calling read', () => {
      stringCheck(str);
      noEventEmitted();
      notDone();
      readable()
      // TODO: Also test not subscribing the readable listener
      emitReadableOnSubscribe()
      readable()
    });
  }

  function afterEndTest(str: string) {
    describe('after the iterator has ended', () => {
      stringCheck(str);
      notReadable();

      it('should have emitted the `end` event', () => {
        expect(emitSpy).toHaveBeenCalledWith('end');
      });

      notReadable();

      // TODO: Add checks to make sure `end` and `readable` are not called again (even if readable is subscribed again)

      readNullCheck();
      readNullCheck();

      // TODO: Add another separate toArray test before ending
      // it('should return an empty array given upon toArray', async () => {
      //   (await iterator.toArray()).length.should.equal(0);
      //   (await iterator.toArray({ limnit: 10 })).length.should.equal(0);
      // });
    });
  }

  function instanceChecks(iter: AsyncIterator<any>) {
    describe('testing instanceOf', () => {
      beforeEach(() => {
        setIterator(iter);
      });

      it('should be an ArrayIterator object', () => {
        expect(iterator).toBeInstanceOf(cls);
      });

      it('should be an AsyncIterator object', () => {
        expect(iterator).toBeInstanceOf(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        expect(iterator).toBeInstanceOf(EventEmitter);
      });
    });
  }

  function lifetimeCheck<T>(params: LifetimeCheckOptions<T>) {
    describe(params.testName ?? 'testing lifetime of iterator', () => {
      beforeAll(() => {
        setIterator(params.iterator);
      });

      beforeReadTest(params.startString ?? emptyString);

      if (params.elements) {
        for (const elem of params.elements) {
          reading(elem[0], elem[1]);
        }
      }

      readNullCheck();
      afterEndTest(emptyString);
    });
  }

  function emptyIteratorsCheck(getIter: () => AsyncIterator<any>) {
    instanceChecks(getIter());
    lifetimeCheck({ iterator: getIter() });
  }

  function allEmptyIterators(cases: [string, () => AsyncIterator<any>][]) {
    // TODO: Also do a concurrent run
    describe(`The ${name} function`, () => {
      describe.each(cases)('%s', (_, getIterator) => { emptyIteratorsCheck(getIterator) })
    });
  }

  function toArrayChecks<T>(params: {
    getIterator: () => AsyncIterator<T>;
    result: T[]
  }) {
    describe(`toArray checks with the array ${JSON.stringify(params.result)}`, () => {
      let items: T[] | undefined;
      const array = params.result;

      beforeEach(() => {
        iterator = params.getIterator();
        items = undefined;
      });

      async function limitCheck(start?: number, stop?: number) {
        if (stop !== undefined && start !== undefined) {
          items = await iterator.toArray({ limit: stop - start });
        } else {
          items = await iterator.toArray();
        }
        expect(items).toEqual(params.result.slice(start, stop));
      }

      it('should return all items upon toArray', async () => {
        items = await iterator.toArray();
        expect(items).not.toBe(array);
        expect(items).toEqual(array);
      });

      it(`should return all items upon toArray with limit ${params.result.length + 4}`, async () => {
        items = await iterator.toArray({ limit: params.result.length + 4 });
        expect(items).not.toBe(array);
        expect(items).toEqual(array);
      });

      it('should return 2 items upon toArray with limit 2', async () => {
        await limitCheck(0, 2);
        await limitCheck(2, 6);
        await limitCheck(6, 8);

        if (params.result.slice(8).length > 0) {
          items = await iterator.toArray();
          expect(items).toEqual(params.result.slice(8));
        }
      });

      describe('after reading elements', () => {
        beforeEach(() => {
          expect(iterator.read()).toEqual(0);
          expect(iterator.read()).toEqual(1);
        });

        it('should return all remaining items upon toArray', async () => {
          await limitCheck(2);
        });

        it('should return 2 remaining items upon toArray with limit 2', async () => {
          await limitCheck(2, 4);
          await limitCheck(4, 6);
          await limitCheck(6, 8); // TODO: Checks this
        });
      });

    });
  }

  return {
    setIterator,
    stringCheck,
    readCheck,
    readNullCheck,
    notDone,
    readable,
    notReadable,
    reading,
    noEventEmitted,
    emitReadableOnSubscribe,
    beforeReadTest,
    afterEndTest,
    instanceChecks,
    emptyIteratorsCheck,
    lifetimeCheck,
    allEmptyIterators,
    toArrayChecks
  }
}
