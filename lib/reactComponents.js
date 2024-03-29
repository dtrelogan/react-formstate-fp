"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault")["default"];

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormField = FormField;
exports.FormScope = FormScope;
exports.bindToSetStateComponent = bindToSetStateComponent;
exports.createRffAdaptor = createRffAdaptor;
exports.createRffNestedFormAdaptor = createRffNestedFormAdaptor;
exports.useFormstate = useFormstate;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireWildcard(require("react"));

var _helperFunctions = require("./helperFunctions.js");

var _schemaAndLookup = require("./schemaAndLookup.js");

var _excluded = ["formstate", "form", "activeModelKey", "name", "required", "validate", "validateAsync", "children"];

//
// create RffAdaptor (to make TypeScript happy)
//
// typescript version
//
// export function createRffAdaptor<Props, Model>(
//   Component: React.FunctionComponent<Props & RffProps<Model>>
// ): React.FunctionComponent<Props & FormFieldName>
// {
//   return (props) => {
//       // rff used React.mapChildren to add form, formstate, and modelKey to render props
//       // have to do some casting to keep typescript happy...
//       const { form, formstate, modelKey, ...other } = props as Props & RffProps<Model>;
//       const unadaptedProps = (other as unknown) as Props;
//       return <Component form={form} formstate={formstate} modelKey={modelKey} {...unadaptedProps}/>;
//   };
// };
// javascript version
//
// Because this isn't typescript, you don't have to do any casting.
// Despite appearances this function does accomplish something.
// It's the typescript type signature for this function that does the work.
function createRffAdaptor(Component) {
  return Component;
}

function createRffNestedFormAdaptor(Component) {
  return Component;
} //
// useFormstate
//


function useFormstate(initialFormstate, options) {
  var _useState = (0, _react.useState)(initialFormstate),
      _useState2 = (0, _slicedToArray2["default"])(_useState, 2),
      formstate = _useState2[0],
      setFormstateHook = _useState2[1]; // Prevent React from complaining about async validation trying to update formstate for an unmounted form:
  //  --> react-dom.development.js:530 Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
  // I do not believe asynchronous validation completing after the form is unmounted constitutes a real problem to be concerned about,
  // but to prevent spurious warnings from popping up in the console, you can make the form instance a ref...


  var formRef = (0, _react.useRef)(null);
  var formstateRef = (0, _react.useRef)(formstate); // So that people can use await if they want.

  if (formRef.current === null) {
    formRef.current = (0, _objectSpread2["default"])({
      getFormstate: function getFormstate() {
        return formstateRef.current;
      },
      setFormstate: function setFormstate(p) {
        formstateRef.current = typeof p === 'function' ? p(formstateRef.current) : p;
        setFormstateHook(formstateRef.current);
      }
    }, options);
  }

  (0, _react.useEffect)(function () {
    return function () {
      // Return a cleanup function that will run when the form is unmounted.
      formRef.current.setFormstate = function () {}; // Suppress further attempts to update form state.

    };
  }, []); // Only create this cleanup function once.

  return [formstate, formRef.current];
} //
// bindToSetStateComponent
//


function bindToSetStateComponent(component) {
  var statePropertyName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'formstate';
  return {
    getFormstate: function getFormstate() {
      return component.state[statePropertyName];
    },
    // So that people can use await if they want.
    setFormstate: function setFormstate(p) {
      var updates = {};
      updates[statePropertyName] = typeof p === 'function' ? p(component.state[statePropertyName]) : p;
      component.setState(updates);
    }
  };
} //
// Form, FormScope, FormField
//
// export function Form(props) {
//   return createElement('Form', props);
// }


function FormScope(props) {
  return createElement('FormScope', props);
}

function FormField(props) {
  return createElement('FormField', props);
}

