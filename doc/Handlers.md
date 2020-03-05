# Change and blur handlers

## The standard change handler

```es6
function handleChange(form, value, id) {
  form.setFormstate((formstate) => {
    if (rff.isInputDisabled(formstate)) {return formstate;}
    return rff.changeAndValidate(formstate, rff.getModelKey(formstate, id), value, form);
  });
}
```

## Overriding the change handler

```jsx
<FormField name='password'>
  <FormGroup>
    <Form.Label>Password</Form.Label>
    <Input type='password' handleChange={handlePasswordChange}/>
    <InputFeedback/>
  </FormGroup>
</FormField>
```

```es6
// Custom handler that clears confirm password anytime the password is changed.

function handlePasswordChange(form, value) {
  form.setFormstate((currentFormstate) => {
    if (rff.isInputDisabled(currentFormstate)) {return currentFormstate;}
    currentFormstate = rff.setValueAndClearStatus(currentFormstate, 'confirmNewPassword', '');
    return rff.changeAndValidate(currentFormstate, 'newPassword', value, form);
  });
}
```

It's really simple to override behavior, so you can do practically anything you want with react-formstate-fp.

```jsx
function Input({type, formstate, modelKey, form, handleChange, handleBlur, ...other}) {
  // ...
  return (
    <Form.Control
      type={type}
      {...}
      onChange={e => (handleChange || rff.handleChange)(form, e.target.value, id)}
      onBlur={e => (handleBlur || rff.handleBlur)(form, id)}
      {...other}
    />
  );
}
```

## The standard blur handler

Overriding the blur handler would be advanced usage, but all of the functions used in handleBlur are exposed in the API so you can if you need to.

```es6
function handleBlur(form, id) {
  form.setFormstate((formstate) => {
    if (rff.isInputDisabled(formstate)) {return formstate;}

    const modelKey = rff.getModelKey(formstate, id);

    formstate = rff.setBlurred(formstate, modelKey);

    if (!rff.isFormSubmitting(formstate)) {
      // If the user just tabs right through a field without changing anything do you want the form to do anything?
      if (form.validateOnBlur) {
        formstate = rff.synclyValidate(formstate, modelKey, form, id);
        formstate = rff.asynclyValidate(formstate, modelKey, form, id);
      }
      else if (rff.isChanged(formstate, modelKey)) {
        // Asynchronous validation might be configured to run onBlur, but if validateOnBlur is turned off, only
        // try to run it if the user actually changed the field.
        formstate = rff.asynclyValidate(formstate, modelKey, form, id);
      }
    }

    return formstate;
  });
}
```

## validateOnBlur

If you want validation to run onBlur -- that is, when you tab through a field without changing it -- then configure your form to do so:

```es6
const form = {
  setFormstate,
  validateOnBlur: true
}
```
