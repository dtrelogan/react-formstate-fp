import { addScope, normalizeModelKey, parseParentScope, parseRootScope } from '../lib/helperFunctions.js';

describe('addScope', () => {
  test('it should add a dot', () => {
    expect(addScope('a', 'b')).toBe('a.b');
    expect(addScope('a', '')).toBe('a');
    expect(addScope('', 'b')).toBe('b');
    expect(addScope('', '')).toBe('');
    expect(addScope(null, null)).toBe('');
    expect(addScope(undefined, undefined)).toBe('');
    expect(addScope('.', '.')).toBe('...');
  });
});

describe('normalizeModelKey', () => {
  test('it should convert brackets to dots', () => {
    expect(normalizeModelKey('contacts[0]')).toBe('contacts.0');
    expect(normalizeModelKey('contacts[0][1]')).toBe('contacts.0.1');
    expect(normalizeModelKey('')).toBe('');
    expect(normalizeModelKey(null)).toBe('null');
    expect(normalizeModelKey(undefined)).toBe('undefined');
  });
  test('it removes a leading dot', () => {
    expect(normalizeModelKey('[0][1][2]')).toBe('0.1.2');
  });
});

describe('parseParentScope', () => {
  test('it should split on the last dot', () => {
    expect(parseParentScope('a.b.c')).toStrictEqual(['a.b','c']);
  });
  test('it should handle no dots', () => {
    expect(parseParentScope('a')).toStrictEqual(['','a']);
  });
});

describe('parseRootScope', () => {
  test('it should split on the first dot', () => {
    expect(parseRootScope('a.b.c')).toStrictEqual(['a','b.c']);
  });
  test('it should handle no dots', () => {
    expect(parseRootScope('a')).toStrictEqual(['a',null]);
  });
});
