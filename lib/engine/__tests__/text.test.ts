import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { nthIndexOf, offsetToPos, posToOffset } from '../text.ts';

const DOC = 'alpha\nbeta\n\ngamma';

describe('offsetToPos / posToOffset', () => {
  it('round-trips every offset in the document', () => {
    for (let off = 0; off <= DOC.length; off++) {
      assert.equal(posToOffset(DOC, offsetToPos(DOC, off)), off, `offset ${off}`);
    }
  });

  it('puts the newline offset at the end of the line it terminates', () => {
    assert.deepEqual(offsetToPos(DOC, 5), { line: 0, ch: 5 });
    assert.deepEqual(offsetToPos(DOC, 6), { line: 1, ch: 0 });
  });

  it('handles an empty line', () => {
    assert.deepEqual(offsetToPos(DOC, 11), { line: 2, ch: 0 });
    assert.equal(posToOffset(DOC, { line: 2, ch: 4 }), 11);
  });

  it('clamps rather than throwing, so a bad exercise column degrades quietly', () => {
    assert.equal(posToOffset(DOC, { line: 99, ch: 99 }), DOC.length);
    assert.equal(posToOffset(DOC, { line: -3, ch: -3 }), 0);
    assert.deepEqual(offsetToPos(DOC, 9999), { line: 3, ch: 5 });
    assert.deepEqual(offsetToPos(DOC, -1), { line: 0, ch: 0 });
  });

  it('treats an empty document as one empty line', () => {
    assert.deepEqual(offsetToPos('', 0), { line: 0, ch: 0 });
    assert.equal(posToOffset('', { line: 0, ch: 5 }), 0);
  });
});

describe('nthIndexOf', () => {
  it('counts non-overlapping matches from zero', () => {
    assert.equal(nthIndexOf('aaaa', 'aa', 0), 0);
    assert.equal(nthIndexOf('aaaa', 'aa', 1), 2);
    assert.equal(nthIndexOf('aaaa', 'aa', 2), -1);
  });

  it('returns -1 for an empty needle or a negative occurrence', () => {
    assert.equal(nthIndexOf('abc', '', 0), -1);
    assert.equal(nthIndexOf('abc', 'a', -1), -1);
  });
});
