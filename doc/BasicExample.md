# Explanation through example

For code for the "InputAndFeedback" component, see the [demo](https://dtrelogan.github.io/react-formstate-fp-demo/). For the thinking behind it, see the [binding strategies](/doc/Binding.md) doc.

```jsx
import React, { useState } from 'react';
import { rff, FormScope } from 'react-formstate-fp';
import { InputAndFeedback } from '../components/rffBootstrap.jsx';
import Spinner from '../components/Spinner.jsx';

const initialModel = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: ''
};

// This example configures validation using a "schema". You can alternatively
// configure validation directly in the JSX. The documentation shows how.
// Validation configuration is intentionally nothing fancy.
// It is simplest to express validation, especially client-side, through code.

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


export default function ExampleForm()
{
  const [formstate, setFormstate] = useState(() => rff.initializeFormstate(initialModel, validationSchema));

  const form = {
    setFormstate, // Tell react-formstate-fp how to update your formstate.
    adaptors: [InputAndFeedback], // Pass formstate, form (and modelKey) props to this component.
    calculatePrimed: rff.primeOnChange // Tell the InputAndFeedback component when to show messages.
  };

  // alternatively:

  // const [formstate, form] = useFormstate(
  //   () => rff.initializeFormstate(initialModel, validationSchema),
  //   {
  //     adaptors: [InputAndFeedback],
  //     calculatePrimed: rff.primeOnChange
  //   }
  // );

  const submitting = rff.isFormSubmitting(formstate);
  const disabled = submitting || rff.isPrimedModelInvalid(formstate, form.calculatePrimed);

  return (
    <form onSubmit={(e) => submit(e, form)}>
      <Spinner visible={submitting}/>
      <FormScope formstate={formstate} form={form}>
        <InputAndFeedback name='oldPassword' type='password' label='Old Password'/>
        <InputAndFeedback name='newPassword' type='password' label='New Password'/>
        <InputAndFeedback name='confirmNewPassword' type='password' label='Confirm New Password'/>
      </FormScope>
      <input type='submit' value='Submit' disabled={disabled}/>
    </form>
  );
}

// validatePasswordConfirmation is specified at root scope so it will be called when any of the
// fields change. Scope-level validation functions typically return an updated formstate object.

function validatePasswordConfirmation(model, formstate) {
  if (model.confirmNewPassword) {
    if (model.confirmNewPassword !== model.newPassword) {
      return rff.setInvalid(formstate, 'confirmNewPassword', 'Password confirmation does not match.');
    }
    else {
      return rff.setValid(formstate, 'confirmNewPassword', '');
    }
  }
  else {
    // The "required" validation handles this case.
  }
}

// Field-specific validation methods run when the specific field is changed.
// They are easier to work with than scope validation methods.

function validatePassword(value) {
  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }
}

// The submit process is fully customizable.
// Or you can use a convenience function, like this example:

function submit(e, form) {
  e.preventDefault();
  rff.driveFormSubmission(form, submitValidModel);
}

function submitValidModel(model, form) {
  // Keep this example short...
  alert(JSON.stringify(model));
}
```

For the code for the submit handler, see [submitting](/doc/Submitting.md).
