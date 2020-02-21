# Nested forms

This is an introductory example. The [arrays, addModelKey, deleteModelKey](/doc/Arrays.md) topic has another nested form example.

## The parent form

```jsx

// Import the initial model and the validation schema from the nested form.

import EmergencyContact, {
  initialModel as contactInitialModel,
  validationSchema as contactValidationSchema
} from './EmergencyContact.jsx';

// Compose the initial model.

const initialModel = {
  name: '',
  roomNumber: '',
  emergencyContact1: contactInitialModel,
  emergencyContact2: contactInitialModel
};

// Compose the validation schema using the 'schema' property to keep things DRY.

const validationSchema = {
  fields: {
    'name': { required: true, validate: validateName },
    'roomNumber': { required: true }
  },
  scopes: {
    'emergencyContact1': { schema: contactValidationSchema },
    'emergencyContact2': { schema: contactValidationSchema }
  }
};

export default function EmergencyContacts({model})
{
  // If you're editing a model, it will already be composed.

  const initialFormstate = () => rff.initializeFormstate(model || initialModel, validationSchema);

  const [formstate, setFormstate] = useState(initialFormstate);

  const form = {
    setFormstate,
    adaptors: [InputAndFeedback],
    calculatePrimed: rff.primeOnChange
  };

  // Use the nestedForm property to ask RFF to create specially-scoped versions of formstate and form and to pass them to your component.

  return (
    <form onSubmit={(e) => submit(e, form)}>
      <FormScope formstate={formstate} form={form}>
        <FormField name='name'>
          <InputAndFeedback type='text' label='Name'/>
        </FormField>
        <FormField name='roomNumber'>
          <InputAndFeedback type='text' label='Room Number'/>
        </FormField>
        <FormScope name='emergencyContact1'>
          <EmergencyContact nestedForm title='Emergency Contact 1'/>
        </FormScope>
        <FormScope name='emergencyContact2'>
          <EmergencyContact nestedForm title='Emergency Contact 2'/>
        </FormScope>
      </FormScope>
      <input type='submit' value='Submit'/>
    </form>
  );
}


function validateName(name) {
  if (name[0] === name[0].toLowerCase()) {
    return 'Name must be capitalized.';
  }
}

// Submit handler not shown.
```

## The nested form

```jsx
import { library as validation } from 'react-formstate-validation';

// Export these so the parent form can use them.

export const initialModel = {
  name: '',
  email: ''
};

export const validationSchema = {
  fields: {
    'name': { required: true },
    'email': { required: true, validate: validateEmail }
  }
};

export default function EmergencyContact({formstate, form, title}) {

  // The formstate and form props passed to this component are in a nested scope.

  // Model keys used in this component are relative to the emergency contact model, not the root model.
  // For instance, this nested form doesn't need the model for anything, but if it did, then
  const model = rff.getValue(formstate, '');
  // would provide the relevant emergency contact model: { name: '', email: '' }
  // and NOT the formstate.model:
  // { name: '', roomNumber: '', emergencyContact1: { name: '', email: ''}, emergencyContact2: { name: '', email: ''}}

  // Here is how you can add additional form configuration if necessary:

  let adaptors = form.adaptors || [];
  adaptors = [...adaptors, InputAndFeedback];
  form = {...form, adaptors};

  // Note you could nest another form here using the same pattern...

  return (
    <div style={{border: 'solid'}}>
      <div>{title}</div>
      <FormScope formstate={formstate} form={form}>
        <FormField name='name'>
          <InputAndFeedback type='text' label='Name'/>
        </FormField>
        <FormField name='email'>
          <InputAndFeedback type='text' label='Email' inputProps={{handleChange: handleEmailChange}}/>
        </FormField>
      </FormScope>
    </div>
  );
}


function validateEmail(value) {
  if (!validation.email(value)) {
    return 'Not a valid email address';
  }
}

//
//
// Demonstrate the lookup functions
//
//

function handleEmailChange(form, value, id)
{
  form.setFormstate((fs) => {
    if (rff.isInputDisabled(fs)) {return fs;}

    // This returns 'email'
    const modelKey = rff.getModelKey(fs, id);

    // This returns 'emergencyContact1.email' or 'emergencyContact2.email'
    const rootModelKey = rff.getRootModelKey(fs, id);

    // Getting the id from a model key is useful in input components.
    const reverseLookupId = rff.getId(fs, modelKey);

    // This returns 'emergencyContact1' or 'emergencyContact2'
    const scopeKey = rff.getRootModelKey(fs, fs.nestedScopeId);

    // Use model key here, NOT root model key. (RFF recognizes nestedScopeId in the fs object.)
    // This way, you can remain ignorant of the parent scope.
    return rff.changeAndValidate(fs, 'email', value, form);
  });
}
```
