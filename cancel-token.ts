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

export type CancelFunction = (reason?: any) => void;

/**
 * A polyfill for the November 23rd, 2016 draft of
 * https://tc39.github.io/proposal-cancelable-promises/
 */
export class CancelToken {
  promise: Promise<Cancel>;
  reason: Cancel|undefined = undefined;

  constructor(executor: (cancel: CancelFunction) => void) {
    // Shouldn't this reject?
    // Filed https://github.com/tc39/proposal-cancelable-promises/issues/69
    // to clarify.
    let resolve: CancelFunction;
    this.promise = new Promise<Cancel>((res) => resolve = res);

    const cancel = (reason?: any) => {
      if (this.reason) {
        return;
      }
      // TODO(rictic): file a bug about this. This isn't up to spec, but without
      // this every canceltoken composition system (like .race()) will add
      // another layer of Cancel().
      this.reason = isCancel(reason) ? reason : new Cancel(reason);
      resolve(this.reason);
    };
    executor(cancel);
  }
  static source() {
    let cancel: CancelFunction = null as any;
    const token = new CancelToken((c) => {
      cancel = c;
    });
    return {token, cancel};
  }
  static race(tokens: Iterable<CancelToken>): CancelToken {
    // TODO(rictic): This may not be right according to spec. The timing might
    //     be off and cancellation may need to happen synchronously?
    let cancel: CancelFunction;
    let token = new CancelToken((c) => cancel = c);
    for (const token of tokens) {
      if (!isCancelToken(token)) {
        throw new TypeError(
            'CancelToken.race must be called with an iterable of CancelTokens');
      }
      token.promise.then((cancelation) => {
        cancel(cancelation && cancelation.message || cancelation);
      });
    }

    return token;
  }

  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  get[Symbol.toStringTag]() {
    return 'CancelToken';
  }

  // This would be useful.
  // static never = new CancelToken(() => null);
}

export class Cancel {
  message: string;
  constructor(reason?: any) {
    this.message = '' + reason;
  }

  toString() {
    if (!this.message) {
      return 'Cancel';
    }
    return `Cancel: ${this.message}`;
  }
}

// non-standard, taken from domenic's suggestion at
// https://github.com/tc39/proposal-cancelable-promises/issues/32#issuecomment-235644656
export function isCancel(value: any): value is Cancel {
  if (!value) {
    return false;
  }
  if (!value.constructor) {
    return false;
  }
  return value.constructor.name === 'Cancel';
}

export function isCancelToken(value: any): value is CancelToken {
  if (!value) {
    return false;
  }
  if (!value.constructor) {
    return false;
  }
  return value.constructor.name === 'CancelToken';
}

// TODO(rictic): handle unhandledRejections of Cancels according to each
//     platform's folkways.
process.on('unhandledRejection', (reason: any, p: Promise<any>) => {
  if (isCancel(reason)) {
    p.catch(() => {/*do nothing but let node know this is ok */});
  }
});
