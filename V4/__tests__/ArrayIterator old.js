
describe('An ArrayIterator with an array that is modified afterwards', () => {
  const count = 256;
  let source;

  beforeEach(() => {
    source = [];
    for (let i = 0; i < count; i++)
      source.push(i);
  });

  describe('with default settings', () => {
    let iterator;
    beforeEach(() => {
      iterator = new ArrayIterator(source);

      // Modify the source
      source[0] = 'a';
      source.pop();
    });

    it('should return the original items', () => {
      expect(iterator.read()).to.equal(0);
      expect(iterator.read()).to.equal(1);
      expect(iterator.read()).to.equal(2);
      expect(iterator.read()).to.equal(3);
    });
  });

  describe('with preserve set to true', () => {
    let iterator;
    beforeEach(() => {
      iterator = new ArrayIterator(source, { preserve: true });

      // Modify the source
      source[0] = 'a';
      source.pop();
    });

    it('should return the original items', () => {
      expect(iterator.read()).to.equal(0);
      expect(iterator.read()).to.equal(1);
      expect(iterator.read()).to.equal(2);
      expect(iterator.read()).to.equal(3);
    });
  });

  describe('with preserve set to false', () => {
    let iterator;
    beforeEach(() => {
      iterator = new ArrayIterator(source, { preserve: false });
    });

    it('should truncate the source array every 64 items', () => {
      source.length.should.equal(count);

      for (let i = 0; i < 64; i++)
        expect(iterator.read()).to.equal(i);
      source.length.should.equal(count - 64);

      for (let i = 64; i < 128; i++)
        expect(iterator.read()).to.equal(i);
      source.length.should.equal(count - 64 - 64);
    });
  });
});

describe('An ArrayIterator with a two-item array that is destroyed', () => {
  let iterator;
  before(() => {
    iterator = new ArrayIterator([1, 2]);
    captureEvents(iterator, 'readable', 'end');
    iterator.destroy();
  });

  it('should not have emitted a `readable` event', () => {
    iterator._eventCounts.readable.should.equal(0);
  });

  it('should not have emitted the `end` event', () => {
    iterator._eventCounts.end.should.equal(0);
  });

  it('should not have ended', () => {
    iterator.ended.should.be.false;
  });

  it('should have been destroyed', () => {
    iterator.destroyed.should.be.true;
  });

  it('should be done', () => {
    iterator.done.should.be.true;
  });

  it('should not be readable', () => {
    iterator.readable.should.be.false;
  });

  it('cannot be made readable again', () => {
    iterator.readable = true;
    iterator.readable.should.be.false;
  });

  it('should return null when trying to read', () => {
    expect(iterator.read()).to.be.null;
  });

  it('should not have any listeners for data, readable, or end', () => {
    expect(iterator._events).to.not.contain.key('data');
    expect(iterator._events).to.not.contain.key('readable');
    expect(iterator._events).to.not.contain.key('end');
  });

  it('should have an empty buffer', () => {
    expect(iterator._buffer).to.be.an('undefined');
  });

  describe('after destroy has been called a second time', () => {
    before(() => { iterator.destroy(); });

    it('should not have emitted a `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event a second time', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });

    it('should have an empty buffer', () => {
      expect(iterator._buffer).to.be.an('undefined');
    });
  });
});
});
