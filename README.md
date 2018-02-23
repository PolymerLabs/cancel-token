## CancelToken and Cancel Library

### Use

```javascript
import {CancelToken} from 'cancel-token';

const source = CancelToken.source();

const result = someCancellableApi(source.token);

eventSource.on('dont-care-about-result-anymore', () {
  source.cancel();
});

// This may throw a Cancel if we called source.cancel().
const value = await result;


// Elsewhere, maybe in another library
async function someCancellableApi(cancelToken) {
  await doSomeWork(cancelToken);

  // I'm outside of a critical section here, so it's ok if I were to throw.
  cancelToken.throwIfRequested();

  return doSomeMoreWork(cancelToken);
}
```

### Developing

To test:

    npm test

To watch source files and rerun tests when they change:

    npm test:watch

### History

This is based on a proposed cancellable promises spec which has since been withdrawn / gone dormant.

See https://github.com/littledan/proposal-cancelable-promises for more details.
