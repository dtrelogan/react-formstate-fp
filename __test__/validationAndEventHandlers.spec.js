import { rff } from '../lib/index.js';
import { setPromise, clearPromise } from '../lib/fieldAndScopeStatus.js';
import { validateRequired, _synclyValidate } from '../lib/validationAndEventHandlers.js';

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
  test('it cannot add a field to a field', () => {
    let fs = rff.initializeFormstate({a:1});
    expect(() => rff.addModelKey(fs, 'a.b', 3)).toThrow(/Unable to add/);
  });
  test('it can add a field to the model', () => {
    let fs = rff.initializeFormstate({a:1});
    expect(fs.model).toStrictEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);

    fs = rff.addModelKey(fs, 'b', 3);
    expect(fs.model).toStrictEqual({a:1,b:3});
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a:1});
    expect(rff.getInitialValue(fs, 'a')).toBe(1);
    expect(rff.getInitialValue(fs, 'b')).toBe(undefined);
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
    let fs = rff.initializeFormstate({a:1});
    fs = rff.addModelKey(fs, 'b', 3, {fields:{'':{required: true}}});
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
  });
  test('it can add an object to the model', () => {
    let fs = rff.initializeFormstate({a:1});
    fs = rff.addModelKey(fs, 'b', {c:3});
    expect(fs.model).toStrictEqual({a:1,b:{c:3}});
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a:1});
    expect(rff.getInitialValue(fs, 'a')).toBe(1);
    expect(rff.getInitialValue(fs, 'b')).toBe(undefined);
    expect(rff.getInitialValue(fs, 'b.c')).toBe(undefined);
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
    let fs = rff.initializeFormstate({a:1});
    fs = rff.addModelKey(fs, 'b', {c:3}, {fields:{'c':{required:true}},scopes:{'':{required:true}}});
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'b').required).toBe(true);
    expect(validationSchema(fs, 'b.c').required).toBe(true);
  });
  test('it can add an array to the model', () => {
    let fs = rff.initializeFormstate({a:1});
    fs = rff.addModelKey(fs, 'b', [3,4]);
    expect(fs.model).toStrictEqual({a:1,b:[3,4]});
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
    let fs = rff.initializeFormstate({a:1});
    fs = rff.addModelKey(fs, 'b', [3,4], {fields:{'':{required:true}}});
    expect(fs.model).toStrictEqual({a:1,b:[3,4]});
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
    let fs = rff.initializeFormstate({a:[]});
    fs = rff.addModelKey(fs, 'a.0', 1);
    expect(fs.model).toStrictEqual({a:[1]});
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
    let fs = rff.initializeFormstate({a:[]});
    fs = rff.addModelKey(fs, 'a.0', 1, {fields:{'':{required:true}}});
    expect(fs.model).toStrictEqual({a:[1]});
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
    let fs = rff.initializeFormstate({a:[1]}, {scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    expect(fs.model).toStrictEqual({a:[1]});
    expectRootModelKeys(fs, ['','a','a.0']);
    expectScopes(fs, ['','a']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a')).toBe(undefined);
    expect(status(fs, 'a.0')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, 'a.0').required).toBe(true);

    fs = rff.addModelKey(fs, 'a.1', 2);
    expect(fs.model).toStrictEqual({a:[1,2]});
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
    let fs = rff.initializeFormstate({a:[]});
    expect(() => rff.addModelKey(fs, 'a.2', 1)).toThrow(/Unable to add/);
  });
  test('it cannot overwrite a field', () => {
    let fs = rff.initializeFormstate({a:1});
    expect(() => rff.addModelKey(fs, 'a', 2)).toThrow(/Unable to add/);
  });
  test('it honors immutability', () => { // TODO: There's probably a faster way to test immutability.
    const fs = rff.initializeFormstate({a:1});
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

    const fs1 = rff.addModelKey(fs, 'b', 3, {fields:{'':{required: true}}});
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
  test('schemaForEach does not replace the schema passed to addModelKey', () => {
    const addressSchema = {
      fields: {
        'line1': { required: true }
      }
    };
    const contactSchema = {
      fields: {
        'name': { required: true }
      },
      scopes: {
        'address': { schema: addressSchema }
      }
    };
    const schema = {
      fields: {
        'a': { required: true }
      },
      scopes: {
        'contacts': { schemaForEach: contactSchema }
      }
    };
    const initialModel = {
      a: 1,
      contacts: []
    };
    let fs = rff.initializeFormstate(initialModel, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'a')]).not.toBe(undefined);
    fs = rff.addModelKey(fs, 'contacts.0', { name: '', address: { line1: '' } });
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.0.name')]).toBe(undefined);
    fs = rff.addModelKey(fs, 'contacts.1', { name: '', address: { line1: '' } }, contactSchema);
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.1.name')]).not.toBe(undefined);
  });
  test('it works if the formstate is in a nested scope', () => {
    const initialModel = {
      name: 'test',
      contact: {
        name: 'test contact',
        addresses: [
          {
            line1: 'test 1'
          }
        ]
      }
    };
    const addressSchema = {
      fields: {
        line1: { required: true }
      }
    };
    const contactSchema = {
      fields: {
        name: { required: true }
      },
      scopes: {
        addresses: { schemaForEach: addressSchema }
      }
    };
    const schema = {
      fields: {
        name: { required: true },
      },
      scopes: {
        contact: { schema: contactSchema }
      }
    };
    let fs = rff.initializeFormstate(initialModel, schema);
    fs.nestedScopeId = rff.getId(fs, 'contact');
    fs = rff.addModelKey(fs, 'addresses.1', {line1: 'test 2'}, addressSchema);
    expect(rff.getValue(fs, 'addresses.0.line1')).toBe('test 1');
    expect(rff.getValue(fs, 'addresses.1.line1')).toBe('test 2');
    fs.nestedScopeId = null;
    fs = rff.synclyValidateForm(fs, {});
    expect(rff.isValid(fs, 'name')).toBe(true);
    expect(rff.isValid(fs, 'contact.name')).toBe(true);
    expect(rff.isValid(fs, 'contact.addresses.0.line1')).toBe(true);
    expect(rff.isValid(fs, 'contact.addresses.1.line1')).toBe(true);
    fs = rff.setValueAndClearStatus(fs, 'contact.addresses.1.line1', '');
    fs = rff.synclyValidateForm(fs, {});
    expect(rff.isValid(fs, 'contact.addresses.1.line1')).toBe(false);
    expect(rff.isInvalid(fs, 'contact.addresses.1.line1')).toBe(true);
  });
});



