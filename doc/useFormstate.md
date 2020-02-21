# useFormstate and bindToSetStateComponent

## useFormstate usage

```es6
export default function ExampleForm({model})
{
  const options = {
    adaptors: [FormGroup, Input, InputFeedback],
    calculatePrimed: rff.primeOnChange
  };

  const [formstate, form] = useFormstate(initialFormstate, options);

  // ...
}
```

## Why use useFormstate?

For most forms it doesn't matter, but if you have any of these needs:

### Memoization

It is easier to memoize input and feedback components if the form instance is a ref.

### await

Using await requires both getFormstate and setFormstate functions. (See the source code below.)

(To be honest, I don't think await adds any value when coding react-formstate-fp handlers, but you can be your own judge.)

### Silencing React warnings

If you have asynchronous validation running and you close the form, React might complain:

> react-dom.development.js:530 Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.

The cleanup function installed by useFormstate can be used as a quick and dirty way to silence these warnings.


## useFormstate source code

```es6
export function useFormstate(initialFormstate, options) {
  const [formstate, setFormstateHook] = useState(initialFormstate);
  const formRef = useRef(null);
  const formstateRef = useRef(formstate);

  if (formRef.current === null) {

    formRef.current = {
      getFormstate: () => formstateRef.current, // So that people can use await if they want.
      setFormstate: (p) => {
        formstateRef.current = (
          typeof(p) === 'function' ? p(formstateRef.current) : p
        );
        setFormstateHook(formstateRef.current);
      },
      ...options
    };

  }

  useEffect(() => {
    return () => { // Return a cleanup function that will run when the form is unmounted.
      formRef.current.setFormstate = () => {}; // Suppress further attempts to update form state.
    };
  }, []); // Only create this cleanup function once.

  return [formstate, formRef.current];
}
```


## bindToSetStateComponent usage

```es6
class ExampleForm extends Component
{
  constructor(props) {
    super(props);
    this.state = {formstate: rff.initializeFormstate(initialModel)};
    this.form = rff.bindToSetStateComponent(this);
  }
  // ...
}
```

## bindToSetStateComponent source code

```es6
export function bindToSetStateComponent(component, statePropertyName = 'formstate') {
  return {
    getFormstate: () => component.state[statePropertyName], // So that people can use await if they want.
    setFormstate: (p) => {
      const updates = {};
      updates[statePropertyName] = (
        typeof(p) === 'function' ? p(component.state[statePropertyName]) : p
      );
      component.setState(updates);
    }
  };
}
```
