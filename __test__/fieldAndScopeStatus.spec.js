import { rff } from '../lib/index.js';
import { setPromise, clearPromise } from '../lib/fieldAndScopeStatus.js';

describe('getValue', () => {
  test('it can return the model', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.getValue(fs, '')).toStrictEqual({a: 1});
  });
  test('it can return the model from nested formstate', () => {
    let fs = rff.initializeFormstate({a: {b: 2}});
    fs.nestedScopeId = rff.getId(fs, 'a');
    expect(rff.getValue(fs, '')).toStrictEqual({b: 2});
  });
  test('it can recur through objects and arrays', () => {
    let fs = rff.initializeFormstate({a: [{aa: [12,13]}]});
    expect(rff.getValue(fs, 'a.0')).toStrictEqual({aa: [12,13]});
    expect(rff.getValue(fs, 'a.0.aa')).toStrictEqual([12,13]);
    expect(rff.getValue(fs, 'a.0.aa.0')).toBe(12);
    expect(rff.getValue(fs, 'a.0.aa.1')).toBe(13);
  });
  test('it normalizes the model key', () => {
    let fs = rff.initializeFormstate({a: [0]});
    expect(rff.getValue(fs, 'a[0]')).toBe(0);
  });
  test('it throws an error if the model key is bad', () => {
    let fs = rff.initializeFormstate({});
    expect(() => rff.getValue(fs, 'bubkus')).toThrow(/Unable to get modelKey/);
  });
});

describe('getInitialValue', () => {
  test('it returns the initial value', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a: 1});
    expect(rff.getInitialValue(fs, 'a')).toBe(1);
    fs = rff.setValueAndClearStatus(fs, 'a', 2);
    expect(rff.getValue(fs, '')).toStrictEqual({a: 2});
    expect(rff.getValue(fs, 'a')).toBe(2);
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a: 1});
    expect(rff.getInitialValue(fs, 'a')).toBe(1);
  });
  test('it returns undefined if the model key is bad', () => {
    let fs = rff.initializeFormstate({a:1});
    expect(rff.getInitialValue(fs, 'bubkus')).toBe(undefined);
  });
});

describe('setSynclyValid', () => {
  test('it sets a field or scope syncly valid', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyValidated(fs, '')).toBe(false);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setSynclyValid(fs, '', 'hello');
    fs = rff.setSynclyValid(fs, 'a', 'there');
    expect(rff.isSynclyValid(fs, '')).toBe(true);
    expect(rff.isSynclyValid(fs, 'a')).toBe(true);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyValidated(fs, '')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('hello');
    expect(rff.getMessage(fs, 'a')).toBe('there');
  });
  test('the message defaults to an empty string', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, '', null);
    fs = rff.setSynclyValid(fs, 'a', null);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
  });
});

describe('setSynclyInvalid', () => {
  test('it sets a field or scope syncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyValidated(fs, '')).toBe(false);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setSynclyInvalid(fs, '', 'hello');
    fs = rff.setSynclyInvalid(fs, 'a', 'there');
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, '')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('hello');
    expect(rff.getMessage(fs, 'a')).toBe('there');
  });
});

describe('setNotSynclyValidated', () => {
  test('it sets a field or scope not syncly validated', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, '', 'hello');
    fs = rff.setSynclyInvalid(fs, 'a', 'there');
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, '')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('hello');
    expect(rff.getMessage(fs, 'a')).toBe('there');
    fs = rff.setNotSynclyValidated(fs, '', 'oh');
    fs = rff.setNotSynclyValidated(fs, 'a', 'yeah');
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyValidated(fs, '')).toBe(false);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, '')).toBe('oh');
    expect(rff.getMessage(fs, 'a')).toBe('yeah');
  });
});

describe('setValid', () => {
  test('it is an alias for setSynclyValid', () => {
    expect(rff.setValid).toBe(rff.setSynclyValid);
  });
});

describe('setInvalid', () => {
  test('it is an alias for setSynclyInvalid', () => {
    expect(rff.setInvalid).toBe(rff.setSynclyInvalid);
  });
});

describe('setNotValidated', () => {
  test('it is an alias for setNotSynclyValidated', () => {
    expect(rff.setNotValidated).toBe(rff.setNotSynclyValidated);
  });
});

