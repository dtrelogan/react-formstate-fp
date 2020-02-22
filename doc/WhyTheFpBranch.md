# Why the branch from react-formstate?

react-formstate-fp is a rewrite of [react-formstate](https://www.npmjs.com/package/react-formstate) that works cleanly with React Hooks.

The rewrite also provides much better support for asynchronous validation, and makes a significant change to the approach:

## react-formstate is "form first"

```jsx
import React, { Component } from 'react';
import { FormState, Form } from 'react-formstate';
import InputAndFeedback from './InputAndFeedback.jsx';

export default class ExampleForm extends Component {

  constructor(props) {
    super(props);
    this.formState = FormState.create(this);
    this.state = {};
    this.submit = this.submit.bind(this);
  }

  render() {
    return (
      <Form formState={this.formState} onSubmit={this.submit}>
        <InputAndFeedback type='text' formField='username' label='Username'/>
        <InputAndFeedback type='password' formField='password' label='Password'/>
        <input type='submit' value='Submit'/>
      </Form>
    );
  }

  // *****************************************************************************
  // *** This generates a model based on the form schema specified in the JSX. ***
  // *****************************************************************************
  submit(e) {
    e.preventDefault();
    const model = this.formState.createUnitOfWork().createModel();
    alert(JSON.stringify(model));
  }
}
```

## react-formstate-fp is "model first"

```jsx
import React, { useState } from 'react';
import { rff, FormScope, FormField } from 'react-formstate-fp';
import InputAndFeedback from './InputAndFeedback.jsx';

const initialModel = {
  username: '',
  password: ''
};

export default function ExampleForm({model}) {

  const [formstate, setFormstate] = useState(() => rff.initializeFormstate(model || initialModel));

  const form = {
    setFormstate,
    adaptors: [InputAndFeedback]
  };

  // ************************************************************************
  // *** Nothing to generate, the model already exists and is up to date. ***
  // ************************************************************************
  function submit(e) {
    e.preventDefault();
    alert(JSON.stringify(formstate.model));
  };

  return (
    <form onSubmit={submit}>
      <FormScope formstate={formstate} form={form}>
        <FormField name='username'>
          <InputAndFeedback type='text' label='Username'/>
        </FormField>
        <FormField name='password'>
          <InputAndFeedback type='password' label='Password'/>
        </FormField>
        <input type='submit' value='Submit'/>
      </FormScope>
    </form>
  );
}
```

## Why the change?

I used to feel strongly that laying out an initial model for every form

```es6
const initialModel = {
  username: '',
  password: ''
};
```

was busy work best avoided. The way I saw it, you just had to repeat yourself in the JSX. (Much of react-formstate was built around that idea.)

It turns out, however, that this particular piece of "busy work" *adds value*. It makes several aspects of the API easier to understand and easier to approach.

## Moving forward

I still believe the "formstate" approach is the right one in React, so the learning that came out of react-formstate has paid dividends in the form of react-formstate-fp. react-formstate was a good library, but this one is **much**, *much* better. If you find that you agree, you can thank React hooks for the motivation.
