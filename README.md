# react-formstate-fp

An API to build, query, update, and bind formstate in React.

### It's glue for your forms

With react-formstate-fp, and your choice of input components, you can assemble forms DRYly in React.

### It solves the right problem to solve for React forms

By focusing on your form's data, and keeping you in control of your form's behavior, react-formstate-fp eliminates the busy work involved with React forms, without limiting you or getting in your way.

## Setup

```
npm install --save react-formstate-fp
```

## Demo

[All examples demonstrated here](https://dtrelogan.github.io/react-formstate-fp-demo/).

## Examples and documentation

- [Basic example](/doc/BasicExample.md)
- [Typescript example](/doc/Typescript.md)
- [How is this better than raw React?](/doc/Why.md)
- [Why the departure from react-formstate?](/doc/WhyTheFpBranch.md)
- [Initialization](/doc/Initialization.md)
- [Binding inputs to formstate](/doc/Binding.md)
- [Synchronous validation](/doc/Validation.md)
- [Asynchronous validation](/doc/AsynchronousValidation.md)
- [Submitting](/doc/Submitting.md)
- [Change and blur handlers](/doc/Handlers.md)
- [Nested forms](/doc/NestedForms.md)
- [Arrays, addModelKey, deleteModelKey](/doc/Arrays.md)
- [Quirks and edge cases](/doc/Quirks.md)
- [useFormstate and bindToSetStateComponent](/doc/useFormstate.md)
- [API index](/doc/ApiIndex.md)

### Dependencies

- A peer dependency on [React](https://facebook.github.io/react) >= 16.8 (React hooks).
- [@babel/runtime](https://babeljs.io/docs/en/babel-runtime) might be pulled in depending on how you build your project.

Basically no dependencies other than React.

### Environment

- Assumes an es5 environment (for example: Object.keys and Array.isArray).
- Assumes es6 promises. (This is the only polyfill requirement beyond es5.)
- Works with Typescript.

Thanks for your interest!
