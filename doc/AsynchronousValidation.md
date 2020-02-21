# Asynchronous validation

react-formstate-fp's predecessor, [react-formstate](https://www.npmjs.com/package/react-formstate), did not incorporate promises into the API. Nor did it include a separate status for async validity. The thinking was that it would be simpler if it didn't. Turns out [that wasn't the case](https://github.com/dtrelogan/react-formstate/blob/HEAD/docs/asyncAlternatives.md). react-formstate-fp provides much more complete support for asynchronous validation.

## Field-level asynchronous validation

### Configuration

```es6
// You can configure it to run 'onChange', 'onBlur', or 'onSubmit'

const validationSchema = {
  fields: {
    'username': {
      required: true,
      validate: validateUsername,
      validateAsync: [validateUniqueUsername, 'onBlur']
    }
  }
};
```

or

```jsx
<FormScope formstate={formstate} form={form}>
  <FormField name='username' required validate={validateUsername} validateAsync={[validateUniqueUsername, 'onBlur']}>
    <InputAndFeedback type='text' label='Username'/>
  </FormField>
</FormScope>
```

### An asynchronous validation function

Make sure to use setAsynclyValid, setAsynclyInvalid, or setAsyncError in the handler.

(If you want to use await in the code below, see [useFormstate](/doc/useFormstate.md).)

```es6
function validateUniqueUsername(value, formstate, form, id)
{
  if (value === rff.getInitialValue(formstate, 'username')) {
    // Don't bother calling the server.
    return rff.setSynclyValid(formstate, 'username');
  }

  formstate = rff.setAsyncStarted(formstate, 'username', 'Verifying unique username...');

  // You only want to honor a response if the field hasn't changed since the promise was created.
  const asyncToken = rff.getAsyncToken(formstate, 'username');

  // Simulate calling your server.

  const promise = new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (value && value.toLowerCase() === 'validationfailure') {
        reject(new Error('Timeout while trying to communicate with the server.'));
      }
      resolve(value !== 'taken' && value !== 'buster');
    }, 2000);
  }).then((isUnique) => {
    form.setFormstate((fs) => {

      // In this case we know the modelKey is 'username'. But if we didn't know that for sure we could use this:
      // const modelKey = fs.getModelKey(fs, id);

      if (isUnique) {
        // This only updates formstate if the asyncToken matches.
        return rff.setAsynclyValid(asyncToken, fs, 'username', 'Verified unique.');
      }
      else {
        // This only updates formstate if the asyncToken matches.
        return rff.setAsynclyInvalid(asyncToken, fs, 'username', 'That username is taken. Please choose another.');
      }
    });
  }).catch((err) => {
    form.setFormstate((fs) => {
      // This only updates formstate if the asyncToken matches.
      return rff.setAsyncError(asyncToken, fs, 'username', err, 'An error occurred while verifying unique username.');
    });
  });

  return [formstate, asyncToken, promise];
}
```

## Incorporating asynchronous validity

Here's what the source code does:

```es6
export function isValid(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  if (s.synclyValid === false || s.async.asynclyValid === false || Boolean(s.async.error)) {return false;}
  if (s.async.asynclyValid === true) {return true;}
  if (s.synclyValid === true) {return Boolean(!s.async.started || s.async.finished);}
  return false;
}

export function isInvalid(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  return s.synclyValid === false || s.async.asynclyValid === false;
}

export function isValidated(formstate, modelKey) {
  return isValid(formstate, modelKey) || isInvalid(formstate, modelKey);
}
```

You can examine each status individually if you need to:

- Synchronous validity
 - function isSynclyValid(formstate, modelKey)
 - function isSynclyInvalid(formstate, modelKey)
 - function isSynclyValidated(formstate, modelKey)
- Asynchronous validity
 - function isWaiting(formstate, modelKey)
 - function isAsynclyValid(formstate, modelKey)
 - function isAsynclyInvalid(formstate, modelKey)
 - function isAsynclyValidated(formstate, modelKey)
 - function getAsyncError(formstate, modelKey)
 - function getAsyncToken(formstate, modelKey)
 - function getAsyncStartTime(formstate, modelKey)
 - function getAsyncEndTime(formstate, modelKey)


## Form Submission

See the [form submission](/doc/Submitting.md) documentation for how to negotiate asynchronous validation during a submit.

(It's basically this:)

```es6
Promise.all(rff.getPromises(formstate)).then(() => {
  // ...
});
```


## Scope-level asynchronous validation

Scope-level async always runs onSubmit.

```es6
const validationSchema = {
  fields: {
    'line1': { required: 'Street Address Line 1 is required.' },
    'city': { required: true },
    'state': { required: true },
    'zip': { required: 'Zipcode is required.' }
  },
  scopes: {
    '': { validateAsync: verifyAddress }
  }
};
```

or

```jsx
<FormScope formstate={formstate} form={form} validateAsync={verifyAddress}>
  {restOfForm}
</FormScope>
```

```es6
function verifyAddress(model, formstate, form)
{
  if (rff.isModelInvalid(formstate)) {return formstate;} // In this case, don't bother...

  // Notice that the message is being set at root scope level.
  // You'd have to add a feedback widget for that scope in your form.

  formstate = rff.setAsyncStarted(formstate, '', 'Verifying address...');

  const asyncToken = rff.getAsyncToken(formstate, '');

  const promise = new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const {line1, line2} = model;
      if (line2 && line2.toLowerCase() === 'validationfailure') {
        reject(new Error('Timeout while trying to communicate with the server.'));
      }
      // This is a contrived example for demonstration...
      if (line1.toLowerCase().indexOf('city') !== -1 && line2.trim() === '') {
        resolve({line2: 'Apartment number is required.'});
      }
      resolve(null);
    }, 2000);
  }).then((validationErrors) => {
    form.setFormstate((fs) => {
      if (!validationErrors) {
        return rff.setAsynclyValid(asyncToken, fs, '', 'The address was verified successfully.');
      }

      fs = rff.setAsynclyInvalid(asyncToken, fs, '', 'The address failed verification.');

      Object.keys(validationErrors).forEach(modelKey => {
        fs = rff.setInvalid(fs, modelKey, validationErrors[modelKey]);
      });

      return fs;
    });
  }).catch((err) => {
    form.setFormstate((fs) => {
      return rff.setAsyncError(asyncToken, fs, '', err, 'An error occurred while verifying the address.');
    });
  });

  return [formstate, asyncToken, promise];
}
```
