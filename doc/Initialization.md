# Initialization cheat sheet

initializeFormstate is the only initialization function.

## Basic example

```es6
const initialModel = {
  username: '',
  email: ''
};

const initialFormstate = rff.initializeFormstate(initialModel);

const theFormstateLooksLikeThis = {
  lookup: {
    rootModelKeysById: { 1: '', 2: 'username', 3: 'email' },
    idsByRootModelKey: { '': 1, 'username': 2, 'email': 3 },
    scopes: { 1: true }
  },
  statuses: {},
  validationSchemas: {},
  formStatus: {
    submit: {},
    submitHistory: [],
    custom: {},
    promises: {},
    inputDisabled: false
  },
  model: { username: '', email: '' },
  nestedScopeId: null
}
```

## Providing a validation schema

```es6
const initialModel = {
  username: '',
  email: ''
};

const validationSchema = {
  fields: {
    'username': {
      required: true,
      validate: validateUsername,
      validateAsync: [verifyUniqueUsername, 'onBlur']  // onChange, onBlur, or onSubmit
    },
    'email': {
      required: 'E-mail is required',  // You can tailor the message if you want.
      validate: validateEmail
    }
  }
}

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```

## Treating an object or an array in your model as a field rather than as a scope

```es6
const initialModel = {
  multiselectValues: ['1','5','8']
};

const schema = {
  fields: {
    'multiselectValues': {} // Because this is specified as a field, initializeFormstate won't drill into the array.
  }
};

const initialFormstate = rff.initializeFormstate(initialModel, schema);

const theFormstateLookupLooksLikeThis = {
  rootModelKeysById: {
    1: '',
    2: 'multiselectValues'
  },
  idsByRootModelKey: {
    '': 1,
    'multiselectValues': 2
  },
  scopes: { 1: true }
};

const insteadOfLikeThis = {
  rootModelKeysById: {
    1: '',
    2: 'multiselectValues',
    3: 'multiselectValues.0',
    4: 'multiselectValues.1',
    5: 'multiselectValues.2'
  },
  idsByRootModelKey: {
    '': 1,
    'multiselectValues': 2,
    'multiselectValues.0': 3,
    'multiselectValues.1': 4,
    'multiselectValues.2': 5
  },
  scopes: { 1: true, 2: true }
};
```

This is especially useful for suppressing the internals of something like a "moment" in your initial formstate.

```es6
const initialModel = {
  startDate: moment() // A moment object contains like a hundred properties that are all irrelevant to your formstate.
};

const schema = {
  fields: {
    'startDate': {} // Don't drill into the moment object. When looking at formstate in the debugger you'll be glad you did this.
  }
};

const initialFormstate = rff.initializeFormstate(initialModel, schema);
```

## Scope validation

```es6
const addressInitialModel = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: ''
};

const addressValidationSchema = {
  fields: {
    'line1': { required: true },
    'city': { required: true },
    'state': { required: true },
    'zip': { required: true }
  },
  scopes: {
    '': { validateAsync: verifyAddress }  // Scope-level validateAsync is always run onSubmit.
  }
};

const initialModel = {
  addresses: [
    addressInitialModel
  ];
};

const validationSchema = {
  scopes: {
    'addresses': {
      required: true,
      schemaForEach: addressValidationSchema  // 'schemaForEach' is an important tool for schema composition.
    }
  }
};

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```

## Initialization for nested forms

```es6
import Address, { initialModel as addressInitialModel, validationSchema as addressValidationSchema } from './Address.jsx';

const initialModel = {
  homeContactInfo: {
    email: '',
    address: addressInitialModel
  }
};

const validationSchema = {
  fields: {
    'homeContactInfo.email': { required: true, validate: validateEmail }
  },
  scopes: {
    'homeContactInfo.address': { schema: addressValidationSchema }  // 'schema' is an important tool for schema composition.
  }
}

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```
