import { createIterChecks } from './util';
import { EmptyIterator } from '../src';
import { empty } from '../src/functions/empty';

describe('EmptyIterator', () => {
  const iterChecks = createIterChecks(EmptyIterator, 'EmptyIterator', '[EmptyIterator]');
  iterChecks.allEmptyIterators([
    [ 'Empty iterator called with new', () => new EmptyIterator() ],
    [ 'Empty function', () => empty() ]
  ])
});
