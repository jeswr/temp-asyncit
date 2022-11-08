import { AsyncIterator } from '../src';
import { createIterChecks } from './util';

describe('AsyncIterator', () => {
  const iterChecks = createIterChecks(AsyncIterator, 'AsyncIterator', '[AsyncIterator]');

  // Expect an error since we are instantiating an abstract class
  // @ts-expect-error
  const iterator = new AsyncIterator();
  iterator.readable = true;
  iterChecks.setIterator(iterator);

  iterChecks.instanceChecks(iterator);
  iterChecks.beforeReadTest('[AsyncIterator]');

  // TODO: Finish this
});
