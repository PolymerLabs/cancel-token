/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';

import {Cancel, CancelFunction, CancelToken, isCancel} from '../cancel-token';

describe('Cancel', () => {
  it('it can be constructed', () => {
    const noArgCancel = new Cancel();
    assert.equal(noArgCancel.toString(), 'Cancel');
    assert.equal(noArgCancel.message, '');

    const stringCancel = new Cancel('my message');
    assert.equal(stringCancel.toString(), 'Cancel: my message');
    assert.equal(stringCancel.message, 'my message');
  });

  // TODO(rictic).
  it.skip('can be called without new');
});

describe('CancelToken', () => {
  it('can be constructed', () => {
    const token = new CancelToken(() => null);
    assert.isFunction(token.throwIfRequested);
    assert.isUndefined(token.reason);
    token.throwIfRequested();  // not cancelled, does nothing.
    assert.equal(token[Symbol.toStringTag], 'CancelToken');
  });

  it('when cancelled, it will throw if requested', async() => {
    let cancelFunc: CancelFunction = undefined as any;
    const token = new CancelToken(c => cancelFunc = c);
    token.throwIfRequested();
    cancelFunc();
    const error = getThrownError(() => token.throwIfRequested());
    if (!(error instanceof Cancel)) {
      throw new Error('Expected throwIfRequested to throw a Cancel');
    }
    assert.equal(error.message, '');
    assert.equal(token.reason, error);
    assert.equal(await token.promise, error);
  });

  it('will ignore all cancels past the first', () => {
    const source = CancelToken.source();

    source.cancel('foo');
    const error1 = getThrownError(() => source.token.throwIfRequested());
    assert.equal(error1.message, 'foo');

    source.cancel('bar');
    const error2 = getThrownError(() => source.token.throwIfRequested());
    assert.equal(error2.message, 'foo');
    assert.equal(error1, error2);
  });

  describe.skip('.race()', () => {/* TODO(rictic) */});
});

function getThrownError(f: () => void): any {
  try {
    f();
  } catch (e) {
    return e;
  }
  throw new Error('Expected f to throw but it did not.');
}

describe('isCancel', () => {
  it('returns true for our Cancel objects', () => {
    assert.isTrue(isCancel(new Cancel()));
    assert.isTrue(isCancel(new Cancel('message')));
  });

  it('returns false for other kinds of objects', () => {
    assert.isFalse(isCancel(false));
    assert.isFalse(isCancel(null));
    assert.isFalse(isCancel(undefined));
    assert.isFalse(isCancel({}));
    assert.isFalse(isCancel(new CancelToken(() => null)));
  });

  it('returns true for foreign Cancel objects', () => {
    const foreignCancelClass = class Cancel {};
    assert.isTrue(isCancel(new foreignCancelClass()));

    const foreignCancelFunction: {new (): any} = (function Cancel() {}) as any;
    assert.isTrue(isCancel(new foreignCancelFunction()));
  });
});