describe('deleteModelKey', () => {
  test('it can delete a field from the model', () => {
    let fs = rff.initializeFormstate({a:1},{fields:{a:{required:true}}});
    fs = rff.setBlurred(fs, 'a');
    expect(fs.model).toStrictEqual({a:1});
    expectRootModelKeys(fs, ['','a']);
    expectScopes(fs, ['']);
    expect(status(fs, '')).toBe(undefined);
    expect(status(fs, 'a').touched.blurred).toBe(true);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a').required).toBe(true);

    fs = rff.deleteModelKey(fs, 'a');
    expect(fs.model).toStrictEqual({});
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a:1});
    expect(rff.getInitialValue(fs, 'a')).toStrictEqual(1);
    expectRootModelKeys(fs, ['']);
    expectScopes(fs, ['']);
    expect(status(fs, '').touched.changed).toBe(true);
    expect(status(fs, 'a')).toBe(undefined);
    expect(validationSchema(fs, '')).toBe(undefined);
    expect(validationSchema(fs, 'a')).toBe(undefined);
  });
  test('it can delete an object from the model', () => {
    let fs = rff.initializeFormstate({a:1,b:{c:3}},{fields:{'b.c':{required:true}},scopes:{'b':{required:true}}});
    fs = rff.setBlurred(fs, 'b');
    fs = rff.setBlurred(fs, 'b.c');
    expect(fs.model).toStrictEqual({a:1,b:{c:3}});
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

    fs = rff.deleteModelKey(fs, 'b');
    expect(fs.model).toStrictEqual({a:1});
    expect(rff.getInitialValue(fs, '')).toStrictEqual({a:1,b:{c:3}});
    expect(rff.getInitialValue(fs, 'a')).toStrictEqual(1);
    expect(rff.getInitialValue(fs, 'b')).toStrictEqual({c:3});
    expect(rff.getInitialValue(fs, 'b.c')).toStrictEqual(3);
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
    let fs = rff.initializeFormstate({a:1,b:[3,4]},{fields:{'b.0':{required:true}},scopes:{'b':{required:true}}});
    fs = rff.setBlurred(fs, 'b');
    fs = rff.setBlurred(fs, 'b.0');
    expect(fs.model).toStrictEqual({a:1,b:[3,4]});
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

    fs = rff.deleteModelKey(fs, 'b');
    expect(fs.model).toStrictEqual({a:1});
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
    let fs = rff.initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.1'];
    const secondId = fs.lookup.idsByRootModelKey['a.2'];
    fs = rff.setBlurred(fs, 'a.1');
    fs = rff.setBlurred(fs, 'a.2');
    expect(fs.model).toStrictEqual({a:[1,2,3]});
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

    fs = rff.deleteModelKey(fs, 'a.0');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toStrictEqual({a:[2,3]});
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
    let fs = rff.initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.0'];
    const secondId = fs.lookup.idsByRootModelKey['a.2'];
    fs = rff.setBlurred(fs, 'a.0');
    fs = rff.setBlurred(fs, 'a.2');

    fs = rff.deleteModelKey(fs, 'a.1');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toStrictEqual({a:[1,3]});
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
    let fs = rff.initializeFormstate({a:[1,2,3]},{scopes:{a:{schemaForEach:{fields:{'':{required:true}}}}}});
    const firstId = fs.lookup.idsByRootModelKey['a.0'];
    const secondId = fs.lookup.idsByRootModelKey['a.1'];
    fs = rff.setBlurred(fs, 'a.0');
    fs = rff.setBlurred(fs, 'a.1');

    fs = rff.deleteModelKey(fs, 'a.2');
    expect(firstId).toBe(fs.lookup.idsByRootModelKey['a.0']);
    expect(secondId).toBe(fs.lookup.idsByRootModelKey['a.1']);
    expect(fs.model).toStrictEqual({a:[1,2]});
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
    let fs = rff.initializeFormstate({a:1});
    expect(() => rff.deleteModelKey(fs, 'b')).toThrow(/Unable to delete/);
  });
  test('it honors immutability', () => { // TODO: There's probably a faster way to test immutability.
    const fs = rff.initializeFormstate({a:1}, {fields:{'a':{required: true}}});
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

    const fs1 = rff.deleteModelKey(fs, 'a');
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
  test('it works if the formstate is in a nested scope', () => {
    const initialModel = {
      name: 'test',
      contact: {
        name: 'test contact',
        addresses: [
          {
            line1: 'test 1'
          }
        ]
      }
    };
    const addressSchema = {
      fields: {
        line1: { required: true }
      }
    };
    const contactSchema = {
      fields: {
        name: { required: true }
      },
      scopes: {
        addresses: { schemaForEach: addressSchema }
      }
    };
    const schema = {
      fields: {
        name: { required: true },
      },
      scopes: {
        contact: { schema: contactSchema }
      }
    };
    let fs = rff.initializeFormstate(initialModel, schema);
    const addrId = rff.getId(fs, 'contact.addresses.0.line1');
    expect(fs.validationSchemas[addrId].required).toBe(true);
    fs.nestedScopeId = rff.getId(fs, 'contact');
    fs = rff.deleteModelKey(fs, 'addresses.0');
    expect(rff.getValue(fs, 'addresses').length).toBe(0);
    expect(fs.validationSchemas[addrId]).toBe(undefined);
  });
});