describe('setAsyncStarted', () => {
  test('it sets async started for a field or scope', () => {
    const before = Date.now();
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isWaiting(fs, '')).toBe(false);
    expect(rff.isWaiting(fs, 'a')).toBe(false);
    expect(rff.getAsyncStartTime(fs, '')).toBe(undefined);
    expect(rff.getAsyncStartTime(fs, 'a')).toBe(undefined);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
    expect(rff.getAsyncToken(fs, '')).toBe(undefined);
    expect(rff.getAsyncToken(fs, 'a')).toBe(undefined);
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    expect(rff.isWaiting(fs, '')).toBe(true);
    expect(rff.isWaiting(fs, 'a')).toBe(true);
    expect(rff.getAsyncStartTime(fs, '')).toBeGreaterThan(before);
    expect(rff.getAsyncStartTime(fs, 'a')).toBeGreaterThan(before);
    expect(rff.getMessage(fs, '')).toBe('hello');
    expect(rff.getMessage(fs, 'a')).toBe('there');
    expect(rff.getAsyncToken(fs, '')).not.toBe(undefined);
    expect(rff.getAsyncToken(fs, 'a')).not.toBe(undefined);
    expect(rff.isAsynclyValidated(fs, '')).toBe(false);
    expect(rff.isAsynclyValidated(fs, 'a')).toBe(false);
  });
});

describe('setAsynclyValid', () => {
  test('it sets async finished and valid for a field or scope', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    const scopeToken = rff.getAsyncToken(fs, '');
    const fieldToken = rff.getAsyncToken(fs, 'a');
    fs = setPromise(fs, scopeToken, 3);
    fs = setPromise(fs, fieldToken, 4);
    expect(rff.getPromises(fs).length).toBe(2);
    fs = rff.setAsynclyValid(scopeToken, fs, '', 'oh');
    fs = rff.setAsynclyValid(fieldToken, fs, 'a', 'yeah');
    expect(rff.getPromises(fs).length).toBe(0);
    expect(rff.isWaiting(fs, '')).toBe(false);
    expect(rff.isWaiting(fs, 'a')).toBe(false);
    expect(rff.getAsyncEndTime(fs, '')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, ''));
    expect(rff.getAsyncEndTime(fs, 'a')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, 'a'));
    expect(rff.getMessage(fs, '')).toBe('oh');
    expect(rff.getMessage(fs, 'a')).toBe('yeah');
    expect(rff.isAsynclyValidated(fs, '')).toBe(true);
    expect(rff.isAsynclyValidated(fs, 'a')).toBe(true);
    expect(rff.isAsynclyValid(fs, '')).toBe(true);
    expect(rff.isAsynclyValid(fs, 'a')).toBe(true);
    expect(rff.isAsynclyInvalid(fs, '')).toBe(false);
    expect(rff.isAsynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.getAsyncError(fs, '')).toBe(undefined);
    expect(rff.getAsyncError(fs, 'a')).toBe(undefined);
  });
  test('it does nothing if token does not match', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    fs = rff.setAsynclyValid(0, fs, '', 'oh');
    fs = rff.setAsynclyValid(0, fs, 'a', 'yeah');
    expect(rff.isWaiting(fs, '')).toBe(true);
    expect(rff.isWaiting(fs, 'a')).toBe(true);
  });
});

