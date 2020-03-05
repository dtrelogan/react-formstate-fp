import { convertToRootModelKey, createNestedScope } from '../lib/schemaAndLookup.js';
import { rff } from '../lib/index.js';

const m1 = {
  name: '',
  contacts: [
    {
      name: '',
      address: {
        line1: '',
        line2: ''
      }
    },
    {
      name: '',
      address: {
        line1: '',
        line2: ''
      }
    }
  ]
};

const vs1 = {
  fields: {
    'name': { required: true }
  }
};

describe('convertToRootModelKey', () => {
  test('it returns root model key if not nested', () => {
    let fs = rff.initializeFormstate(m1);
    expect(convertToRootModelKey(fs, 'name')).toBe('name');
    expect(convertToRootModelKey(fs, 'contacts.0.address.line1')).toBe('contacts.0.address.line1');
  });
  test('it returns root model key if nested', () => {
    let fs = rff.initializeFormstate(m1);
    fs.nestedScopeId = rff.getId(fs, 'contacts.0.address');
    expect(convertToRootModelKey(fs, 'line1')).toBe('contacts.0.address.line1');
  });
  test('it normalizes the model key parameter', () => {
    let fs = rff.initializeFormstate(m1);
    expect(convertToRootModelKey(fs, 'contacts[0].address.line1')).toBe('contacts.0.address.line1');
  });
});

describe('getRootModelKey', () => {
  test('it returns the root model key if not nested', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.getRootModelKey(fs, rff.getId(fs, 'contacts.0.address.line1'))).toBe('contacts.0.address.line1');
  });
  test('it returns the root model key if nested', () => {
    let fs = rff.initializeFormstate(m1);
    fs.nestedScopeId = rff.getId(fs, 'contacts.0.address');
    expect(rff.getRootModelKey(fs, rff.getId(fs, 'line1'))).toBe('contacts.0.address.line1');
  });
  test('it throws an exception if the id is not found', () => {
    let fs = rff.initializeFormstate(m1);
    expect(() => rff.getRootModelKey(fs, -1)).toThrow(/Could not find rootModelKey for id/);
  });
});

describe('getModelKey', () => {
  test('it returns the model key if not nested', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.getModelKey(fs, rff.getId(fs, 'contacts.0.address.line1'))).toBe('contacts.0.address.line1');
  });
  test('it returns the model key if nested', () => {
    let fs = rff.initializeFormstate(m1);
    fs.nestedScopeId = rff.getId(fs, 'contacts.0.address');
    expect(rff.getModelKey(fs, rff.getId(fs, 'line1'))).toBe('line1');
  });
  test('it throws an exception if the id is not found', () => {
    let fs = rff.initializeFormstate(m1);
    expect(() => rff.getModelKey(fs, -1)).toThrow(/Could not find rootModelKey for id/);
  });
});

describe('getId', () => {
  test('it returns the id if not nested', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.getId(fs, 'contacts.0.address.line1')).toBe(fs.lookup.idsByRootModelKey['contacts.0.address.line1']);
  });
  test('it returns the id if nested', () => {
    let fs = rff.initializeFormstate(m1);
    fs.nestedScopeId = rff.getId(fs, 'contacts.0.address');
    expect(rff.getId(fs, 'line1')).toBe(fs.lookup.idsByRootModelKey['contacts.0.address.line1']);
  });
  test('it normalizes the model key', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.getId(fs, 'contacts[0].address.line1')).toBe(fs.lookup.idsByRootModelKey['contacts.0.address.line1']);
  });
  test('it throws an exception if the root model key is not found', () => {
    let fs = rff.initializeFormstate(m1);
    expect(() => rff.getId(fs, 'badKey')).toThrow(/Could not find id for rootModelKey/);
  });
});

describe('isScope', () => {
  test('it returns true if the id represents a scope', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isScope(fs, rff.getId(fs, ''))).toBe(true);
  });
  test('it returns false if the id does not represent a scope', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isScope(fs, rff.getId(fs, 'name'))).toBe(false);
  });
  test('it returns false if id is unknown', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isScope(fs, -1)).toBe(false);
  });
});

