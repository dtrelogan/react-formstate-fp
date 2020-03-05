import React, { useState, useRef, useEffect} from 'react';
import { exists, hasProp, isNonEmptyString, addScope, normalizeModelKey } from './helperFunctions.js';
import { convertToRootModelKey, getId, isScope, buildValidationSchema, createNestedScope } from './schemaAndLookup.js';



//
// useFormstate
//

export function useFormstate(initialFormstate, options) {
  const [formstate, setFormstateHook] = useState(initialFormstate);

  // Prevent React from complaining about async validation trying to update formstate for an unmounted form:
  //  --> react-dom.development.js:530 Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
  // I do not believe asynchronous validation completing after the form is unmounted constitutes a real problem to be concerned about,
  // but to prevent spurious warnings from popping up in the console, you can make the form instance a ref...

  const formRef = useRef(null);

  const formstateRef = useRef(formstate); // So that people can use await if they want.

  if (formRef.current === null) {

    formRef.current = {
      getFormstate: () => formstateRef.current,
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





//
// bindToSetStateComponent
//

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



//
// Form, FormScope, FormField
//

// export function Form(props) {
//   return createElement('Form', props);
// }

export function FormScope(props) {
  return createElement('FormScope', props);
}

export function FormField(props) {
  return createElement('FormField', props);
}



function createElement(elementName, props) {

  const isScopeElement = (elementName !== 'FormField');

  const {formstate, form, activeModelKey, name, required, validate, validateAsync, children, ...otherProps} = props;

  if (!formstate || !form) {
    throw new Error(`An RFF ${elementName} element requires "formstate" and "form" props.`);
  }

  if (typeof(form.setFormstate) !== 'function') {
    throw new Error(`The "form" prop provided to an RFF ${elementName} element must contain a "setFormstate" function.`);
  }

  // if (elementName === 'Form' && (activeModelKey || formstate.nestedScopeId)) { // This won't catch all cases.
  //   throw new Error('An RFF Form element should not be nested underneath another Form or FormScope element, even across components.');
  // }

  const _name = exists(name) ? String(name) : '';

  const newModelKey = addScope(activeModelKey, normalizeModelKey(_name));
  const rootModelKey = convertToRootModelKey(formstate, newModelKey);
  const id = formstate.lookup.idsByRootModelKey[rootModelKey];

  if (!id) {
    throw new Error(`The RFF ${elementName} element with name "${_name}" mapped to root model key "${rootModelKey}" does not correspond to anything in your model. Did you provide an initial model to initializeFormstate?`);
  }
  if ((isScopeElement && !isScope(formstate, id)) || (!isScopeElement && isScope(formstate, id))) {
    throw new Error(`The RFF ${elementName} element with name "${_name}" mapped to root model key "${rootModelKey}" conflicts with your initial model, or with a validation schema provided to initializeFormstate, which defines that model key as a ${isScopeElement ? 'field' : 'scope'}, not a ${isScopeElement ? 'scope' : 'field'}.`);
  }

  if (required || validate || validateAsync) { // This is really just to satisfy eslint wrt unused variables.
    const jsxValidationSchema = buildValidationSchema(props, newModelKey, isScopeElement);

    if (Object.keys(jsxValidationSchema).length > 0) {

      // Do not mutate the form unless the user decides to use jsx validation configuration...

      if (!form.validationSchemas) {
        form.validationSchemas = {};
        let fm = form;
        while (fm.parentForm) {
          fm.parentForm.validationSchemas = form.validationSchemas;
          fm = fm.parentForm;
        }
      }

      if (formstate.validationSchemas[id]) {
        throw new Error(`You cannot define validation in your JSX if a validation schema was already provided to initializeFormstate or addModelKey. Pick one approach please. See the RFF ${elementName} element for root model key ${rootModelKey}.`);
      }
      const priorSchema = form.validationSchemas[id];
      if (priorSchema && priorSchema.nestedScopeId !== formstate.nestedScopeId) {
        throw new Error(`Validation is defined for root model key "${rootModelKey}" in two different components? This is not supported by RFF.`);
      }
      form.validationSchemas[id] = {...jsxValidationSchema, nestedScopeId: formstate.nestedScopeId};
    }
  }

  return React.createElement(
    React.Fragment, //elementName === 'Form' ? 'form' : React.Fragment,
    otherProps,
    children && React.Children.map(children, (child) => addProps(formstate, form, newModelKey, child))
  );
}


//
// validateNameRequired
//

function validateNameRequired(props, isFormScope) {
  if (!hasProp(props, 'name') || (!isNonEmptyString(props.name) && typeof(props.name) !== 'number')) {
    throw new Error(`A ${isFormScope ? 'non-root FormScope' : 'FormField'} element requires a non-empty "name" prop.`);
  }
}


//
// addProps
//

function addProps(formstate, form, activeModelKey, element) {

  if (!element || !element.props) { return element; }

  // An example to help understand React.Children.map:
  //<Contact nestedForm>
  //  <FormScope name='address'>
  //    <Address nestedForm>
  //      <FormField name='anAddressChild'>
  //        <Input type='text'/>
  //      </FormField>
  //    </Address>
  //  </FormScope>
  //  <FormField name='anotherContactChild'>
  //    <Input type='text'/>
  //  </FormField>
  //</Contact>

  // The 'anAddressChild' input is not a direct child of this element so it is not in element.props.children here.
  // It will be processed by a React.Children.map call when addProps is called *for the Address child*.

  // Also, note that the FormScope and FormField components are contained in this library, so they can be coded to do their own work.
  // For anything else you have to take a look at the children via this method (and recursively take a look at their children via this method).
  // For instance, the Contact component isn't going to walk its children to add rff props. You have to do that for it here.

  // if (element.type === Form) {
  //   throw new Error("A Form element should never be a child of another Form or FormScope element.");
  // }

  if (element.type === FormScope) {

    // For example:
    //<Form formstate={formstate} form={form}>
    //  <FormField name='email'>
    //    <Input type='text'/>
    //  </FormField>
    //  <FormScope name='address'>
    //    <FormField name='line1'>
    //      <Input type='text'/>
    //    </FormField>
    //  </FormScope>
    //</Form>

    validateNameRequired(element.props, true);

    // let the FormScope component do the work.

    return React.cloneElement(
      element,
      {formstate, form, activeModelKey}, // Merge in the props it needs.
      element.props.children
    );
  }


  if (element.type === FormField) {

    // For example:
    //<Form formstate={formstate} form={form}>
    //  <FormField name='email'>
    //    <Input type='text'/>
    //  </FormField>
    //</Form>

    validateNameRequired(element.props, false);

    // let the FormField component do the work.

    return React.cloneElement(
      element,
      {formstate, form, activeModelKey}, // Merge in the props it needs.
      element.props.children
    );
  }


  function addPropsToChildren(children) {
    return children && React.Children.map(children, (child) => addProps(formstate, form, activeModelKey, child));
  }


  if (form.adaptors) {
    if (!Array.isArray(form.adaptors)) {
      throw new Error('The "form.adaptors" option must be an array.');
    }
    for (let i = 0, len = form.adaptors.length; i < len; i++) {
      if (form.adaptors[i] === element.type) {

        // For example:
        //<Form formstate={formstate} form={form}>
        //  <FormField name='email'>
        //    <FormGroup>
        //      <Form.Label>Email</Form.Label>
        //      <Input type='text'/>
        //      <InputFeedback/>
        //    </FormGroup>
        //  </FormField>
        //</Form>

        // Let the user override the "activeModelKey" if necessary...

        let modelKey = activeModelKey;

        if (hasProp(element.props, 'modelKey')) {
          modelKey = normalizeModelKey(element.props.modelKey);
        }

        return React.cloneElement(
          element,
          {formstate, form, modelKey}, // Merge in additional props to pass to the adaptor.
          addPropsToChildren(element.props.children)
        );
      }
    }
  }


  if (hasProp(element.props, 'nestedForm')) {

    // For example:
    //<FormScope name='homeContact'>
    //  <Contact nestedForm>
    //    <FormScope name='address'>
    //      <Address nestedForm/>
    //    </FormScope>
    //  </Contact>
    //</FormScope>

    // In the Contact component:
    //<FormScope formstate={props.formstate} form={props.form}>
    //  <FormField name='name'>
    //    <Input type='text'/>
    //  </FormField>
    //  {children}
    //</FormScope>

    // The nested component should operate within a nested component scope that is completely ignorant of anything above it.
    const newNestedScopeId = getId(formstate, activeModelKey);

    const [nestedFormstate, nestedForm] = createNestedScope(newNestedScopeId, formstate, form);

    return React.cloneElement(
      element,
      {formstate: nestedFormstate, form: nestedForm}, // Merge in additional props to pass to the nested component.
      addPropsToChildren(element.props.children)
    );

  }

  // else

  if (element.props.children) {
    return React.cloneElement(
      element,
      {}, // Don't need to pass rff-related props to something like a div, but we do need to look through its children.
      addPropsToChildren(element.props.children)
    );
  }

  return element;
}