describe('setAsynclyInvalid', () => {
  test('it sets async finished and invalid for a field or scope', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    const scopeToken = rff.getAsyncToken(fs, '');
    const fieldToken = rff.getAsyncToken(fs, 'a');
    fs = setPromise(fs, scopeToken, 3);
    fs = setPromise(fs, fieldToken, 4);
    expect(rff.getPromises(fs).length).toBe(2);
    fs = rff.setAsynclyInvalid(scopeToken, fs, '', 'oh');
    fs = rff.setAsynclyInvalid(fieldToken, fs, 'a', 'yeah');
    expect(rff.getPromises(fs).length).toBe(0);
    expect(rff.isWaiting(fs, '')).toBe(false);
    expect(rff.isWaiting(fs, 'a')).toBe(false);
    expect(rff.getAsyncEndTime(fs, '')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, ''));
    expect(rff.getAsyncEndTime(fs, 'a')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, 'a'));
    expect(rff.getMessage(fs, '')).toBe('oh');
    expect(rff.getMessage(fs, 'a')).toBe('yeah');
    expect(rff.isAsynclyValidated(fs, '')).toBe(true);
    expect(rff.isAsynclyValidated(fs, 'a')).toBe(true);
    expect(rff.isAsynclyValid(fs, '')).toBe(false);
    expect(rff.isAsynclyValid(fs, 'a')).toBe(false);
    expect(rff.isAsynclyInvalid(fs, '')).toBe(true);
    expect(rff.isAsynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getAsyncError(fs, '')).toBe(undefined);
    expect(rff.getAsyncError(fs, 'a')).toBe(undefined);
  });
  test('it does nothing if token does not match', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    fs = rff.setAsynclyInvalid(0, fs, '', 'oh');
    fs = rff.setAsynclyInvalid(0, fs, 'a', 'yeah');
    expect(rff.isWaiting(fs, '')).toBe(true);
    expect(rff.isWaiting(fs, 'a')).toBe(true);
  });
});

describe('setAsyncError', () => {
  test('it sets async finished and sets an error for a field or scope', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    const scopeToken = rff.getAsyncToken(fs, '');
    const fieldToken = rff.getAsyncToken(fs, 'a');
    fs = setPromise(fs, scopeToken, 3);
    fs = setPromise(fs, fieldToken, 4);
    expect(rff.getPromises(fs).length).toBe(2);
    fs = rff.setAsyncError(scopeToken, fs, '', new Error('123'), 'oh');
    fs = rff.setAsyncError(fieldToken, fs, 'a', null, 'yeah');
    expect(rff.getPromises(fs).length).toBe(0);
    expect(rff.isWaiting(fs, '')).toBe(false);
    expect(rff.isWaiting(fs, 'a')).toBe(false);
    expect(rff.getAsyncEndTime(fs, '')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, ''));
    expect(rff.getAsyncEndTime(fs, 'a')).toBeGreaterThanOrEqual(rff.getAsyncStartTime(fs, 'a'));
    expect(rff.getMessage(fs, '')).toBe('oh');
    expect(rff.getMessage(fs, 'a')).toBe('yeah');
    expect(rff.isAsynclyValidated(fs, '')).toBe(false);
    expect(rff.isAsynclyValidated(fs, 'a')).toBe(false);
    expect(rff.isAsynclyValid(fs, '')).toBe(false);
    expect(rff.isAsynclyValid(fs, 'a')).toBe(false);
    expect(rff.isAsynclyInvalid(fs, '')).toBe(false);
    expect(rff.isAsynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.getAsyncError(fs, '').message).toBe('123');
    expect(rff.getAsyncError(fs, 'a').message).toBe('Unknown error.');
  });
  test('it does nothing if token does not match', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, '', 'hello');
    fs = rff.setAsyncStarted(fs, 'a', 'there');
    fs = rff.setAsyncError(0, fs, '', new Error('123'), 'oh');
    fs = rff.setAsyncError(0, fs, 'a', new Error('456'), 'yeah');
    expect(rff.isWaiting(fs, '')).toBe(true);
    expect(rff.isWaiting(fs, 'a')).toBe(true);
  });
});

describe('isValid', () => {
  test('it returns false if not validated', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns true if asyncly valid and no sync status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(true);
  });
  test('it returns true if syncly valid and no async status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    expect(rff.isValid(fs, 'a')).toBe(true);
  });
  test('it returns false if syncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns false if asyncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyInvalid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns false if async error', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns false if syncly valid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns false if syncly invalid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('it returns true if syncly valid and asyncly valid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValid(fs, 'a')).toBe(true);
  });
});

describe('isInvalid', () => {
  test('it returns false if not validated', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
  test('it returns false if asyncly valid and no sync status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
  test('it returns false if syncly valid and no async status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
  test('it returns true if syncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(true);
  });
  test('it returns true if asyncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyInvalid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(true);
  });
  test('it returns false if async error', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
  test('it returns false if syncly valid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
  test('it returns true if syncly invalid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(true);
  });
  test('it returns false if syncly valid and asyncly valid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isInvalid(fs, 'a')).toBe(false);
  });
});


describe('isValidated', () => {
  test('it returns false if not validated', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isValidated(fs, 'a')).toBe(false);
  });
  test('it returns true if asyncly valid and no sync status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it returns true if syncly valid and no async status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it returns true if syncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it returns true if asyncly invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyInvalid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it returns false if async error', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.isValidated(fs, 'a')).toBe(false);
  });
  test('it returns false if syncly valid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(false);
  });
  test('it returns true if syncly invalid and waiting for async', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyInvalid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it returns true if syncly valid and asyncly valid', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSynclyValid(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
});

