# Arrays, addModelKey, deleteModelKey

This example uses a nested form. If you haven't read the [nested forms](/doc/NestedForms.md) document, you might want to review that first as there are less moving parts in that example.

## The idea

Since react-formstate-fp is [model first](/doc/WhyTheFpBranch.md), your JSX can flow from your model. So, dynamically adding and removing parts of your model will cause your form to change accordingly.

In this example, "dependents" can be added and removed on the fly.

## This means model keys can change!

If you remove an item from an array, a model key like 'dependents.3.email' can change to 'dependents.2.email'.

This is why the handlers and validation functions are supplied an id rather than a model key.

## The parent form

```jsx
import Dependent, {
  initialModel as dependentInitialModel,
  validationSchema as dependentValidationSchema
} from './Dependent.jsx';


const initialModel = {
  name: '',
  dependents: []
};

// 'schemaForEach' can be used to configure validation for an array DRYly.

const validationSchema = {
  fields: {
    'name': { required: true, validate: validateName }
  },
  scopes: {
    'dependents': { schemaForEach: dependentValidationSchema }
  }
}


export default function Dependents({model})
{
  const initialFormstate = () => rff.initializeFormstate(model || initialModel, validationSchema);

  const [formstate, setFormstate] = useState(initialFormstate);

  const form = {
    setFormstate,
    adaptors: [InputAndFeedback],
    calculatePrimed: rff.primeOnChange
  };

  // Build the form based on the model.

  let dependents = null;

  if (formstate.model.dependents.length > 0) {
    dependents = formstate.model.dependents.map((d,i) => {
      return (
        <FormScope key={i} name={i}>
          <Dependent nestedForm/>
        </FormScope>
      );
    });
  }

  // Combining FormScope 'dependents' with FormScope 'i' above will put the nested form in scope 'dependents.i'

  return (
    <form onSubmit={e => submit(e, form)}>
      <FormScope formstate={formstate} form={form}>
        <FormField name='name'>
          <InputAndFeedback type='text' label='Name'/>
        </FormField>
        <FormScope name='dependents'>
          {dependents}
        </FormScope>
        <button onClick={() => addDependent(form)}>add dependent</button>
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


function addDependent(form) {
  form.setFormstate(fs => {
    // Add a new dependent to the end of the array.
    const i = fs.model.dependents.length;
    const modelKey = `dependents[${i}]`; // or `dependents.${i}`
    // Provide the initial model and the validation schema.
    fs = rff.addModelKey(fs, modelKey, dependentInitialModel, dependentValidationSchema);
    // Validating immediately afterward is irrelevant for this form, but if 'dependents' were marked required be sure to do this too:
    return rff.synclyValidate(fs, modelKey, form);
  });
}

// Submit handler not shown.
```

## The nested form

```jsx
export const initialModel = {
  name: '',
  age: ''
};

export const validationSchema = {
  fields: {
    name: { required: true, validate: validateName },
    age: { required: true }
  }
};

export default function Dependent({formstate, form}) {

  let adaptors = form.adaptors || [];
  adaptors = [...adaptors, InputAndFeedback];
  form = {...form, adaptors};

  // These fields will be 'dependents.i.name' and 'dependents.i.age'
  // This nested form will be in scope dependents.i so you can remain ignorant of the parent scope.

  return (
    <div style={{border: 'solid'}}>
      <FormScope formstate={formstate} form={form}>
        <FormField name='name'>
          <InputAndFeedback type='text' label='Name'/>
        </FormField>
        <FormField name='age'>
          <InputAndFeedback type='number' label='Age'/>
        </FormField>
        <button onClick={() => removeMe(form)}>remove</button>
      </FormScope>
    </div>
  );
}


function validateName(name) {
  if (name[0] === name[0].toLowerCase()) {
    return 'Name must be capitalized.';
  }
}


function removeMe(form) {
  // This is the more common form of deleteModelKey:
  // form.setFormstate(fs => {
  //   fs = rff.deleteModelKey(fs, 'contacts.0'); // or `contacts.${i}`
  //   return rff.synclyValidate(fs, 'contacts', form);
  // });

  // But since this nested form is essentially deleting itself, you don't know the parent scope.
  // So, this version is easier to use here.
  form.setFormstate(fs => rff.deleteModelKeyAndValidateParentScope(fs, '', form));
}
```
