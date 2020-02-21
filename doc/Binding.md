# Strategies for binding inputs to formstate

react-formstate-fp can bind to plain old HTML inputs or to any form component library.

These examples use input components from [react-bootstrap](https://react-bootstrap.github.io).

## The standard calculatePrimed functions

"Primed" is different than touched. A field might be touched as in 'changed', but you might want to "prime" (i.e., provide feedback) on blur or on submit.

Use these if you like, but feel free to create your own logic!

```es6

// (This is library source code so it doesn't prepend 'rff.' to these function calls, but if you write your own, you will need to.)

export function primeOnSubmit(formstate, modelKey) {
  if (isSubmitted(formstate, modelKey)) {return true;}

  // Provide feedback about asynchronous status as soon as you have it.
  if (isWaiting(formstate, modelKey) || isAsynclyValidated(formstate, modelKey) || getAsyncError(formstate, modelKey)) {return true;}

  // Wait until async finishes to show all new synchronous validation results at same time.
  // If you're waiting for async, this helps to reinforce the impression that the form is waiting.
  // (Or provide your own code to do what you want.)
  return isSubmitting(formstate, modelKey) && !isFormWaiting(formstate);
}

export function primeOnChange(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || isChanged(formstate, modelKey);
}

export function primeOnBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || isBlurred(formstate, modelKey);
}

export function primeOnChangeThenBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || (isChanged(formstate, modelKey) && isBlurred(formstate, modelKey));
}

```

# Strategies for binding include:

## Inline

The brute force approach... This is what most people think they want but I don't recommend it.

```jsx
<Form>
  <Form.Group controlId='username'>
    <Form.Label>Username</Form.Label>
    <Form.Control
      type='text'
      name='username'
      value={rff.getValue(formstate, 'username')}
      isValid={rff.primeOnChange(formstate, 'username') && rff.isValid(formstate, 'username')}
      isInvalid={rff.primeOnChange(formstate, 'username') && rff.isInvalid(formstate, 'username')}
      onChange={e => rff.handleChange(form, e.target.value, rff.getId(formstate, 'username'))}
      onBlur={e => rff.handleBlur(form, rff.getId(formstate, 'username'))}
    />
    <Form.Control.Feedback type={rff.primeOnChange(formstate, 'username') && rff.isValid(formstate, 'username') ? 'valid' : (rff.primeOnChange(formstate, 'username') && rff.isInvalid(formstate, 'username') ? 'invalid' : '')}>
      {rff.getMessage(formstate, 'username')}
    </Form.Control.Feedback>
  </Form.Group>
</Form>
```

## Bind function(s)

Better, but still not the best choice imo.

```jsx
<Form>
  <Form.Group controlId='username'>
    <Form.Label>Username</Form.Label>
    <Form.Control {...generateInputProps('text', formstate, 'username', form)}/>
    <Form.Control.Feedback {...generateFeedbackProps(formstate, 'username')}>
      {rff.getMessage(formstate, 'username')}
    </Form.Control.Feedback>
  </Form.Group>
</Form>
```

```es6
function generateInputProps(type, formstate, modelKey, form) {
  const id = rff.getId(formstate, modelKey);
  const primed = rff.primeOnChange(formstate, modelKey);

  if (type === 'text' || type === 'password') {
    return {
      type,
      name: rff.getRootModelKey(formstate, id),
      value: rff.getValue(formstate, modelKey),
      isValid: primed && rff.isValid(formstate, modelKey),
      isInvalid: primed && rff.isInvalid(formstate, modelKey),
      onChange: e => rff.handleChange(form, e.target.value, id),
      onBlur: e => rff.handleBlur(form, id)
    };
  }
  // else ...
}
```

```es6
function generateFeedbackProps(formstate, modelKey) {
  const primed = rff.primeOnChange(formstate, modelKey);

  let type = '';
  if (primed && rff.isValid(formstate, modelKey)) {type = 'valid';}
  if (primed && rff.isInvalid(formstate, modelKey)) {type = 'invalid';}

  return {type};
}
```

## Adaptors

(You can enhance this approach to use memoization.)

```jsx
const [formstate, setFormstate] = useState(() => rff.initializeFormstate(initialModel));
const form = {setFormstate};

// This closure provides a quick way to produce the essential RFF props.
function modelKey(modelKey) {
  return {formstate, modelKey, form};
}

return (
  <Form>
    <FormGroup {...modelKey('address.line1')}>
      <Form.Label>Street Address Line 1</Form.Label>
      <Input type='text' {...modelKey('address.line1')}/>
      <Feedback {...modelKey('address.line1')}/>
    </FormGroup>
  </Form>
);
```

```jsx
function FormGroup({formstate, modelKey, form, children, ...other}) {
  return (
    <Form.Group controlId={rff.getId(formstate, modelKey)} {...other}>
      {children}
    </Form.Group>
  );
}
```

```jsx
function Input({type, formstate, modelKey, form, handleChange, handleBlur, ...other}) {
  const id = rff.getId(formstate, modelKey);
  const primed = rff.primeOnChange(formstate, modelKey);

  if (type === 'text' || type === 'password') {
    return (
      <Form.Control
        type={type}
        name={rff.getRootModelKey(formstate, id)}
        value={rff.getValue(formstate, modelKey)}
        isValid={primed && rff.isValid(formstate, modelKey)}
        isInvalid={primed && rff.isInvalid(formstate, modelKey)}
        onChange={e => (handleChange || rff.handleChange)(form, e.target.value, id)}
        onBlur={e => (handleBlur || rff.handleBlur)(form, id)}
        {...other}
      />
    );
  }
  // else ...
}
```

```jsx
function Feedback({formstate, modelKey, form, ...other}) {
  const primed = rff.primeOnChange(formstate, modelKey);

  let type = '';
  if (primed && rff.isValid(formstate, modelKey)) {type = 'valid';}
  if (primed && rff.isInvalid(formstate, modelKey)) {type = 'invalid';}

  return (
    <Form.Control.Feedback type={type}>
      {rff.getMessage(formstate, modelKey)}
    </Form.Control.Feedback>
  );
}
```

## Adaptors with RFF Property Generation

```es6
import { rff, FormScope, FormField } from 'react-formstate-fp';
```

```jsx
const form = {
  setFormstate,
  adaptors: [FormGroup, Input, Feedback]
};

return (
  <Form>
    <FormScope name='address'>
      <FormField name='line1'>
        <FormGroup>
          <Form.Label>Street Address Line 1</Form.Label>
          <Input type='text'/>
          <Feedback/>
        </FormGroup>
      </FormField>
    </FormScope>
  </Form>
);
```