describe('setMessage', () => {
  test('it sets a message', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setMessage(fs, '', 'hello');
    fs = rff.setMessage(fs, 'a', 'there');
    expect(rff.getMessage(fs, '')).toBe('hello');
    expect(rff.getMessage(fs, 'a')).toBe('there');
  });
  test('it defaults to an empty string', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setMessage(fs, '', null);
    fs = rff.setMessage(fs, 'a', null);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
  });
});

describe('setChanged', () => {
  test('it sets a field and the enclosing scopes changed', () => {
    let fs = rff.initializeFormstate({a: {b: {c: 1}, bb: {cc: 2}}, aa: 3});
    fs = rff.setChanged(fs, 'a.b.c');
    expect(rff.isChanged(fs, '')).toBe(true);
    expect(rff.isChanged(fs, 'a')).toBe(true);
    expect(rff.isChanged(fs, 'aa')).toBe(false);
    expect(rff.isChanged(fs, 'a.b')).toBe(true);
    expect(rff.isChanged(fs, 'a.bb')).toBe(false);
    expect(rff.isChanged(fs, 'a.b.c')).toBe(true);
    expect(rff.isChanged(fs, 'a.bb.cc')).toBe(false);
  });
  test('it works in a nested formstate', () => {
    let fs = rff.initializeFormstate({a: {b: {c: 1}, bb: {cc: 2}}, aa: 3});
    const nestedScopeId = rff.getId(fs, 'a.b');
    fs.nestedScopeId = nestedScopeId
    fs = rff.setChanged(fs, 'c');
    expect(fs.nestedScopeId).toBe(nestedScopeId);
    fs.nestedScopeId = null;
    expect(rff.isChanged(fs, '')).toBe(true);
    expect(rff.isChanged(fs, 'a')).toBe(true);
    expect(rff.isChanged(fs, 'aa')).toBe(false);
    expect(rff.isChanged(fs, 'a.b')).toBe(true);
    expect(rff.isChanged(fs, 'a.bb')).toBe(false);
    expect(rff.isChanged(fs, 'a.b.c')).toBe(true);
    expect(rff.isChanged(fs, 'a.bb.cc')).toBe(false);
  });
});

describe('setBlurred', () => {
  test('it sets a field or scope blurred but not the enclosing scopes', () => {
    let fs = rff.initializeFormstate({a: {b: {c: 1}, bb: {cc: 2}}, aa: 3});
    fs = rff.setBlurred(fs, 'a.b.c');
    expect(rff.isBlurred(fs, '')).toBe(false);
    expect(rff.isBlurred(fs, 'a')).toBe(false);
    expect(rff.isBlurred(fs, 'aa')).toBe(false);
    expect(rff.isBlurred(fs, 'a.b')).toBe(false);
    expect(rff.isBlurred(fs, 'a.bb')).toBe(false);
    expect(rff.isBlurred(fs, 'a.b.c')).toBe(true);
    expect(rff.isBlurred(fs, 'a.bb.cc')).toBe(false);
  });
});

describe('setSubmitting', () => {
  test('it sets a field or scope to submitting status', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSubmitting(fs, 'a')).toBe(false);
    fs = rff.setSubmitting(fs, 'a');
    expect(rff.isSubmitting(fs, 'a')).toBe(true);
  });
  test('it does not set a submitted field to submitting', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    fs = rff.setSubmitting(fs, 'a');
    expect(rff.isSubmitting(fs, 'a')).toBe(false);
  });
  test('...unless there was an async error', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    fs = rff.setSubmitting(fs, 'a');
    expect(rff.isSubmitting(fs, 'a')).toBe(true);
  });
});

describe('setSubmitted', () => {
  test('it sets a field or scope to submitted status', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSubmitted(fs, 'a')).toBe(false);
    fs = rff.setSubmitted(fs, 'a');
    expect(rff.isSubmitted(fs, 'a')).toBe(true);
  });
});

