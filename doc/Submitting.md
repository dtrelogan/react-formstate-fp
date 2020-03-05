# Submitting

```jsx
<form onSubmit={(e) => submit(e, form)}
 {restOfForm}
</form>
```

```es6
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
      // This is just a demo, normally both cases wouldn't do this...
      return rff.cancelFormSubmission(fs);
    });
  }).catch(err => {
    form.setFormstate(fs => {
      fs = rff.setFormSubmissionError(fs, err); // You can add feedback around this to your form.
      alert(err.message); // or just raise an alert.
      return rff.cancelFormSubmission(fs);
    });
  });
}
```

## driveFormSubmission

Below is the code for driveFormSubmission.

All of the functions used below are exposed in the API, so it is easy to write your own handler if you want to tweak its behavior.

If you want to use await when doing so, see [useFormstate](/doc/useFormstate.md).

```es6
function driveFormSubmission(form, submitValidModel)
{
  form.setFormstate((formstate) =>
  {
    if (rff.isFormSubmitting(formstate)) {return formstate;}

    // Put the form into submitting status and disable the inputs.

    formstate = rff.startFormSubmission(formstate);

    // Perform synchronous validation.

    // synclyValidateForm and validateForm are aliases for the same function.
    formstate = rff.synclyValidateForm(formstate, form);

    // Fire off asynchronous validation that still needs to run.

    formstate = rff.asynclyValidateForm(formstate, form);

    // Wait for asynchronous validation.

    Promise.all(rff.getPromises(formstate)).then(() =>
    {
      form.setFormstate((validatedFs) => {

        // Submit the model if valid.

        if (!rff.isModelValid(validatedFs)) {
          return rff.cancelFormSubmission(validatedFs);
        }

        Promise.resolve().then(() => {
          submitValidModel(validatedFs.model, form);
        });

        return validatedFs; // Inputs remain disabled while submitting the model to your server.
      });
    });

    return formstate; // Form will be in submitting/waiting state with inputs disabled.
  });
}
```