describe('isRequired', () => {
  test('it returns false if no validation schema', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address.line2'), {})).toBe(false);
  });
  test('it does not crash if no form provided as a parameter', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address.line2'))).toBe(false);
  });
  test('it returns true if a validation schema says it is required', () => {
    let fs = rff.initializeFormstate(m1, vs1);
    expect(rff.isRequired(fs, rff.getId(fs, 'name'), {})).toBe(true);
  });
  test('it returns false if a validation schema says it is not required', () => {
    let fs = rff.initializeFormstate(m1, vs1);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address.line2'), {})).toBe(false);
  });
  test('it returns true if a jsx validation schema says it is required', () => {
    let fs = rff.initializeFormstate(m1);
    const id = rff.getId(fs, 'name');
    const form = { validationSchemas: {} };
    form.validationSchemas[id] = { required: true };
    expect(rff.isRequired(fs, id, form)).toBe(true);
  });
  test('it returns false if a jsx validation schema says it is not required', () => {
    let fs = rff.initializeFormstate(m1);
    const id = rff.getId(fs, 'contacts.0.address.line2');
    const form = { validationSchemas: {} };
    expect(rff.isRequired(fs, id, form)).toBe(false);
  });
});


describe('initializeFormstate', () => {
  test('it accepts an object model', () => {
    let fs = rff.initializeFormstate({});

    const id = rff.getId(fs, '');
    const rootModelKeysById = {}; rootModelKeysById[id] = '';
    const scopes = {}; scopes[id] = true;

    expect(fs.lookup.rootModelKeysById).toStrictEqual(rootModelKeysById);
    expect(fs.lookup.idsByRootModelKey).toStrictEqual({'': id});
    expect(fs.lookup.scopes).toStrictEqual(scopes);
    expect(fs.statuses).toStrictEqual({});
    expect(fs.validationSchemas).toStrictEqual({});
    expect(fs.formStatus.submit).toStrictEqual({});
    expect(fs.formStatus.submitHistory).toStrictEqual([]);
    expect(fs.formStatus.custom).toStrictEqual({});
    expect(fs.formStatus.promises).toStrictEqual({});
    expect(fs.formStatus.inputDisabled).toBe(false);
    expect(fs.model).toStrictEqual({});
    expect(fs.nestedScopeId).toBe(null);
  });
  test('it accepts an array model', () => {
    let fs = rff.initializeFormstate([]);

    const id = rff.getId(fs, '');
    const rootModelKeysById = {}; rootModelKeysById[id] = '';
    const scopes = {}; scopes[id] = true;

    expect(fs.lookup.rootModelKeysById).toStrictEqual(rootModelKeysById);
    expect(fs.lookup.idsByRootModelKey).toStrictEqual({'': id});
    expect(fs.lookup.scopes).toStrictEqual(scopes);
    expect(fs.model).toStrictEqual([]);
  });
  test('it accepts a model that is a function', () => {
    function f() {}
    let fs = rff.initializeFormstate(f);

    const id = rff.getId(fs, '');
    const rootModelKeysById = {}; rootModelKeysById[id] = '';
    const scopes = {}; scopes[id] = true;

    expect(fs.lookup.rootModelKeysById).toStrictEqual(rootModelKeysById);
    expect(fs.lookup.idsByRootModelKey).toStrictEqual({'': id});
    expect(fs.lookup.scopes).toStrictEqual(scopes);
    expect(fs.model).toBe(f);
  });
  test('it accepts a model that is a class', () => {
    class c {}
    let fs = rff.initializeFormstate(c);

    const id = rff.getId(fs, '');
    const rootModelKeysById = {}; rootModelKeysById[id] = '';
    const scopes = {}; scopes[id] = true;

    expect(fs.lookup.rootModelKeysById).toStrictEqual(rootModelKeysById);
    expect(fs.lookup.idsByRootModelKey).toStrictEqual({'': id});
    expect(fs.lookup.scopes).toStrictEqual(scopes);
    expect(fs.model).toBe(c);
  });
  test('it does not accept a model that is not a "container"', () => {
    const m = /The initialModel passed to initializeFormstate must be an object or an array./;
    expect(() => rff.initializeFormstate(null)).toThrow(m);
    expect(() => rff.initializeFormstate(undefined)).toThrow(m);
    expect(() => rff.initializeFormstate('')).toThrow(m);
    expect(() => rff.initializeFormstate(0)).toThrow(m);
    expect(() => rff.initializeFormstate(true)).toThrow(m);
  });
  test('it drills into objects', () => {
    let fs = rff.initializeFormstate({a: {b: 1}});
    expect(rff.getModelKey(fs, rff.getId(fs, 'a'))).toBe('a');
    expect(rff.getModelKey(fs, rff.getId(fs, 'a.b'))).toBe('a.b');
    expect(rff.isScope(fs, rff.getId(fs, ''))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'a'))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'a.b'))).toBe(false);
  });
  test('it drills into arrays', () => {
    let fs = rff.initializeFormstate([[0]]);
    expect(rff.getModelKey(fs, rff.getId(fs, '0'))).toBe('0');
    expect(rff.getModelKey(fs, rff.getId(fs, '0.0'))).toBe('0.0');
    expect(rff.isScope(fs, rff.getId(fs, ''))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, '0'))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, '0.0'))).toBe(false);
  });
  test('no form validation schema required', () => {
    let fs = rff.initializeFormstate({});
    expect(fs.validationSchemas).toStrictEqual({});
  });
  test('an empty form validation schema is fine', () => {
    let fs = rff.initializeFormstate({}, {});
    expect(fs.validationSchemas).toStrictEqual({});
  });
  test('the form validation schema must be an object', () => {
    const m = /The form validation schema passed to initializeFormstate is not in the right format./;
    expect(() => rff.initializeFormstate({}, null)).toThrow(m);
    // expect(() => rff.initializeFormstate({}, undefined)).toThrow(m);
    expect(() => rff.initializeFormstate({}, '')).toThrow(m);
    expect(() => rff.initializeFormstate({}, 0)).toThrow(m);
    expect(() => rff.initializeFormstate({}, true)).toThrow(m);
    expect(() => rff.initializeFormstate({}, () => {})).toThrow(m);
    expect(() => rff.initializeFormstate({}, class c {})).toThrow(m);
  });
  test('it normalizes schema keys', () => {
    const normalizationTest = {
      fields: {
        'contacts[0].name': { required: true }
      },
      scopes: {
        'contacts[0].address': { required: true }
      }
    };
    let fs = rff.initializeFormstate(m1, normalizationTest);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.name'), {})).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address'), {})).toBe(true);
  });
  test('schema fields and scopes must be objects', () => {
    const m = /The form validation schema passed to initializeFormstate is not in the right format./;
    expect(() => rff.initializeFormstate({}, {fields: null})).toThrow(m);
    expect(() => rff.initializeFormstate({}, {scopes: null})).toThrow(m);
  });
  test('a validation schema must be an object', () => {
    const schema = {
      scopes: {
        'contacts.0.address': null
      }
    };
    const m = /The form validation schema passed to initializeFormstate is not in the right format. See model key contacts.0.address./;
    expect(() => rff.initializeFormstate(m1, schema)).toThrow(m);
  });
  test('a nested validation schema must be an object', () => {
    const schema = {
      scopes: {
        'contacts.0.address': { schema: null }
      }
    };
    const m = /The form validation schema passed to initializeFormstate is not in the right format. See model key contacts.0.address./;
    expect(() => rff.initializeFormstate(m1, schema)).toThrow(m);
  });
  test('it normalizes keys in nested schemas', () => {
    const nestedSchema = {
      fields: {
        '[0].name': { required: true }
      },
      scopes: {
        '[0].address': { required: true }
      }
    };
    const normalizationTest = {
      scopes: {
        'contacts': { schema: nestedSchema }
      }
    };
    let fs = rff.initializeFormstate(m1, normalizationTest);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.name'), {})).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address'), {})).toBe(true);
  });
  test('it normalizes keys in nested schemas #2', () => {
    const nestedSchema = {
      fields: {
        '[0][name]': { required: true }
      },
      scopes: {
        '[0][address]': { required: true }
      }
    };
    const normalizationTest = {
      scopes: {
        '[contacts]': { schema: nestedSchema }
      }
    };
    let fs = rff.initializeFormstate(m1, normalizationTest);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.name'), {})).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address'), {})).toBe(true);
  });
  test('it catalogues scopes', () => {
    let fs = rff.initializeFormstate(m1);
    expect(rff.isScope(fs, rff.getId(fs, ''))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'name'))).toBe(false);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts'))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0'))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0.name'))).toBe(false);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0.address'))).toBe(true);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0.address.line1'))).toBe(false);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0.address.line2'))).toBe(false);
  });
  test('it honors field overrides', () => {
    const schema = {
      fields: {
        'contacts.0.address': {}
      }
    };
    let fs = rff.initializeFormstate(m1, schema);
    expect(rff.isScope(fs, rff.getId(fs, 'contacts.0.address'))).toBe(false);
    expect(rff.getValue(fs, 'contacts.0.address')).toStrictEqual({line1: '', line2: ''});
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.0.address')]).toBe(undefined);
  });
  test('you cannot override the root scope as a field', () => {
    const schema = {
      fields: {
        '': {}
      }
    };
    expect(() => rff.initializeFormstate(m1, schema)).toThrow(/The root scope cannot be overridden as a field./);
  });
  test('a schemaForEach schema must be an object', () => {
    const schema = {
      scopes: {
        'contacts': { schemaForEach: null }
      }
    };
    const m = /The form validation schema passed to initializeFormstate is not in the right format. See model key contacts./;
    expect(() => rff.initializeFormstate(m1, schema)).toThrow(m);
  });
  test('it normalizes a schemaForEach schema', () => {
    const nestedSchema = {
      fields: {
        '[address][line1]': { required: true }
      }
    };
    const schema = {
      scopes: {
        '[contacts]': { schemaForEach: nestedSchema }
      }
    };
    let fs = rff.initializeFormstate(m1, schema);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.0.address.line1'), {})).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'contacts.1.address.line1'), {})).toBe(true);
  });
  test('validation schema keys must correspond to model keys', () => {
    const m = /The model key "a" specified under "fields" in the form validation schema passed to initializeFormstate does not correspond to a model key for the initial model./;
    expect(() => rff.initializeFormstate({}, {fields: {'a': {}}})).toThrow(m);
  });
  test('duplicate validation schema keys might not cause an error', () => {
    // This is javascript behavior and I'm not sure what I can do to help the developer here.
    const schema = {
      fields: {
        'a': { required: true },
        'a': { required: false }
      }
    };
    let fs = rff.initializeFormstate({a: 1}, schema);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), {})).toBe(false);
  });
  test('duplicate normalized validation schema keys cause an error', () => {
    const schema = {
      fields: {
        'a': { required: true },
        '[a]': { required: true }
      }
    };
    const m = /The model key "a" may only have one validation schema defined./;
    expect(() => rff.initializeFormstate({a: 1}, schema)).toThrow(m);
  });
  test('duplicate normalized validation schema keys cause an error except in this case', () => {
    function f() {}
    function g() {}
    const contactSchema = {
      scopes: {
        '': { validate: f }
      }
    };
    const schema = {
      scopes: {
        'contact': { schema: contactSchema, validate: g, validateAsync: g, required: true }
      }
    };
    const initialModel = {
      contact: {
        address: {
          line1: ''
        }
      }
    };
    let fs = rff.initializeFormstate(initialModel, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'contact')].validate).toBe(f);
    expect(fs.validationSchemas[rff.getId(fs, 'contact')].validateAsync).toBe(undefined);
    expect(fs.validationSchemas[rff.getId(fs, 'contact')].required).toBe(undefined);
  });
  test('duplicate normalized validation schema keys cause an error, this case does not apply', () => {
    function f() {}
    const contactSchema = {
      scopes: {
        '': { validate: f }
      }
    };
    const schema = {
      scopes: {
        'contacts': { schemaForEach: contactSchema }
      }
    };
    const initialModel = {
      contacts: [{
        address: {
          line1: ''
        }
      }]
    };
    let fs = rff.initializeFormstate(initialModel, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.0')].validate).toBe(f);
  });
  test('duplicate validation schema keys across scopes/fields cause an error', () => {
    const schema = {
      fields: {
        'a': { required: true }
      },
      scopes: {
        'a': { required: true }
      }
    };
    const m = /The model key "a" can only have one validation schema defined./;
    expect(() => rff.initializeFormstate({a: []}, schema)).toThrow(m);
  });
  test('fields cannot be defined as scopes', () => {
    const schema = {
      scopes: {
        'a': { required: true }
      }
    };
    expect(() => rff.initializeFormstate({a: 1}, schema)).toThrow(/Root model key "a" cannot be defined as a scope./);
  });
  test('validation schemas with no understood props are ignored', () => {
    const schema = {
      fields: {
        'a': { bubkus: true }
      }
    };
    let fs = rff.initializeFormstate({a:1}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'a')]).toBe(undefined);
  });
  test('a default required message is created.', () => {
    const schema = {
      fields: {
        name: { required: true },
        camelCaseName: { required: true }
      }
    };
    let fs = rff.initializeFormstate({name: '', camelCaseName: ''}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'name')].requiredMessage).toBe('Name is required.');
    expect(fs.validationSchemas[rff.getId(fs, 'camelCaseName')].requiredMessage).toBe('Camel case name is required.');
  });
  test('you can configure the required message.', () => {
    const schema = {
      fields: {
        email: { required: 'E-mail is required.' }
      }
    };
    let fs = rff.initializeFormstate({email: ''}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'email')].requiredMessage).toBe('E-mail is required.');
  });
  test('validate must be a function.', () => {
    const schema = {
      fields: {
        name: { validate: 3 }
      }
    };
    const m = /The "validate" prop for model key "name" must be a function./;
    expect(() => rff.initializeFormstate({name: ''}, schema)).toThrow(m);
  });
  test('it can configure a validate function.', () => {
    function f() {}
    function s() {}
    const schema = {
      fields: {
        name: { validate: f }
      },
      scopes: {
        '': { validate: s }
      }
    };
    let fs = rff.initializeFormstate({name: ''}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'name')].validate).toBe(f);
    expect(fs.validationSchemas[rff.getId(fs, '')].validate).toBe(s);
  });
  test('scope validateAsync must be a function', () => {
    const schema = {
      scopes: {
        '': { validateAsync: 3 }
      }
    };
    const m = /The validateAsync property for scope/;
    expect(() => rff.initializeFormstate({name: ''}, schema)).toThrow(m);
  });
  test('it can configure a scope-level validateAsync function', () => {
    function f() {}
    const schema = {
      scopes: {
        '': { validateAsync: f }
      }
    };
    const fs = rff.initializeFormstate({name: ''}, schema);
    expect(fs.validationSchemas[rff.getId(fs, '')].validateAsync).toStrictEqual([f, 'onSubmit']);
  });
  test('field validateAsync must be an array', () => {
    const schema = {
      fields: {
        'a': { validateAsync: 3 }
      }
    };
    const m = /The validateAsync property for model key/;
    expect(() => rff.initializeFormstate({a: 1}, schema)).toThrow(m);
  });
  test('field validateAsync must be an array of a function', () => {
    const schema = {
      fields: {
        'a': { validateAsync: [3, 'onChange'] }
      }
    };
    const m = /The validateAsync property for model key/;
    expect(() => rff.initializeFormstate({a: 1}, schema)).toThrow(m);
  });
  test('field validateAsync must be an array of a function and whenToRun', () => {
    function f() {}
    const schema = {
      fields: {
        'a': { validateAsync: [f, 'bubkus'] }
      }
    };
    const m = /The validateAsync property for model key/;
    expect(() => rff.initializeFormstate({a: 1}, schema)).toThrow(m);
  });
  test('it can configure field-level validateAsync', () => {
    function f() {}
    function g() {}
    function h() {}
    const schema = {
      fields: {
        'a': { validateAsync: [f, 'onChange'] },
        'b': { validateAsync: [g, 'onBlur'] },
        'c': { validateAsync: [h, 'onSubmit'] },
      }
    };
    let fs = rff.initializeFormstate({a: 1, b: 2, c: 3}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'a')].validateAsync).toStrictEqual([f, 'onChange']);
    expect(fs.validationSchemas[rff.getId(fs, 'b')].validateAsync).toStrictEqual([g, 'onBlur']);
    expect(fs.validationSchemas[rff.getId(fs, 'c')].validateAsync).toStrictEqual([h, 'onSubmit']);
  });
  test('you can override a scope as a field and run async on change', () => {
    function f() {}
    const schema = {
      fields: {
        'mv': { validateAsync: [f, 'onChange'] }
      }
    };
    const fs = rff.initializeFormstate({mv: [0,1,2]}, schema);
    expect(fs.validationSchemas[rff.getId(fs, 'mv')].validateAsync).toStrictEqual([f, 'onChange']);
  });
  test('it stores nestedScopeId for validation schemas', () => {
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
    fs = rff.addModelKey(fs, 'contacts.0', { name: '', address: { line1: '' }}, contactSchema);
    expect(fs.validationSchemas[rff.getId(fs, 'a')].nestedScopeId).toBe(null);
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.0.name')].nestedScopeId).toBe(rff.getId(fs, 'contacts.0'));
    expect(fs.validationSchemas[rff.getId(fs, 'contacts.0.address.line1')].nestedScopeId).toBe(rff.getId(fs, 'contacts.0.address'));
  });
  test('a nested schema must be associated with an object in the model', () => {
    const addressSchema = {
      scopes: {
        '': { required: true }
      },
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
    const initialModel1 = {
      a: 1,
      contacts: []
    };
    const initialModel2 = {
      a: 1,
      contacts: [{
        name: '',
        address: null
      }]
    };
    const initialModel3 = {
      a: 1,
      contacts: [{
        name: ''
      }]
    };
    let fs = rff.initializeFormstate(initialModel1, schema);
    expect(() => rff.initializeFormstate(initialModel2, schema)).toThrow(/Root model key "contacts.0.address" cannot be defined as a scope./);
    expect(() => fs = rff.initializeFormstate(initialModel3, schema)).toThrow(/does not correspond to a model key for the initial model/);
  });
  test('a nested schema must be associated with an object in the model, variant', () => {
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
    const initialModel1 = {
      a: 1,
      contacts: []
    };
    const initialModel2 = {
      a: 1,
      contacts: [{
        name: '',
        address: null
      }]
    };
    const initialModel3 = {
      a: 1,
      contacts: [{
        name: ''
      }]
    };
    let fs = rff.initializeFormstate(initialModel1, schema);
    expect(() => rff.initializeFormstate(initialModel2, schema)).toThrow(/does not correspond to a model key for the initial model/);
    expect(() => fs = rff.initializeFormstate(initialModel3, schema)).toThrow(/does not correspond to a model key for the initial model/);
  });
});