describe('setCustomProperty', () => {
  test('it sets a field or scope custom property', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setCustomProperty(fs, '', 'test', 1);
    fs = rff.setCustomProperty(fs, 'a', 'test', 2);
    expect(rff.getCustomProperty(fs, '', 'test')).toBe(1);
    expect(rff.getCustomProperty(fs, 'a', 'test')).toBe(2);
    fs = rff.setValueAndClearStatus(fs, 'a', 2);
    expect(rff.getCustomProperty(fs, '', 'test')).toBe(undefined);
    expect(rff.getCustomProperty(fs, 'a', 'test')).toBe(undefined);
  });
});

describe('setValueAndClearStatus', () => {
  test('it clears the status, and statuses for all enclosing scopes, and updates the model', () => {
    let fs = rff.initializeFormstate({a: {b: {c: 1}, bb: {cc: 2}}, aa: 3});
    fs = rff.setValid(fs, '');
    fs = rff.setValid(fs, 'a');
    fs = rff.setValid(fs, 'aa');
    fs = rff.setValid(fs, 'a.b');
    fs = rff.setValid(fs, 'a.bb');
    fs = rff.setValid(fs, 'a.b.c');
    fs = rff.setValid(fs, 'a.bb.cc');
    fs = rff.setValueAndClearStatus(fs, 'a.b.c', 22);
    expect(rff.isValidated(fs, '')).toBe(false);
    expect(rff.isValidated(fs, 'a')).toBe(false);
    expect(rff.isValidated(fs, 'aa')).toBe(true);
    expect(rff.isValidated(fs, 'a.b')).toBe(false);
    expect(rff.isValidated(fs, 'a.bb')).toBe(true);
    expect(rff.isValidated(fs, 'a.b.c')).toBe(false);
    expect(rff.isValidated(fs, 'a.bb.cc')).toBe(true);
    expect(rff.getValue(fs, 'a.b.c')).toBe(22);
  });
  test('it can update an array', () => {
    let fs = rff.initializeFormstate({a:[{b:[0,1,2]}]});
    fs = rff.setValueAndClearStatus(fs, 'a[0].b.2', 22);
    expect(rff.getValue(fs, 'a.0.b[2]')).toBe(22);
  });
  test('it cannot set a value for a scope', () => {
    let fs = rff.initializeFormstate({a:[]});
    expect(() => rff.setValueAndClearStatus(fs, 'a', [0,1,2])).toThrow(/You cannot set the value for a scope./);
    fs = rff.initializeFormstate({a:[]}, {fields:{'a':{}}});
    fs = rff.setValueAndClearStatus(fs, 'a', [0,1,2]);
    expect(rff.getValue(fs, 'a')).toStrictEqual([0,1,2]);
  });
  test('it works in a nested formstate', () => {
    let fs = rff.initializeFormstate({a: {b: {c: 1}, bb: {cc: 2}}, aa: 3});
    fs = rff.setValid(fs, '');
    fs = rff.setValid(fs, 'a');
    fs = rff.setValid(fs, 'aa');
    fs = rff.setValid(fs, 'a.b');
    fs = rff.setValid(fs, 'a.bb');
    fs = rff.setValid(fs, 'a.b.c');
    fs = rff.setValid(fs, 'a.bb.cc');
    const nestedScopeId = rff.getId(fs, 'a.b');
    fs.nestedScopeId = nestedScopeId
    fs = rff.setValueAndClearStatus(fs, 'c', 22);
    expect(fs.nestedScopeId).toBe(nestedScopeId);
    fs.nestedScopeId = null;
    expect(rff.isValidated(fs, '')).toBe(false);
    expect(rff.isValidated(fs, 'a')).toBe(false);
    expect(rff.isValidated(fs, 'aa')).toBe(true);
    expect(rff.isValidated(fs, 'a.b')).toBe(false);
    expect(rff.isValidated(fs, 'a.bb')).toBe(true);
    expect(rff.isValidated(fs, 'a.b.c')).toBe(false);
    expect(rff.isValidated(fs, 'a.bb.cc')).toBe(true);
    expect(rff.getValue(fs, 'a.b.c')).toBe(22);
  });
});