describe('deleteModelKeyAndValidateParentScope', () => {
  test('it can delete a field and validate parent scope', () => {
    let fs = rff.initializeFormstate({a:[0]},{scopes:{a:{required:true}}});
    fs.nestedScopeId = rff.getId(fs, 'a');
    fs = rff.deleteModelKeyAndValidateParentScope(fs, '0', {});
    fs.nestedScopeId = null;
    expect(fs.model).toStrictEqual({a:[]});
    expect(rff.isInvalid(fs, 'a')).toBe(true);
  });
  test('it can delete a field and validate parent scope jsx', () => {
    let fs = rff.initializeFormstate({a:[0]});
    const form = {validationSchemas:{}};
    form.validationSchemas[rff.getId(fs, 'a')] = { required: true, requiredMessage: 'req' };
    fs = rff.deleteModelKeyAndValidateParentScope(fs, 'a.0', form);
    expect(fs.model).toStrictEqual({a:[]});
    expect(rff.isInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('req');
  });
});


describe('validateRequired', () => {
  test('returns message if value is undefined', () => {
    expect(validateRequired(undefined, 'msg')).toBe('msg');
  });
  test('returns message if value is null', () => {
    expect(validateRequired(null, 'msg')).toBe('msg');
  });
  test('returns message if empty string', () => {
    expect(validateRequired('', 'msg')).toBe('msg');
    expect(validateRequired('     ', 'msg')).toBe('msg');
    expect(validateRequired('something', 'msg')).toBe(undefined);
  });
  test('returns message if empty array', () => {
    expect(validateRequired([], 'msg')).toBe('msg');
    expect(validateRequired([1], 'msg')).toBe(undefined);
  });
  test('returns undefined otherwise', () => {
    expect(validateRequired(3, 'msg')).toBe(undefined);
  });
});


describe('_synclyValidate', () => {
  test('sets to syncly valid if no validation specified', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyValid(fs, 'a')).toBe(true);
  });
  test('it validates required', () => {
    let fs = rff.initializeFormstate({a: null}, {fields:{'a':{required:'req'}}});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('req');
  });
  test('it validates required jsx', () => {
    let fs = rff.initializeFormstate({a: null});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    const form = {validationSchemas: {}};
    form.validationSchemas[rff.getId(fs, 'a')] = {required: true, requiredMessage: 'req'};
    fs = _synclyValidate(fs, 'a', form, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('req');
  });
  test('required validation can pass', () => {
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{required:true}}});
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyValid(fs, 'a')).toBe(true);
  });
  test('it calls a configured validation function', () => {
    function f() {return 'msg'}
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate:f}}});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
  });
  test('it calls a configured validation function jsx', () => {
    function f() {return 'msg'}
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    const form = {validationSchemas: {}};
    form.validationSchemas[rff.getId(fs, 'a')] = {validate: f};
    fs = _synclyValidate(fs, 'a', form, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
  });
  test('validation can pass', () => {
    function f() {}
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate:f}}});
    expect(rff.isSynclyValid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyValid(fs, 'a')).toBe(true);
  });
  test('the validation function can return updated formstate', () => {
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate:f}}});
    function f() {return rff.setInvalid(fs, 'a');}
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
  });
  test('scope validation sets scope to syncly valid by default', () => {
    let fs = rff.initializeFormstate({a: 1}, {scopes:{'':{validate:f}}});
    function f() {return fs;}
    expect(rff.isSynclyValid(fs, '')).toBe(false);
    fs = _synclyValidate(fs, '', {}, rff.getId(fs, ''));
    expect(rff.isSynclyValid(fs, '')).toBe(true);
  });
  test('scope validation can set scope to invalid with a msg', () => {
    let fs = rff.initializeFormstate({a: 1}, {scopes:{'':{validate:f}}});
    function f() {return 'msg';}
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    fs = _synclyValidate(fs, '', {}, rff.getId(fs, ''));
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
  });
  test('scope validation can set scope to invalid with updated formstate', () => {
    let fs = rff.initializeFormstate({a: 1}, {scopes:{'':{validate:f}}});
    function f() {return rff.setInvalid(fs, '');}
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    fs = _synclyValidate(fs, '', {}, rff.getId(fs, ''));
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
  });
  test('validation can leave a field not syncly validated', () => {
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate:f}}});
    function f() {return fs;}
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
  });
  test('returning an unexpected value throws an error', () => {
    const m = /Validation functions should return an error message, an updated formstate object, or nothing./;
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate:f}}});
    function f() {return 3;}
    expect(() => _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'))).toThrow(m);
  });
  test('required validation runs first', () => {
    function f() {return 'msg';}
    let fs = rff.initializeFormstate({a: null}, {fields:{'a':{required:'req', validate: f}}});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('req');
  });
  test('validation runs if required passes', () => {
    function f() {return 'msg';}
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{required:'req', validate: f}}});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', {}, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
  });
  test('the validation function is passed certain parameters', () => {
    const form = {};
    function f(v, fs, fm, id) {
      expect(v).toBe(1);
      expect(fs.model.a).toBe(1);
      expect(fs.nestedScopeId).toBe(null);
      expect(fm).toBe(form);
      expect(id).toBe(rff.getId(fs, 'a'));
      return 'msg';
    }
    let fs = rff.initializeFormstate({a: 1}, {fields:{'a':{validate: f}}});
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    fs = _synclyValidate(fs, 'a', form, rff.getId(fs, 'a'));
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
  });
  test('a nested validation function is forced into a nested scope', () => {
    let fs;
    const form = {
      setFormstate: () => {},
      someOption: true
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(nestedForm.getFormstate).toBe(undefined);
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.aa'));
      expect(id).toBe(rff.getId(nestedFs, 'aa'));
      return 'msg'
    }
    const nestedSchema = { fields: { 'aa' : { validate: f } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({a: {aa: 1}}, schema);
    fs = _synclyValidate(fs, 'a.aa', form, rff.getId(fs, 'a.aa'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('msg');
  });
  test('a nested validation function can still return a formstate', () => {
    let fs;
    const form = {
      setFormstate: () => {}
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(id).toBe(rff.getId(fs, 'a.aa'));
      expect(id).toBe(rff.getId(nestedFs, 'aa'));
      return rff.setInvalid(nestedFs, 'aa', 'msg');
    }
    const nestedSchema = { fields: { 'aa' : { validate: f } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({a: {aa: 1}}, schema);
    fs = _synclyValidate(fs, 'a.aa', form, rff.getId(fs, 'a.aa'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('msg');
  });
  test('a nested validation function normally runs in a nested scope', () => {
    let scopeId;
    const form = {
      setFormstate: () => {},
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(scopeId);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(nestedFs, 'aa'));
      return 'msg'
    }
    const nestedSchema = { fields: { 'aa' : { validate: f } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    let fs = rff.initializeFormstate({a: {aa: 1}}, schema);
    scopeId = rff.getId(fs, 'a');
    fs.nestedScopeId = scopeId;
    fs = _synclyValidate(fs, 'aa', form, rff.getId(fs, 'aa'));
    expect(fs.nestedScopeId).toBe(scopeId);
    expect(rff.isInvalid(fs, 'aa')).toBe(true);
    expect(rff.getMessage(fs, 'aa')).toBe('msg');
  });
  test('a nested validation function normally runs in a nested scope and can return a formstate', () => {
    let scopeId;
    const form = {
      setFormstate: () => {},
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(scopeId);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(nestedFs, 'aa'));
      return rff.setValid(nestedFs, 'aa', 'msg')
    }
    const nestedSchema = { fields: { 'aa' : { validate: f } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    let fs = rff.initializeFormstate({a: {aa: 1}}, schema);
    scopeId = rff.getId(fs, 'a');
    fs.nestedScopeId = scopeId;
    fs = _synclyValidate(fs, 'aa', form, rff.getId(fs, 'aa'));
    expect(fs.nestedScopeId).toBe(scopeId);
    expect(rff.isValid(fs, 'aa')).toBe(true);
    expect(rff.getMessage(fs, 'aa')).toBe('msg');
  });
  test('a nested validation function can get passed a form with getFormstate', () => {
    // Although you shouldn't use setFormstate or getFormstate in a synchronous handler...
    // But it's easiest to simply reuse the same function that asynclyValidate and the nestedForm prop use...
    let fs;
    const form = {
      setFormstate: () => {},
      getFormstate: () => {},
      someOption: true
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(typeof(nestedForm.getFormstate)).toBe('function');
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.aa'));
      expect(id).toBe(rff.getId(nestedFs, 'aa'));
      return 'msg'
    }
    const nestedSchema = { fields: { 'aa' : { validate: f } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({a: {aa: 1}}, schema);
    fs = _synclyValidate(fs, 'a.aa', form, rff.getId(fs, 'a.aa'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('msg');
  });
  test('scope is still marked valid if nested scope is forced', () => {
    // This is a little mind bending, but I think it's correct.
    let fs;
    const form = {
      setFormstate: () => {}
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toStrictEqual({line1: 1});
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'contact'));
      expect(nestedForm).not.toBe(form);
      expect(id).toBe(rff.getId(fs, 'contact.address'));
      expect(id).toBe(rff.getId(nestedFs, 'address'));
      return rff.setInvalid(nestedFs, 'address.line1', 'msg');
    }
    const nestedSchema = { scopes: { 'address' : { validate: f } } };
    const schema = { scopes: { 'contact' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({contact: {address: {line1: 1}}}, schema);
    fs = _synclyValidate(fs, 'contact.address', form, rff.getId(fs, 'contact.address'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isValid(fs, 'contact.address')).toBe(true);
    expect(rff.isInvalid(fs, 'contact.address.line1')).toBe(true);
    expect(rff.getMessage(fs, 'contact.address.line1')).toBe('msg');
  });
  test('scope is still marked valid if nested scope is forced variant', () => {
    // This one is a little more intuitive.
    let fs;
    const form = {
      setFormstate: () => {}
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toStrictEqual({address: { line1: 1 }});
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'contact'));
      expect(nestedForm).not.toBe(form);
      expect(id).toBe(rff.getId(fs, 'contact'));
      expect(id).toBe(rff.getId(nestedFs, ''));
      return rff.setInvalid(nestedFs, 'address.line1', 'msg');
    }
    const nestedSchema = { scopes: { '' : { validate: f } } };
    const schema = { scopes: { 'contact' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({contact: {address: {line1: 1}}}, schema);
    fs = _synclyValidate(fs, 'contact', form, rff.getId(fs, 'contact'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isValid(fs, 'contact')).toBe(true);
    expect(rff.isInvalid(fs, 'contact.address.line1')).toBe(true);
    expect(rff.getMessage(fs, 'contact.address.line1')).toBe('msg');
  });
  test('nested scope is the root scope edge case', () => {
    let fs;
    const form = {
      setFormstate: () => {}
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toStrictEqual({contact: { address: { line1: 1 }}});
      expect(nestedFs.nestedScopeId).toBe(null);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(fs, ''));
      expect(id).toBe(rff.getId(nestedFs, ''));
      return rff.setInvalid(nestedFs, 'contact.address.line1', 'msg');
    }
    function g(v, nestedFs, nestedForm, id) {
      expect(v).toStrictEqual({address: { line1: 1 }});
      expect(nestedFs.nestedScopeId).toBe(null);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(fs, 'contact'));
      expect(id).toBe(rff.getId(nestedFs, 'contact'));
      return rff.setValid(nestedFs, 'contact.address.line1', 'new msg');
    }
    const nestedSchema = { scopes: { '' : { validate: f }, 'contact': { validate: g } } };
    const schema = { scopes: { '' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({contact: {address: {line1: 1}}}, schema);
    fs = _synclyValidate(fs, '', form, rff.getId(fs, ''));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isValid(fs, '')).toBe(true);
    expect(rff.isInvalid(fs, 'contact.address.line1')).toBe(true);
    expect(rff.getMessage(fs, 'contact.address.line1')).toBe('msg');
    fs = _synclyValidate(fs, 'contact', form, rff.getId(fs, 'contact'));
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isValid(fs, 'contact')).toBe(true);
    expect(rff.isValid(fs, 'contact.address.line1')).toBe(true);
    expect(rff.getMessage(fs, 'contact.address.line1')).toBe('new msg');
  });
});


describe('synclyValidate', () => {
  test('it syncly validates a scope', () => {
    function f() {return 'msg';}
    let fs = rff.initializeFormstate({a: null}, {scopes:{'':{validate:f}}});
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    fs = rff.synclyValidate(fs, '', {});
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
  });
  test('it syncly validates a scope jsx', () => {
    function f() {return 'msg';}
    let fs = rff.initializeFormstate({a: null});
    const form = {validationSchemas:{}};
    form.validationSchemas[rff.getId(fs, '')] = {validate: f};
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    fs = rff.synclyValidate(fs, '', form);
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
  });
  test('it validates a field and enclosing scopes', () => {
    function f() {return 'msg';}
    const model = {
      a: {aa: null},
      b: {bb: null}
    };
    const schema = {
      fields: {
        'a.aa': { required: 'req' },
        'b.bb': { required: 'req' },
      },
      scopes: {
        '': { validate: f },
        'a': { validate: f },
        'b': { validate: f },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    fs = rff.synclyValidate(fs, 'a.aa', {});
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('req');
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.getMessage(fs, 'b')).toBe('');
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    expect(rff.getMessage(fs, 'b.bb')).toBe('');
  });
  test('validates enclosing scopes in order of precision', () => {
    const model = {
      a: {
        b: {
          c: null
        }
      }
    };
    const schema = {
      fields: {
        'a.b.c': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(false);
            return 'a.b.c';
          }
        }
      },
      scopes: {
        '': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'root';
          }
        },
        'a': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'a';
          }
        },
        'a.b': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'a.b';
          }
        },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
    expect(rff.getMessage(fs, 'a.b')).toBe('');
    expect(rff.getMessage(fs, 'a.b.c')).toBe('');
    fs = rff.synclyValidate(fs, 'a.b.c', {});
    expect(rff.getMessage(fs, '')).toBe('root');
    expect(rff.getMessage(fs, 'a')).toBe('a');
    expect(rff.getMessage(fs, 'a.b')).toBe('a.b');
    expect(rff.getMessage(fs, 'a.b.c')).toBe('a.b.c');
  });
  test('does not run validation again if already validated', () => {
    const schema = {
      'fields': {
        'a': { validate: () => { throw new Error('a was validated?'); } }
      },
      'scopes': {
        '': { validate: () => { throw new Error('root scope was validated?'); } }
      }
    };
    let fs = rff.initializeFormstate({a: null}, schema);
    expect(() => rff.synclyValidate(fs, 'a', {})).toThrow(/a was validated?/);
    fs = rff.setValid(fs, 'a');
    expect(() => rff.synclyValidate(fs, 'a', {})).toThrow(/root scope was validated?/);
    fs = rff.setInvalid(fs, '');
    expect(() => rff.synclyValidate(fs, 'a', {})).not.toThrow();
  });
  test('it can run from a nested scope', () => {
    function f() {return 'msg';}
    const model = {
      a: {aa: null},
      b: {bb: null}
    };
    const schema = {
      fields: {
        'a.aa': { required: 'req' },
        'b.bb': { required: 'req' },
      },
      scopes: {
        '': { validate: f },
        'a': { validate: f },
        'b': { validate: f },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    fs.nestedScopeId = rff.getId(fs, 'a');
    fs = rff.synclyValidate(fs, 'aa', {});
    expect(fs.nestedScopeId).not.toBe(null);
    fs.nestedScopeId = null;
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('req');
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.getMessage(fs, 'b')).toBe('');
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    expect(rff.getMessage(fs, 'b.bb')).toBe('');
  });
});


describe('validateForm', () => {
  test('it is an alias for synclyValidateForm', () => {
    expect(rff.validateForm).toBe(rff.synclyValidateForm);
  });
});


describe('synclyValidateForm', () => {
  test('it validates all fields and scopes', () => {
    function f() {return 'msg';}
    const model = {
      a: {aa: null},
      b: {bb: null}
    };
    const schema = {
      fields: {
        'a.aa': { required: 'req' },
        'b.bb': { required: 'req' },
      },
      scopes: {
        '': { validate: f },
        'a': { validate: f },
        'b': { validate: f },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    fs = rff.synclyValidateForm(fs, {});
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('req');
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(true);
    expect(rff.getMessage(fs, 'b')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(true);
    expect(rff.getMessage(fs, 'b.bb')).toBe('req');
  });
  test('it does not validate fields and scopes that are already validated', () => {
    const schema = {
      'fields': {
        'a': { validate: () => { throw new Error('a was validated?'); } },
        'b': { validate: () => { throw new Error('b was validated?'); } }
      },
      'scopes': {
        '': { validate: () => { throw new Error('root scope was validated?'); } }
      }
    };
    let fs = rff.initializeFormstate({a: null, b: null}, schema);
    expect(() => rff.synclyValidateForm(fs, {})).toThrow(/a was validated?/);
    fs = rff.setValid(fs, 'a');
    expect(() => rff.synclyValidateForm(fs, {})).toThrow(/b was validated?/);
    fs = rff.setInvalid(fs, 'b');
    expect(() => rff.synclyValidateForm(fs, {})).toThrow(/root scope was validated?/);
    fs = rff.setValid(fs, '');
    expect(() => rff.synclyValidateForm(fs, {})).not.toThrow();
  });
  test('it validates in order of precision starting from the most deeply nested scopes', () => {
    const model = {
      a: {
        b: {
          c: null
        }
      }
    };
    const schema = {
      fields: {
        'a.b.c': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(false);
            return 'a.b.c';
          }
        }
      },
      scopes: {
        '': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'root';
          }
        },
        'a': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(true);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'a';
          }
        },
        'a.b': {
          validate: (v, fs) => {
            expect(rff.isInvalid(fs, '')).toBe(false);
            expect(rff.isInvalid(fs, 'a')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b')).toBe(false);
            expect(rff.isInvalid(fs, 'a.b.c')).toBe(true);
            return 'a.b';
          }
        },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.getMessage(fs, '')).toBe('');
    expect(rff.getMessage(fs, 'a')).toBe('');
    expect(rff.getMessage(fs, 'a.b')).toBe('');
    expect(rff.getMessage(fs, 'a.b.c')).toBe('');
    fs = rff.synclyValidateForm(fs, {});
    expect(rff.getMessage(fs, '')).toBe('root');
    expect(rff.getMessage(fs, 'a')).toBe('a');
    expect(rff.getMessage(fs, 'a.b')).toBe('a.b');
    expect(rff.getMessage(fs, 'a.b.c')).toBe('a.b.c');
  });
  test('it can run from a nested scope', () => { // Though I'm not sure why it needs to.
    function f() {return 'msg';}
    const model = {
      a: {aa: null},
      b: {bb: null}
    };
    const schema = {
      fields: {
        'a.aa': { required: 'req' },
        'b.bb': { required: 'req' },
      },
      scopes: {
        '': { validate: f },
        'a': { validate: f },
        'b': { validate: f },
      }
    };
    let fs = rff.initializeFormstate(model, schema);
    expect(rff.isSynclyInvalid(fs, '')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(false);
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(false);
    fs.nestedScopeId = rff.getId(fs, 'b');
    fs = rff.synclyValidateForm(fs, {});
    expect(fs.nestedScopeId).not.toBe(null);
    fs.nestedScopeId = null;
    expect(rff.isSynclyInvalid(fs, '')).toBe(true);
    expect(rff.getMessage(fs, '')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'a.aa')).toBe(true);
    expect(rff.getMessage(fs, 'a.aa')).toBe('req');
    expect(rff.isSynclyInvalid(fs, 'b')).toBe(true);
    expect(rff.getMessage(fs, 'b')).toBe('msg');
    expect(rff.isSynclyInvalid(fs, 'b.bb')).toBe(true);
    expect(rff.getMessage(fs, 'b.bb')).toBe('req');
  });
});



describe('asynclyValidate', () => {
  test('it throws an error if the validation function returns an unknown value', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: () => {}}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it does not run validateAsync if syncly invalid', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: () => {}}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setSynclyInvalid(fs, '');
    expect(rff.asynclyValidate(fs, '', {})).toBe(fs);
  });
  test('it does not run validateAsync if waiting', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: () => {}}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setAsyncStarted(fs, '');
    expect(rff.asynclyValidate(fs, '', {})).toBe(fs);
  });
  test('it does not run validateAsync if asyncly validated', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: () => {}}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setAsyncStarted(fs, '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, ''), fs, '');
    expect(rff.asynclyValidate(fs, '', {})).toBe(fs);
  });
  test('it does run validateAsync if async error', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => rff.setMessage(fs, '', 'ran')}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setAsyncStarted(fs, '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, ''), fs, '', new Error('123'));
    fs = rff.asynclyValidate(fs, '', {});
    expect(rff.getMessage(fs, '')).toBe('ran');
  });
  test('it honors jsx configuration', () => {
    let fs = rff.initializeFormstate({});
    fs = rff.setFormSubmitting(fs);
    const form = {validationSchemas:{}};
    form.validationSchemas[rff.getId(fs, '')] = {validateAsync: [(m, fs) => rff.setMessage(fs, '', 'ran'), 'onSubmit']};
    fs = rff.asynclyValidate(fs, '', form);
    expect(rff.getMessage(fs, '')).toBe('ran');
  });
  test('it does nothing if no validateAsync function configured', () => {
    let fs = rff.initializeFormstate({});
    expect(rff.asynclyValidate(fs, '', {})).toBe(fs);
  });
  test('the validateAsync function can return formstate', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => rff.setMessage(fs, '', 'ran')}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.asynclyValidate(fs, '', {});
    expect(rff.getMessage(fs, '')).toBe('ran');
  });
  test('the validateAsync function gets passed certain parameters', () => {
    const form = {};
    let called = false;
    const schema = {
      scopes: {
        '': {
          validateAsync: (m, fs, fm, id) => {
            expect(m).toStrictEqual({a: 1});
            expect(fs.model).toBe(m);
            expect(fm).toBe(form);
            expect(id).toBe(rff.getId(fs, ''));
            called = true;
            return fs;
          }
        }
      }
    };
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setFormSubmitting(fs);
    fs = rff.asynclyValidate(fs, '', form)
    expect(fs.nestedScopeId).toBe(null);
    expect(called).toBe(true);
  });
  test('it throws an error if the validation function returns a non-object for waitingFormstate', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [3, '123', Promise.resolve()]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it throws an error if the validation function returns a non-string token', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, 3, Promise.resolve()]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it throws an error if the validation function returns an empty string token', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, '', Promise.resolve()]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it throws an error if the validation function returns a non-object promise', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, '123', 3]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it throws an error if the validation function returns a non-instance promise', () => {
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, '123', {}]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it throws an error if the validation function returns an instance of a class other than a promise', () => {
    class C {}
    const p = new C();
    const m = /An asynchronous validation function should return/;
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, '123', p]}}});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.asynclyValidate(fs, '', {})).toThrow(m);
  });
  test('it sets the promise if the return value is legit', () => {
    const p = Promise.resolve();
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => [fs, '123', p]}}});
    fs = rff.setFormSubmitting(fs);
    fs = rff.asynclyValidate(fs, '', {});
    expect(rff.getPromises(fs)).toStrictEqual([p]);
    expect(fs.formStatus.promises['123']).toBe(p);
  });
  test('it only runs scope-async if form is submitting', () => {
    let fs = rff.initializeFormstate({}, {scopes: {'': {validateAsync: (m, fs) => rff.setMessage(fs, '', 'ran')}}});
    expect(rff.asynclyValidate(fs, '', {})).toBe(fs);
    fs = rff.setFormSubmitting(fs);
    fs = rff.asynclyValidate(fs, '', {});
    expect(rff.getMessage(fs, '')).toBe('ran');
  });
  test('if configured to run onChange, it runs whenever asynclyValidate is called', () => {
    function f(m, fs) { return rff.setMessage(fs, 'a', 'ran'); }
    const schema = { fields: { 'a': { validateAsync: [f, 'onChange']}}};
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
  test('if configured to run onBlur, it runs if the field is blurred', () => {
    function f(m, fs) { return rff.setMessage(fs, 'a', 'ran'); }
    const schema = { fields: { 'a': { validateAsync: [f, 'onBlur']}}};
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setChanged(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setBlurred(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
  test('if configured to run onBlur, it runs if the field is submitting', () => {
    function f(m, fs) { return rff.setMessage(fs, 'a', 'ran'); }
    const schema = { fields: { 'a': { validateAsync: [f, 'onBlur']}}};
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setSubmitting(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
  test('if configured to run onSubmit, it runs if the field is submitting', () => {
    function f(m, fs) { return rff.setMessage(fs, 'a', 'ran'); }
    const schema = { fields: { 'a': { validateAsync: [f, 'onSubmit']}}};
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setChanged(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setBlurred(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setSubmitting(fs, 'a');
    fs = rff.asynclyValidate(fs, 'a', {});
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
  test('a nested validateAsync function is forced into a nested scope', () => {
    let fs;
    const form = {
      setFormstate: () => {},
      someOption: true
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(nestedForm.getFormstate).toBe(undefined);
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.b'));
      expect(id).toBe(rff.getId(nestedFs, 'b'));
      return rff.setInvalid(nestedFs, 'b', 'msg');
    }
    function g(v, nestedFs, nestedForm, id) {
      expect(v).toBe(2);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(nestedForm.getFormstate).toBe(undefined);
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.c'));
      expect(id).toBe(rff.getId(nestedFs, 'c'));
      nestedFs = rff.setAsyncStarted(nestedFs, 'c', '...');
      return [nestedFs, rff.getAsyncToken(nestedFs, 'c'), Promise.resolve()];
    }
    const nestedSchema = { fields: { 'b' : { validateAsync: [f, 'onChange'] }, 'c' : { validateAsync: [g, 'onChange'] } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({a: {b: 1, c: 2}}, schema);
    fs = rff.asynclyValidate(fs, 'a.b', form);
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isInvalid(fs, 'a.b')).toBe(true);
    expect(rff.getMessage(fs, 'a.b')).toBe('msg');
    fs = rff.asynclyValidate(fs, 'a.c', form);
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isWaiting(fs, 'a.c')).toBe(true);
    expect(rff.getMessage(fs, 'a.c')).toBe('...');
  });
  test('a nested validateAsync function normally runs in a nested scope', () => {
    let nestedScopeId;
    const form = {
      setFormstate: () => {},
      someOption: true
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(nestedScopeId);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(nestedFs, 'b'));
      return rff.setInvalid(nestedFs, 'b', 'msg');
    }
    function g(v, nestedFs, nestedForm, id) {
      expect(v).toBe(2);
      expect(nestedFs.nestedScopeId).toBe(nestedScopeId);
      expect(nestedForm).toBe(form);
      expect(id).toBe(rff.getId(nestedFs, 'c'));
      nestedFs = rff.setAsyncStarted(nestedFs, 'c', '...');
      return [nestedFs, rff.getAsyncToken(nestedFs, 'c'), Promise.resolve()];
    }
    const nestedSchema = { fields: { 'b' : { validateAsync: [f, 'onChange'] }, 'c' : { validateAsync: [g, 'onChange'] } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    let fs = rff.initializeFormstate({a: {b: 1, c: 2}}, schema);
    nestedScopeId = rff.getId(fs, 'a');
    fs.nestedScopeId = nestedScopeId;
    fs = rff.asynclyValidate(fs, 'b', form);
    expect(fs.nestedScopeId).toBe(nestedScopeId);
    expect(rff.isInvalid(fs, 'b')).toBe(true);
    expect(rff.getMessage(fs, 'b')).toBe('msg');
    fs = rff.asynclyValidate(fs, 'c', form);
    expect(fs.nestedScopeId).toBe(nestedScopeId);
    expect(rff.isWaiting(fs, 'c')).toBe(true);
    expect(rff.getMessage(fs, 'c')).toBe('...');
  });
  test('a nested validateAsync function is forced into a nested scope, getFormstate variant', () => {
    let fs;
    const form = {
      setFormstate: () => {},
      getFormstate: () => {},
      someOption: true
    };
    function f(v, nestedFs, nestedForm, id) {
      expect(v).toBe(1);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(typeof(nestedForm.getFormstate)).toBe('function');
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.b'));
      expect(id).toBe(rff.getId(nestedFs, 'b'));
      return rff.setInvalid(nestedFs, 'b', 'msg');
    }
    function g(v, nestedFs, nestedForm, id) {
      expect(v).toBe(2);
      expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(nestedForm).not.toBe(form);
      expect(typeof(nestedForm.setFormstate)).toBe('function');
      expect(typeof(nestedForm.getFormstate)).toBe('function');
      expect(nestedForm.someOption).toBe(true);
      expect(id).toBe(rff.getId(fs, 'a.c'));
      expect(id).toBe(rff.getId(nestedFs, 'c'));
      nestedFs = rff.setAsyncStarted(nestedFs, 'c', '...');
      return [nestedFs, rff.getAsyncToken(nestedFs, 'c'), Promise.resolve()];
    }
    const nestedSchema = { fields: { 'b' : { validateAsync: [f, 'onChange'] }, 'c' : { validateAsync: [g, 'onChange'] } } };
    const schema = { scopes: { 'a' : { schema: nestedSchema } } };
    fs = rff.initializeFormstate({a: {b: 1, c: 2}}, schema);
    fs = rff.asynclyValidate(fs, 'a.b', form);
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isInvalid(fs, 'a.b')).toBe(true);
    expect(rff.getMessage(fs, 'a.b')).toBe('msg');
    fs = rff.asynclyValidate(fs, 'a.c', form);
    expect(fs.nestedScopeId).toBe(null);
    expect(rff.isWaiting(fs, 'a.c')).toBe(true);
    expect(rff.getMessage(fs, 'a.c')).toBe('...');
  });
});


describe('asynclyValidateForm', () => {
  test('it calls asynclyValidate for all fields and scopes', () => {
    const form = {};
    const schema = {
      fields: {
        'a': { validateAsync: [(m, fs, fm) => { expect(fm).toBe(form); return rff.setMessage(fs, 'a', 'a ran'); }, 'onSubmit']}
      },
      scopes: {
        '': { validateAsync: (m, fs, fm) => { expect(fm).toBe(form); return rff.setMessage(fs, '', 'ran') } }
      }
    };
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setFormSubmitting(fs);
    fs = rff.asynclyValidateForm(fs, form);
    expect(rff.getMessage(fs, '')).toBe('ran');
    expect(rff.getMessage(fs, 'a')).toBe('a ran');
  });
  // test('it works in a nested scope', () => {
  //   const form = {};
  //   const schema = {
  //     fields: {
  //       'a.aa': { validateAsync: [(m, fs, fm) => { expect(fm).toBe(form); return rff.setMessage(fs, 'a.aa', 'aa ran'); }, 'onSubmit']}
  //     },
  //     scopes: {
  //       '': { validateAsync: (m, fs, fm) => { expect(fm).toBe(form); return rff.setMessage(fs, '', 'ran') } },
  //       '': { validateAsync: (m, fs, fm) => { expect(fm).toBe(form); return rff.setMessage(fs, '', 'a ran') } }
  //     }
  //   };
  //   let fs = rff.initializeFormstate({a: 1}, schema);
  //   fs = rff.setFormSubmitting(fs);
  //   fs = rff.asynclyValidateForm(fs, form);
  //   expect(rff.getMessage(fs, '')).toBe('ran');
  //   expect(rff.getMessage(fs, 'a')).toBe('a ran');
  // });
});


describe('getPromises', () => {
  test('it returns the outstanding promises', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.getPromises(fs)).toStrictEqual([]);
    fs = setPromise(fs, '123', 'rootScope');
    fs = setPromise(fs, '456', 'a');
    expect(rff.getPromises(fs)).toStrictEqual(['rootScope', 'a']);
    fs = clearPromise(fs, '123');
    fs = clearPromise(fs, '456');
    expect(rff.getPromises(fs)).toStrictEqual([]);
  });
});


describe('changeAndValidate', () => {
  test('it changes and validates a field', () => {
    let called = false;
    const schema = {
      fields: {
        'a': {
          validate: () => {called = true;},
          validateAsync: [(v, fs) => rff.setMessage(fs, 'a', 'ran'), 'onChange']
        }
      }
    };
    let fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setBlurred(fs, 'a');
    fs = rff.changeAndValidate(fs, 'a', 2, {});
    expect(rff.isBlurred(fs, 'a')).toBe(false);
    expect(rff.isChanged(fs, 'a')).toBe(true);
    expect(rff.getValue(fs, 'a')).toBe(2);
    expect(called).toBe(true);
    expect(rff.isValid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
});


describe('handleChange', () => {
  test('it changes and validates a field', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    let called = false;
    const schema = {
      fields: {
        'a': {
          validate: () => {called = true;},
          validateAsync: [(v, fs) => rff.setMessage(fs, 'a', 'ran'), 'onChange']
        }
      }
    };
    fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setBlurred(fs, 'a');
    rff.handleChange(form, 2, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(false);
    expect(rff.isChanged(fs, 'a')).toBe(true);
    expect(rff.getValue(fs, 'a')).toBe(2);
    expect(called).toBe(true);
    expect(rff.isValid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('ran');
  });
  test('it does nothing if inputs are disabled', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    fs = rff.initializeFormstate({a: 1});
    fs = rff.setBlurred(fs, 'a');
    fs = rff.setInputDisabled(fs);
    rff.handleChange(form, 2, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isChanged(fs, 'a')).toBe(false);
    expect(rff.getValue(fs, 'a')).toBe(1);
  });
});


describe('handleBlur', () => {
  test('it marks a field blurred', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    fs = rff.initializeFormstate({a: 1});
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
  });
  test('it does nothing if inputs are disabled', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    fs = rff.initializeFormstate({a: 1});
    fs = rff.setInputDisabled(fs);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(false);
  });
  test('it normally does not validate', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    fs = rff.initializeFormstate({a: 1});
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isValid(fs, 'a')).toBe(false);
  });
  test('you can set it to validate', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); },
      validateOnBlur: true
    };
    const schema = {
      fields: {
        'a': { validateAsync: [(m,fs) => rff.setMessage(fs, 'a', 'a ran'), 'onChange']},
        'b': { validateAsync: [(m,fs) => rff.setMessage(fs, 'b', 'b ran'), 'onBlur']}
      }
    };
    fs = rff.initializeFormstate({a: 1, b: 2}, schema);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isValid(fs, 'a')).toBe(true);
    expect(rff.getMessage(fs, 'a')).toBe('a ran');
    expect(rff.isBlurred(fs, 'b')).toBe(false);
    expect(rff.isValid(fs, 'b')).toBe(false);
    expect(rff.getMessage(fs, 'b')).toBe('');
    rff.handleBlur(form, rff.getId(fs, 'b'));
    expect(rff.isBlurred(fs, 'b')).toBe(true);
    expect(rff.isValid(fs, 'b')).toBe(true);
    expect(rff.getMessage(fs, 'b')).toBe('b ran');
  });
  test('it will not validate if form is submitting', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); },
      validateOnBlur: true
    };
    fs = rff.initializeFormstate({a: 1, b: 2});
    fs = rff.setFormSubmitting(fs);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isValidated(fs, 'a')).toBe(false);
    fs = rff.setFormSubmitted(fs);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isValidated(fs, 'a')).toBe(true);
  });
  test('it will async validate on blur only if field is changed', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    const schema = {
      fields: {
        'a': { validateAsync: [(m,fs) => rff.setMessage(fs, 'a', 'a ran'), 'onBlur']}
      }
    };
    fs = rff.initializeFormstate({a: 1}, schema);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setChanged(fs, 'a');
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, 'a')).toBe('a ran');
  });
  test('it will not async validate on blur if form is submitting', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    const schema = {
      fields: {
        'a': { validateAsync: [(m,fs) => rff.setMessage(fs, 'a', 'a ran'), 'onBlur']}
      }
    };
    fs = rff.initializeFormstate({a: 1}, schema);
    fs = rff.setChanged(fs, 'a');
    fs = rff.setFormSubmitting(fs);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, 'a')).toBe('');
    fs = rff.setFormSubmitted(fs);
    rff.handleBlur(form, rff.getId(fs, 'a'));
    expect(rff.isBlurred(fs, 'a')).toBe(true);
    expect(rff.isSynclyValidated(fs, 'a')).toBe(false);
    expect(rff.getMessage(fs, 'a')).toBe('a ran');
  });
});