function createElement(elementName, props) {
  var isScopeElement = elementName !== 'FormField';
  var formstate = props.formstate,
      form = props.form,
      activeModelKey = props.activeModelKey,
      name = props.name,
      required = props.required,
      validate = props.validate,
      validateAsync = props.validateAsync,
      children = props.children,
      otherProps = (0, _objectWithoutProperties2["default"])(props, _excluded);

  if (!formstate || !form) {
    throw new Error("An RFF ".concat(elementName, " element requires \"formstate\" and \"form\" props."));
  }

  if (typeof form.setFormstate !== 'function') {
    throw new Error("The \"form\" prop provided to an RFF ".concat(elementName, " element must contain a \"setFormstate\" function."));
  } // if (elementName === 'Form' && (activeModelKey || formstate.nestedScopeId)) { // This won't catch all cases.
  //   throw new Error('An RFF Form element should not be nested underneath another Form or FormScope element, even across components.');
  // }


  var _name = (0, _helperFunctions.exists)(name) ? String(name) : '';

  var newModelKey = (0, _helperFunctions.addScope)(activeModelKey, (0, _helperFunctions.normalizeModelKey)(_name));
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, newModelKey);
  var id = formstate.lookup.idsByRootModelKey[rootModelKey];

  if (!id) {
    throw new Error("The RFF ".concat(elementName, " element with name \"").concat(_name, "\" mapped to root model key \"").concat(rootModelKey, "\" does not correspond to anything in your model. Did you provide an initial model to initializeFormstate?"));
  }

  if (isScopeElement && !(0, _schemaAndLookup.isScope)(formstate, id) || !isScopeElement && (0, _schemaAndLookup.isScope)(formstate, id)) {
    throw new Error("The RFF ".concat(elementName, " element with name \"").concat(_name, "\" mapped to root model key \"").concat(rootModelKey, "\" conflicts with your initial model, or with a validation schema provided to initializeFormstate, which defines that model key as a ").concat(isScopeElement ? 'field' : 'scope', ", not a ").concat(isScopeElement ? 'scope' : 'field', "."));
  }

  if (required || validate || validateAsync) {
    // This is really just to satisfy eslint wrt unused variables.
    var jsxValidationSchema = (0, _schemaAndLookup.buildValidationSchema)(props, newModelKey, isScopeElement);

    if (Object.keys(jsxValidationSchema).length > 0) {
      // Do not mutate the form unless the user decides to use jsx validation configuration...
      if (!form.validationSchemas) {
        form.validationSchemas = {};
        var fm = form;

        while (fm.parentForm) {
          fm.parentForm.validationSchemas = form.validationSchemas;
          fm = fm.parentForm;
        }
      }

      if (formstate.validationSchemas[id]) {
        throw new Error("You cannot define validation in your JSX if a validation schema was already provided to initializeFormstate or addModelKey. Pick one approach please. See the RFF ".concat(elementName, " element for root model key ").concat(rootModelKey, "."));
      }

      var priorSchema = form.validationSchemas[id];

      if (priorSchema && priorSchema.nestedScopeId !== formstate.nestedScopeId) {
        throw new Error("Validation is defined for root model key \"".concat(rootModelKey, "\" in two different components? This is not supported by RFF."));
      }

      form.validationSchemas[id] = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, jsxValidationSchema), {}, {
        nestedScopeId: formstate.nestedScopeId
      });
    }
  }

  return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, //elementName === 'Form' ? 'form' : React.Fragment,
  otherProps, children && _react["default"].Children.map(children, function (child) {
    return addProps(formstate, form, newModelKey, child);
  }));
} //
// validateNameRequired
//


function validateNameRequired(props, isFormScope) {
  if (!(0, _helperFunctions.hasProp)(props, 'name') || !(0, _helperFunctions.isNonEmptyString)(props.name) && typeof props.name !== 'number') {
    throw new Error("A ".concat(isFormScope ? 'non-root FormScope' : 'FormField', " element requires a non-empty \"name\" prop."));
  }
} //
// addProps
//


function addProps(formstate, form, activeModelKey, element) {
  if (!element || !element.props) {
    return element;
  } // An example to help understand React.Children.map:
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
    validateNameRequired(element.props, true); // let the FormScope component do the work.

    return /*#__PURE__*/_react["default"].cloneElement(element, {
      formstate: formstate,
      form: form,
      activeModelKey: activeModelKey
    }, // Merge in the props it needs.
    element.props.children);
  }

  if (element.type === FormField) {
    // For example:
    //<Form formstate={formstate} form={form}>
    //  <FormField name='email'>
    //    <Input type='text'/>
    //  </FormField>
    //</Form>
    validateNameRequired(element.props, false); // let the FormField component do the work.

    return /*#__PURE__*/_react["default"].cloneElement(element, {
      formstate: formstate,
      form: form,
      activeModelKey: activeModelKey
    }, // Merge in the props it needs.
    element.props.children);
  }

  function addPropsToChildren(children) {
    return children && _react["default"].Children.map(children, function (child) {
      return addProps(formstate, form, activeModelKey, child);
    });
  }

  if (form.adaptors) {
    if (!Array.isArray(form.adaptors)) {
      throw new Error('The "form.adaptors" option must be an array.');
    }

    for (var i = 0, len = form.adaptors.length; i < len; i++) {
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
        var modelKey = activeModelKey;

        if ((0, _helperFunctions.hasProp)(element.props, 'name')) {
          // as of version 1.2 prefer name prop for adaptors
          modelKey = (0, _helperFunctions.normalizeModelKey)(element.props.name);
        } else if ((0, _helperFunctions.hasProp)(element.props, 'modelKey')) {
          modelKey = (0, _helperFunctions.normalizeModelKey)(element.props.modelKey);
        }

        return /*#__PURE__*/_react["default"].cloneElement(element, {
          formstate: formstate,
          form: form,
          modelKey: modelKey
        }, // Merge in additional props to pass to the adaptor.
        addPropsToChildren(element.props.children));
      }
    }
  }

  if ((0, _helperFunctions.hasProp)(element.props, 'nestedForm')) {
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
    var newNestedScopeId = (0, _schemaAndLookup.getId)(formstate, activeModelKey);

    var _createNestedScope = (0, _schemaAndLookup.createNestedScope)(newNestedScopeId, formstate, form),
        _createNestedScope2 = (0, _slicedToArray2["default"])(_createNestedScope, 2),
        nestedFormstate = _createNestedScope2[0],
        nestedForm = _createNestedScope2[1];

    return /*#__PURE__*/_react["default"].cloneElement(element, {
      formstate: nestedFormstate,
      form: nestedForm
    }, // Merge in additional props to pass to the nested component.
    addPropsToChildren(element.props.children));
  } // else


  if (element.props.children) {
    return /*#__PURE__*/_react["default"].cloneElement(element, {}, // Don't need to pass rff-related props to something like a div, but we do need to look through its children.
    addPropsToChildren(element.props.children));
  }

  return element;
}