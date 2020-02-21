import { initializeFormstate } from '../src/schemaAndLookup.js';
import { setBlurred } from '../src/fieldAndScopeStatus.js';
import { addModelKey, deleteModelKey } from '../src/validationAndEventHandlers.js';

function expectRootModelKeys(formstate, testKeys) {
  const keys = Object.keys(formstate.lookup.idsByRootModelKey);
  expect(testKeys.length === keys.length);
  const ids = Object.keys(formstate.lookup.rootModelKeysById);
  expect(testKeys.length === ids.length);
  testKeys.forEach(k => {
    const id = formstate.lookup.idsByRootModelKey[k];
    expect(k === formstate.lookup.rootModelKeysById[id]);
  });
}

function expectScopes(formstate, testKeys) {
  const keys = Object.keys(formstate.lookup.scopes);
  expect(testKeys.length === keys.length);
  testKeys.forEach(k => {
    const id = formstate.lookup.idsByRootModelKey[k];
    expect(formstate.lookup.scopes[id] === true);
  });
}

function status(formstate, rootModelKey) {
  return formstate.statuses[formstate.lookup.idsByRootModelKey[rootModelKey]];
}

function validationSchema(formstate, rootModelKey) {
  return formstate.validationSchemas[formstate.lookup.idsByRootModelKey[rootModelKey]];
}