describe('startFormSubmission', () => {
  test('it throws an error if formstate is nested', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs.nestedScopeId = 3;
    expect(() => rff.startFormSubmission(fs)).toThrow(/Nested form components should not submit the form./);
  });
  test('it throws an error if formstate is already submitting', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    expect(() => rff.startFormSubmission(fs)).toThrow(/The formstate provided to startFormSubmission is already submitting!/);
  });
  test('it disables input and sets the form to submitting', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.startFormSubmission(fs);
    expect(rff.isInputDisabled(fs)).toBe(true);
    expect(rff.isFormSubmitting(fs)).toBe(true);
  });
});


describe('cancelFormSubmission', () => {
  test('it enables input and sets the form to submitted', () => {
    const before = Date.now();
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.startFormSubmission(fs);
    fs = rff.cancelFormSubmission(fs);
    expect(rff.isInputDisabled(fs)).toBe(false);
    expect(rff.isFormSubmitting(fs)).toBe(false);
    expect(rff.isSubmitted(fs, 'a')).toBe(true);
    expect(rff.getFormSubmissionEndTime(fs)).toBeGreaterThanOrEqual(before);
  });
});


describe('driveFormSubmission', () => {
  test('it does nothing if form is already submitting.', () => {
    let fs;
    const form = {
      setFormstate: (f) => { expect(f(fs)).toBe(fs); }
    };
    fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    rff.driveFormSubmission(form);
  });
  test('it calls submitValidModel if model is valid.', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    let called = false;
    function submitValidModel(model, fm) {
      called = true;
      expect(fm).toBe(form);
      expect(model).toBe(fs.model);
      expect(rff.isInputDisabled(fs)).toBe(true);
      expect(rff.isFormSubmitting(fs)).toBe(true);
      expect(rff.isModelValid(fs)).toBe(true);
      expect(rff.getMessage(fs, 'a')).toBe('a ran');
    }
    const schema = {
      fields: {
        'a': { validateAsync: [(m,fs) => rff.setMessage(fs, 'a', 'a ran'), 'onBlur']}
      }
    };
    fs = rff.initializeFormstate({a: 1}, schema);
    rff.driveFormSubmission(form, submitValidModel);
    setTimeout(() => {
      expect(called).toBe(true);
    }, 10);
  });
  test('it does not call submitValidModel if model is invalid.', () => {
    let fs;
    const form = {
      setFormstate: (f) => { fs = f(fs); }
    };
    let called = false;
    function submitValidModel(model, fm) {
      called = true;
    }
    const schema = {
      fields: {
        'a': { validate: () => 'msg' }
      }
    };
    fs = rff.initializeFormstate({a: 1}, schema);
    rff.driveFormSubmission(form, submitValidModel);
    setTimeout(() => {
      expect(rff.isInvalid(fs, 'a')).toBe(true);
      expect(rff.getMessage(fs, 'a')).toBe('msg');
      expect(rff.isInputDisabled(fs)).toBe(false);
      expect(rff.isSubmitted(fs, 'a')).toBe(true);
      expect(called).toBe(false);
    }, 10);
  });
});


describe('cancelFormSubmissionKeepInputDisabled', () => {
  test('it is an alias for setFormSubmitted', () => {
    expect(rff.cancelFormSubmissionKeepInputDisabled).toBe(rff.setFormSubmitted);
  });
});
