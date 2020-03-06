# Quirks and edge cases

## You cannot update scopes directly

```es6
const initialModel = {
  multiselectValues: ['1','5','8']
};
```

```es6
function customChangeHandler(form, value) {
  form.setFormstate((formstate) => {
    if (rff.isInputDisabled(formstate)) {return formstate;}

    // This will throw an exception:
    return rff.changeAndValidate(formstate, 'multiselectValues', value, form);
  });
}
```

To remedy this, tell RFF to treat this model key as a field rather than a scope:

```es6
const schema = {
  fields: {
    'multiselectValues': {} // Tell RFF to treat this model key as a field.
  }
};
```

If it's an actual scope though, do not use this feature:

```es6
const addressInitialModel = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: ''
};

const initialModel = {
  addresses: []
};

const schema = {
  fields: {
    'addresses': {} // Don't do this because this should be a scope!
  }
};
```

```es6
function addAddress(form) {
  form.setFormstate(formstate => {
    // This will throw an error that model key 'addresses.0' does not exist in your model.
    return rff.setValueAndClearStatus(formstate, 'addresses.0', addressInitialModel);
    // You wouldn't want to do something like this either:
    // rff.setValueAndClearStatus(formstate, 'addresses', [addressInitialModel]);
  });
}
```

Instead, use [addModelKey and deleteModelKey](/doc/Arrays.md) if you want to change a scope:

```es6
function addAddress(form) {
  form.setFormstate(formstate => {
    return rff.addModelKey(formstate, 'addresses.0', addressInitialModel);
  });
}
```

## Validation scopes

Validation functions need to honor nested scope.

```jsx
<FormScope formstate={formstate} form={form}>
  <FormScope name='homeAddress'>
    <Address nestedForm/>
  </FormScope>
</FormScope>
```

```es6
// In the Address component...

function validateAddress(model, formstate) {

  // Scope validation...
  // Use 'line1' here NOT 'homeAddress.line1'

  if (model.line1.trim() === '') {
    return rff.setInvalid(formstate, 'line1', 'Street address line 1 is required');
  }
}
```

This means that when validating the entire form during a submit, each validation function has to tell RFF which nested scope to put the formstate into before calling each validation function.

When using a validation schema,

```es6
const addressSchema = {
  scopes: {
    '': { validate: validateAddress }
  }
};

const schema = {
  scopes: {
    homeAddress: { schema: addressSchema }
  }
};

// ...
```

the nested scope for a validation function must be determined without visibility into the JSX. So, rather than relying on the "nestedForm" prop to determine scope, initializeFormstate uses the "schema" and "schemaForEach" props to introduce a nested scope for a validation function.

Normally this works exactly as you'd expect. However, when using "schema" or "schemaForEach" in the *SAME* component, be mindful of that behavior:

```es6
const addressInitialModel = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: ''
};

const initialModel = {
  homeAddress: addressInitialModel
};

// Assume the validation schema above (not repeated here).

function validateAddress(model, formstate) {
  // Use 'line1' here NOT 'homeAddress.line1' -- even though this is in the same component!
  if (model.line1.trim() === '') {
    return rff.setInvalid(formstate, 'line1', 'Street address line 1 is required');
  }
}
```

## Validation scope is determined differently when configuring validation in the JSX

In the case of JSX configuration, validation scope *IS* determined by the "nestedForm" prop.

```es6
const initialModel = {
  addresses: []
};
```

```jsx
let addressesSection = null;

// Not using "nestedForm" here

if (model.addresses.length > 0) {
  addressesSection = model.addresses.map((v, i) => {
    return (
      <FormScope key={i} name={i} validate={validateAddress}>
        <InputAndFeedback modelKey='line1' label='Line 1'/>
      </FormScope>
    );
  });
}

return (
  <FormScope formstate={formstate} form={form}>
    <FormScope name='addresses'>
      {addressesSection}
    </FormScope>
  </FormScope>
);
```

```es6
function validateAddress(address, formstate, form, id) {

  // RFF provides the address parameter by doing something like this:
  // address = rff.getValue(formstate, rff.getModelKey(formstate, id));
  // so it is the address object, not the root model.

  if (address.line1.trim() === '') {

    // But, since we're using JSX configuration and not 'schemaForEach', this
    // function is NOT dropped into a nested scope when it's in the same
    // component, so formstate.nestedScopeId will be set to null here.

    // To figure out which item in the array we are validating,
    // get the model key from the id parameter.

    const modelKey = rff.getModelKey(formstate, id);

    // Appending 'line1' to the model key is a little tedious in this example,
    // so it might be better to move this into a nested scope. See below.
    // (Or use field validation to validate line1 directly.)

    return rff.setInvalid(formstate, `${modelKey}.line1`, 'Street address line 1 is required');
  }
}
```

The code for validateAddress is cleaner if it is moved into a nested form:

```jsx
let addressesSection = null;

if (model.addresses.length > 0) {
  addressesSection = model.addresses.map((v, i) => {
    return (
      <FormScope key={i} name={i}>
        <Address nestedForm/>
      </FormScope>
    );
  });
}
```

In the Address component:

```jsx
<FormScope formstate={formstate} form={form} validate={validateAddress}>
  <InputAndFeedback modelKey='line1' label='Line 1'/>
</FormScope>
```

the validateAddress function is now more sensibly scoped:

```es6
function validateAddress(address, formstate) {
  if (address.line1.trim() === '') {
    return rff.setInvalid(formstate, 'line1', 'Street address line 1 is required');
  }
}
```

Both approaches -- validation schemas and JSX configuration -- work sensibly, they just work a little **differently** when it comes to validation scope.

## schemaForEach has no effect on addModelKey

```es6
const initialModel = {
  addresses: []
};

const schema = {
  scopes: {
    'addresses': { schemaForEach: addressSchema }
  }
};
```

With this configuration, you still need to provide a schema to addModelKey:

```es6
function addAddress(form) {
  form.setFormstate(formstate => {
    const i = rff.getValue(formstate, 'addresses').length;

    // The { schemaForEach: addressSchema } configuration does not apply here,
    // make sure to pass addressSchema when calling addModelKey.

    return rff.addModelKey(formstate, `addresses.${i}`, addressInitialModel, addressSchema);
  });
}
```

So when does schemaForEach apply?

```es6
const schema = {
  scopes: {
    'addresses': { schemaForEach: addressSchema }
  }
};

// 1. An initial model could populate the array:

const initialModel = {
  addresses = [
    addressInitialModel
  ]
};

function ExampleForm({model}) {

  // 2. When editing an existing model, it could have several addresses populated:

  const initialFormstate = rff.initializeFormstate(model || initialModel, schema);

  // ...
}
```

## Prefer validation schemas when using addModelKey and deleteModelKey

If you change your model dynamically and use JSX validation configuration there is an edge case to be aware of.

After calling addModelKey, in the unlikely case you end up in the submit handler before a subsequent render completes (as in, within milliseconds), the validation schema that is computed from your JSX might not be computed yet, such that it could "lag behind" the model and an invalid model could theoretically be submitted.

The chances of this happening are very, very small, and if you have server-side validation this is largely a non-issue. But, to eliminate the possibility altogether, it might be wiser to provide a validation schema when using addModelKey.
