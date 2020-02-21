# Explanation through example

```es6
import React, { useState } from 'react';
import { rff, FormScope, FormField } from 'react-formstate-fp';
import { InputAndFeedback } from '../components/rffBootstrap.jsx';
import Spinner from '../components/Spinner.jsx';
```

For code for the "InputAndFeedback" component, see the [demo](#todo). For the thinking behind it, see the [binding strategies](/doc/Binding.md) doc.

```jsx
const initialModel = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: ''
};

// You can specify validation here or you can specify it in the JSX below. Your choice...
//
// Validation configuration is intentionally nothing fancy,
// it is simplest to express validation, especially client-side, through code.
//
// const validationSchema = {
//   fields: {
//     'oldPassword': { required: true },
//     'newPassword': { required: true, validate: validatePassword },
//     'confirmNewPassword': { required: true }
//   },
//   scopes: {
//     '': { validate: validatePasswordConfirmation }
//   }
// };
//
// const initialFormstate = rff.initializeFormstate(initialModel, validationSchema);


export default function ExampleForm()
{
  const [formstate, setFormstate] = useState(() => rff.initializeFormstate(initialModel));

  const form = {
    setFormstate, // Tell react-formstate-fp how to update your formstate.
    adaptors: [InputAndFeedback], // Tell RFF to pass formstate, form, and modelKey props to this component.
    calculatePrimed: rff.primeOnChange // Tell the InputAndFeedback component when to show messages.
  };

  const submitting = rff.isFormSubmitting(formstate);
  const disabled = submitting || rff.isPrimedModelInvalid(formstate, form.calculatePrimed);

  return (
    <form onSubmit={(e) => submit(e, form)}>
      <Spinner visible={submitting}/>
      <FormScope formstate={formstate} form={form} validate={validatePasswordConfirmation}>
        <FormField name='oldPassword' required>
          <InputAndFeedback type='password' label='Old Password'/>
        </FormField>
        <FormField name='newPassword' required validate={validatePassword}>
          <InputAndFeedback type='password' label='New Password'/>
        </FormField>
        <FormField name='confirmNewPassword' required>
          <InputAndFeedback type='password' label='Confirm New Password'/>
        </FormField>
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
    // Simply return a string and RFF takes care of the rest.
    return 'Password must be at least 8 characters.';
  }
  // Returning nothing sets the field to valid.
}

// The submit process is fully customizable.
// Or you can use a convenience function, like this example:

function submit(e, form) {
  e.preventDefault();
  rff.driveFormSubmission(form, submitValidModel);
}


function submitValidModel(model, form) {

  // Simulate sending the valid model to your server.

  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (model.oldPassword === 'TestThrowingAnError') {
        reject(new Error('A timeout occurred while trying to communicate with the server.'));
      }
      else {
        resolve(model.oldPassword === 'TheRightPassword');
      }
    }, 2000);
  }).then(isPasswordCorrect => {
    form.setFormstate(fs => {
      if (isPasswordCorrect) {
        // Normally you'd route somewhere else if the password was updated...
        fs = rff.setValid(fs, 'oldPassword', 'Your password was changed successfully.');
        // Alternatively you could set this in root scope and add a feedback widget
        // for that scope. This is a valuable concept.
        // fs = rff.setValid(fs, '', 'Your password was changed successfully.');
      }
      else {
        fs = rff.setInvalid(fs, 'oldPassword', 'Incorrect password!');
      }
      return rff.cancelFormSubmission(fs); // Doing this in both cases because it's a demo.
    });
  }).catch(err => {
    form.setFormstate(fs => {
      fs = rff.setFormSubmissionError(fs, err);
      // You could add feedback functionality to your form around the presence of a submission error.
      // But for this simple demo just raise an alert...
      alert(err.message);
      return rff.cancelFormSubmission(fs);
    });
  });
}
```
