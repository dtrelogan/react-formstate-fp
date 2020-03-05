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
  initialModel: { username: '', email: '' },
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

react-formstate-fp assumes an object or array in your initial model is a scope.

Importantly, RFF will not let you update the value for a scope directly.

For something like a multi-select, then, in order to update the value directly, you have to tell RFF that the array value should be treated as a field, not a scope. You do this by providing a schema to initializeFormstate:

```es6
const initialModel = {
  multiselectValues: ['1','5','8']
};

const schema = {
  fields: {
    'multiselectValues': {} // Tell RFF to treat this model key as a field.
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

This is also relevant for something like a "moment" in a date-picker input:

```es6

const initialModel = {
  startDate: moment()
};

const schema = {
  fields: {
    'startDate': {} // Don't drill into the moment object.
  }
};

const initialFormstate = rff.initializeFormstate(initialModel, schema);
```

If you *do* want to modify the value of an actual scope -- for instance to add or remove items from an array -- use [addModelKey and deleteModelKey](/doc/Arrays.md) instead. This important distinction is covered further in the [quirks and edge cases](/doc/Quirks.md) document.

## Scope validation

Synchronous example:

```es6
const initialModel = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: ''
};

const validationSchema = {
  fields: {
    'oldPassword': { required: true },
    'newPassword': { required: true, validate: validatePassword },
    'confirmNewPassword': { required: true }
  },
  scopes: {
    '': { validate: validatePasswordConfirmation }
  }
};

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```

Asynchronous example:

```es6
const initialModel = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: ''
};

const schema = {
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

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```

## Initialization for nested forms: "schema" and "schemaForEach"

Use the "schema" prop to incorporate a nested schema:

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

Use the "schemaForEach" prop for arrays:

```es6
import Address, { initialModel as addressInitialModel, validationSchema as addressValidationSchema } from './Address.jsx';

const initialModel = {
  name: '',
  addresses: []
};

const validationSchema = {
  fields: {
    'name': { required: true }
  },
  scopes: {
    'addresses': { schemaForEach: addressValidationSchema }  // 'schemaForEach' is an important tool for schema composition.
  }
}

const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);
```