describe('createNestedScope', () => {
  test('it returns a formstate with an updated nestedScopeId', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    const [nestedFs] = createNestedScope(rff.getId(fs, 'a'), fs, {});
    expect(fs).not.toBe(nestedFs);
    expect(fs.nestedScopeId).toBe(null);
    expect(nestedFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
  });
  test('it returns a form that links to the parent form', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    const form = {};
    const [nestedFs, nestedForm] = createNestedScope(rff.getId(fs, 'a'), fs, form);
    expect(nestedForm.parentForm).toBe(form);
  });
  test('it returns a form with an updated setFormstate function', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    let rootCalled = false;
    const form = {
      setFormstate: (f) => {
        rootCalled = true;
        let testFs = f(fs);
        expect(testFs.nestedScopeId).toBe(null);
        expect(rff.isValid(testFs, 'a.aa')).toBe(true);
        expect(rff.getMessage(testFs, 'a.aa')).toBe('msg');
      }
    };
    const [nestedFs, nestedForm] = createNestedScope(rff.getId(fs, 'a'), fs, form);
    let called = false;
    nestedForm.setFormstate((testFs) => {
      called = true;
      expect(testFs).not.toBe(fs);
      expect(testFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      return rff.setValid(testFs, 'aa', 'msg');
    });
    expect(called).toBe(true);
    expect(rootCalled).toBe(true);
  });
  test('it can return a nested form with a getFormstate function', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    let storedFs = fs;
    let rootGetCalled = false;
    let rootSetCalled = false;
    const form = {
      getFormstate: () => {
        rootGetCalled = true;
        return storedFs;
      },
      setFormstate: (fs) => {
        rootSetCalled = true;
        storedFs = fs;
      }
    };
    const [nestedFs, nestedForm] = createNestedScope(rff.getId(fs, 'a'), fs, form);
    let testFs = nestedForm.getFormstate();
    expect(rootGetCalled).toBe(true);
    expect(testFs).not.toBe(storedFs);
    expect(testFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
    rootGetCalled = false;
    nestedForm.setFormstate(rff.setValid(testFs, 'aa', 'msg'));
    expect(rootGetCalled).toBe(false);
    expect(rootSetCalled).toBe(true);
    expect(rff.isValid(testFs, 'aa')).toBe(false);
    expect(storedFs.nestedScopeId).toBe(null);
    expect(rff.isValid(storedFs, 'a.aa')).toBe(true);
  });
  test('it returns a form with an updated setFormstate function, getFormstate variant', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    fs = rff.setFormCustomProperty(fs, 'test', 'ing');
    let storedFs = fs;
    let rootGetCalled = false;
    let rootSetCalled = false;
    const form = {
      getFormstate: () => {
        rootGetCalled = true;
        return storedFs;
      },
      setFormstate: (fs) => {
        rootSetCalled = true;
        expect(typeof(fs)).toBe('object');
        expect(fs.nestedScopeId).toBe(null);
        storedFs = fs;
      }
    };
    const [nestedFs, nestedForm] = createNestedScope(rff.getId(fs, 'a'), fs, form);
    let called = false;
    nestedForm.setFormstate((testFs) => {
      called = true;
      expect(rff.getFormCustomProperty(testFs, 'test')).toBe('ing');
      expect(testFs).not.toBe(fs);
      expect(testFs.nestedScopeId).toBe(rff.getId(fs, 'a'));
      return rff.setValid(testFs, 'aa', 'msg');
    });
    expect(called).toBe(true);
    expect(rootGetCalled).toBe(true);
    expect(rootSetCalled).toBe(true);
    expect(rff.isValid(storedFs, 'a.aa')).toBe(true);
    expect(rff.getMessage(storedFs, 'a.aa')).toBe('msg');
  });
  test('setFormstate throws an error if not passed a function', () => {
    let fs = rff.initializeFormstate({a: {aa: 1}});
    const [nestedFs, form] = createNestedScope(rff.getId(fs, 'a'), fs, {});
    expect(() => form.setFormstate(3)).toThrow(/Please pass a function to setFormstate/);
  });
});