describe('addModelKey', () => {
  test('it can add a field to the model', () => {
    let fs = initializeFormstate({a:1});
    expect(fs.model).toEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);

    fs = addModelKey(fs, 'b', 3);
    expect(fs.model).toEqual({a:1,b:3});
    expectRootModelKeys(fs, ['','a','b']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b')).toBe(undefined);
  });
  test('it can add a field and schema to the model', () => {
    let fs = initializeFormstate({a:1});
    fs = addModelKey(fs, 'b', 3, {fields:{'':{required: true}}});
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
  });
  test('it can add an object to the model', () => {
    let fs = initializeFormstate({a:1});
    fs = addModelKey(fs, 'b', {c:3});
    expect(fs.model).toEqual({a:1,b:{c:3}});
    expectRootModelKeys(fs, ['','a','b','b.c']);
    expectScopes(fs, ['','b']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(status(fs, 'b.c')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, 'b.c')).toBe(undefined);
  });
  test('it can add an object and schema to the model', () => {
    let fs = initializeFormstate({a:1});
    fs = addModelKey(fs, 'b', {c:3}, {fields:{'c':{required:true}},scopes:{'':{required:true}}});
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
    expect(validationSchema(fs, 'b.c').required).toBe(true);
  });
  test('it can add an array to the model', () => {
    let fs = initializeFormstate({a:1});
    fs = addModelKey(fs, 'b', [3,4]);
    expect(fs.model).toEqual({a:1,b:[3,4]});
    expectRootModelKeys(fs, ['','a','b','b.0','b.1']);
    expectScopes(fs, ['','b']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(status(fs, 'b.0')).toBe(undefined);
    expect(status(fs, 'b.1')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, 'b.0')).toBe(undefined);
    expect(validationSchema(fs, 'b.1')).toBe(undefined);
  });
  test('it can add an array and schema to the model', () => {
    let fs = initializeFormstate({a:1});
    fs = addModelKey(fs, 'b', [3,4], {fields:{'':{required:true}}});
    expect(fs.model).toEqual({a:1,b:[3,4]});
    expectRootModelKeys(fs, ['','a','b']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
  });
  test('it can add a field to an array', () => {
    let fs = initializeFormstate({a:[]});
    fs = addModelKey(fs, 'a.0', 1);
    expect(fs.model).toEqual({a:[1]});
    expectRootModelKeys(fs, ['','a','a.0']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0')).toBe(undefined);
  });
  test('it can add a field and schema to an array', () => {
    let fs = initializeFormstate({a:[]});
    fs = addModelKey(fs, 'a.0', 1, {fields:{'':{required:true}}});
    expect(fs.model).toEqual({a:[1]});
    expectRootModelKeys(fs, ['','a','a.0']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
  });
  test('it does not receive schemaForEach from parent scope', () => {
    let fs = initializeFormstate({a:[1]}, {scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    expect(fs.model).toEqual({a:[1]});
    expectRootModelKeys(fs, ['','a','a.0']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);

    fs = addModelKey(fs, 'a.1', 2);
    expect(fs.model).toEqual({a:[1,2]});
    expectRootModelKeys(fs, ['','a','a.0','a.1']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(status(fs, 'a.1')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
    expect(validationSchema(fs, 'a.1')).toBe(undefined);
  });
  test('it will only add one thing at a time', () => {
    let fs = initializeFormstate({a:[]});
    expect(() => addModelKey(fs, 'a.2', 1)).toThrow(/Unable to add/);
  });
  test('it cannot overwrite a field', () => {
    let fs = initializeFormstate({a:1});
    expect(() => addModelKey(fs, 'a', 2)).toThrow(/Unable to add/);
  });
  test('it honors immutability', () => { // TODO: There's probably a faster way to test immutability.
    const fs = initializeFormstate({a:1});
    const model = fs.model;
    const lookup = fs.lookup;
    const idsByRootModelKey = fs.lookup.idsByRootModelKey;
    const rootModelKeysById = fs.lookup.rootModelKeysById;
    const scopes = fs.lookup.scopes;
    const statuses = fs.statuses;
    const rootScopeStatus = status(fs, '');
    const validationSchemas = fs.validationSchemas;
    const formStatus = fs.formStatus;
    const nestedScopeId = fs.nestedScopeId;

    const fs1 = addModelKey(fs, 'b', 3, {fields:{'':{required: true}}});
    expect(fs).not.toBe(fs1);
    expect(model).not.toBe(fs1.model);
    expect(lookup).not.toBe(fs1.lookup);
    expect(idsByRootModelKey).not.toBe(fs1.lookup.idsByRootModelKey);
    expect(rootModelKeysById).not.toBe(fs1.lookup.rootModelKeysById);
    expect(scopes).not.toBe(fs1.lookup.scopes);
    expect(statuses).not.toBe(fs1.statuses);
    expect(rootScopeStatus).not.toBe(status(fs1, ''));
    expect(validationSchemas).not.toBe(fs1.validationSchemas);
    expect(formStatus).toBe(fs1.formStatus);
    expect(nestedScopeId).toBe(fs1.nestedScopeId);
  });
});



describe('deleteModelKey', () => {
  test('it can delete a field from the model', () => {
    let fs = initializeFormstate({a:1},{fields:{a:{required:true}}});
    fs = setBlurred(fs, 'a');
    expect(fs.model).toEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a').touched.blurred).toBe(true);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a').required).toBe(true);

    fs = deleteModelKey(fs, 'a');
    expect(fs.model).toEqual({});
    expectRootModelKeys(fs, ['']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
  });
  test('it can delete an object from the model', () => {
    let fs = initializeFormstate({a:1,b:{c:3}},{fields:{'b.c':{required:true}},scopes:{'b':{required:true}}});
    fs = setBlurred(fs, 'b');
    fs = setBlurred(fs, 'b.c');
    expect(fs.model).toEqual({a:1,b:{c:3}});
    expectRootModelKeys(fs, ['','a','b','b.c']);
    expectScopes(fs, ['','b']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b').touched.blurred).toBe(true);
    expect(status(fs, 'b.c').touched.blurred).toBe(true);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
    expect(validationSchema(fs, 'b.c').required).toBe(true);

    fs = deleteModelKey(fs, 'b');
    expect(fs.model).toEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(status(fs, 'b.c')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, 'b.c')).toBe(undefined);
  });
  test('it can delete an array from the model', () => {
    let fs = initializeFormstate({a:1,b:[3,4]},{fields:{'b.0':{required:true}},scopes:{'b':{required:true}}});
    fs = setBlurred(fs, 'b');
    fs = setBlurred(fs, 'b.0');
    expect(fs.model).toEqual({a:1,b:[3,4]});
    expectRootModelKeys(fs, ['','a','b','b.0','b.1']);
    expectScopes(fs, ['','b']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b').touched.blurred).toBe(true);
    expect(status(fs, 'b.0').touched.blurred).toBe(true);
    expect(status(fs, 'b.1')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
    expect(validationSchema(fs, 'b.0').required).toBe(true);
    expect(validationSchema(fs, 'b.1')).toBe(undefined);

    fs = deleteModelKey(fs, 'b');
    expect(fs.model).toEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'b')).toBe(undefined);
    expect(status(fs, 'b.0')).toBe(undefined);
    expect(status(fs, 'b.1')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b')).toBe(undefined);
    expect(validationSchema(fs, 'b.0')).toBe(undefined);
    expect(validationSchema(fs, 'b.1')).toBe(undefined);
  });
  test('it can delete a field from the beginning of an array', () => {
    let fs = initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.1'];
    const secondId = fs.lookup.idsByRootModelKey['a.2'];
    fs = setBlurred(fs, 'a.1');
    fs = setBlurred(fs, 'a.2');
    expect(fs.model).toEqual({a:[1,2,3]});
    expectRootModelKeys(fs, ['','a','a.0','a.1','a.2']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(status(fs, 'a.1').touched.blurred).toBe(true);
    expect(status(fs, 'a.2').touched.blurred).toBe(true);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
    expect(validationSchema(fs, 'a.1').required).toBe(true);
    expect(validationSchema(fs, 'a.2').required).toBe(true);

    fs = deleteModelKey(fs, 'a.0');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toEqual({a:[2,3]});
    expectRootModelKeys(fs, ['','a','a.0','a.1']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0').touched.blurred).toBe(true);
    expect(status(fs, 'a.1').touched.blurred).toBe(true);
    expect(status(fs, 'a.2')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
    expect(validationSchema(fs, 'a.1').required).toBe(true);
    expect(validationSchema(fs, 'a.2')).toBe(undefined);
  });
  test('it can delete a field from the middle of an array', () => {
    let fs = initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.0'];
    const secondId = fs.lookup.idsByRootModelKey['a.2'];
    fs = setBlurred(fs, 'a.0');
    fs = setBlurred(fs, 'a.2');

    fs = deleteModelKey(fs, 'a.1');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toEqual({a:[1,3]});
    expectRootModelKeys(fs, ['','a','a.0','a.1']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0').touched.blurred).toBe(true);
    expect(status(fs, 'a.1').touched.blurred).toBe(true);
    expect(status(fs, 'a.2')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
    expect(validationSchema(fs, 'a.1').required).toBe(true);
    expect(validationSchema(fs, 'a.2')).toBe(undefined);
  });
  test('it can delete a field from the end of an array', () => {
    let fs = initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.0'];
    const secondId = fs.lookup.idsByRootModelKey['a.1'];
    fs = setBlurred(fs, 'a.0');
    fs = setBlurred(fs, 'a.1');

    fs = deleteModelKey(fs, 'a.2');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toEqual({a:[1,2]});
    expectRootModelKeys(fs, ['','a','a.0','a.1']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a').touched.changed).toBe(true);
    expect(status(fs, 'a.0').touched.blurred).toBe(true);
    expect(status(fs, 'a.1').touched.blurred).toBe(true);
    expect(status(fs, 'a.2')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);
    expect(validationSchema(fs, 'a.1').required).toBe(true);
    expect(validationSchema(fs, 'a.2')).toBe(undefined);
  });
  test('it will not delete a non-existent field', () => {
    let fs = initializeFormstate({a:1});
    expect(() => deleteModelKey(fs, 'b')).toThrow(/Unable to delete/);
  });
  test('it honors immutability', () => { // TODO: There's probably a faster way to test immutability.
    const fs = initializeFormstate({a:1}, {fields:{'a':{required: true}}});
    const model = fs.model;
    const lookup = fs.lookup;
    const idsByRootModelKey = fs.lookup.idsByRootModelKey;
    const rootModelKeysById = fs.lookup.rootModelKeysById;
    const scopes = fs.lookup.scopes;
    const statuses = fs.statuses;
    const rootScopeStatus = status(fs, '');
    const validationSchemas = fs.validationSchemas;
    const formStatus = fs.formStatus;
    const nestedScopeId = fs.nestedScopeId;

    const fs1 = deleteModelKey(fs, 'a');
    expect(fs).not.toBe(fs1);
    expect(model).not.toBe(fs1.model);
    expect(lookup).not.toBe(fs1.lookup);
    expect(idsByRootModelKey).not.toBe(fs1.lookup.idsByRootModelKey);
    expect(rootModelKeysById).not.toBe(fs1.lookup.rootModelKeysById);
    expect(scopes).not.toBe(fs1.lookup.scopes);
    expect(statuses).not.toBe(fs1.statuses);
    expect(rootScopeStatus).not.toBe(status(fs1, ''));
    expect(validationSchemas).not.toBe(fs1.validationSchemas);
    expect(formStatus).toBe(fs1.formStatus);
    expect(nestedScopeId).toBe(fs1.nestedScopeId);
  });
});
