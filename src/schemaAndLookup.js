import {
  generateQuickGuid, exists, isContainer, isObject, hasProp, isNonEmptyString, humanizeCamelCaseString, addScope, normalizeModelKey, fieldName
} from './helperFunctions.js';




//
// lookup
//

export function convertToRootModelKey(formstate, modelKey) {
  const nestedScopeKey = formstate.nestedScopeId && getRootModelKey(formstate, formstate.nestedScopeId);
  return addScope(nestedScopeKey, normalizeModelKey(modelKey));
}


export function getRootModelKey(formstate, id) {
  const rootModelKey = formstate.lookup.rootModelKeysById[id];
  if (!exists(rootModelKey)) {
    throw new Error(`Could not find rootModelKey for id ${id}`);
  }
  return rootModelKey;
}


export function getModelKey(formstate, id) {
  const rootModelKey = getRootModelKey(formstate, id);
  if (formstate.nestedScopeId) {
    const nestedScopeKey = getRootModelKey(formstate, formstate.nestedScopeId);
    return rootModelKey.slice(nestedScopeKey.length + 1);
  }
  return rootModelKey;
}


export function getId(formstate, modelKey) {
  const rootModelKey = convertToRootModelKey(formstate, modelKey);
  const id = formstate.lookup.idsByRootModelKey[rootModelKey];
  if (!id) {
    throw new Error(`Could not find id for rootModelKey "${rootModelKey}"`);
  }
  return id;
}


export function isScope(formstate, id) {
  return Boolean(formstate.lookup.scopes[id]);
}


export function isRequired(formstate, id, form) {
  const validationSchema = formstate.validationSchemas[id];
  const jsxValidationSchema = form && form.validationSchemas && form.validationSchemas[id];
  return Boolean((validationSchema && validationSchema.required) || (jsxValidationSchema && jsxValidationSchema.required));
}



//
// initializeFormstate
//


export function initializeFormstate(initialModel, formValidationSchema = {}) {
  if (!isContainer(initialModel)) {
    throw new Error('The initialModel passed to initializeFormstate must be an object or an array.');
  }

  const formstate = {
    lookup: {
      rootModelKeysById: {},
      idsByRootModelKey: {},
      scopes: {}
    },
    statuses: {},
    validationSchemas: {},
    formStatus: {
      submit: {},
      submitHistory: [],
      custom: {},
      promises: {},
      inputDisabled: false
    },
    initialModel,
    model: initialModel,
    nestedScopeId: null
  };

  const normalizedFormValidationSchema = {
    fields: {},
    scopes: {}
  };

  normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, 'fields', '');
  normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, 'scopes', '');

  buildLookup(formstate, '', initialModel, normalizedFormValidationSchema);

  buildValidationSchemas(formstate, normalizedFormValidationSchema, 'fields');
  buildValidationSchemas(formstate, normalizedFormValidationSchema, 'scopes');

  return formstate;
}



function throwSchemaError(modelKey) {
  throw new Error('The form validation schema passed to initializeFormstate is not in the right format.' + (modelKey ? ` See model key ${modelKey}.` : ''));
}



export function normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, fieldsOrScopes, scopeKey) {
  if (!isObject(formValidationSchema)) {throwSchemaError(scopeKey);}
  if (formValidationSchema[fieldsOrScopes] === undefined) {return;} // Maybe they only defined fields and not scopes, or vice versa, or neither.
  if (!isObject(formValidationSchema[fieldsOrScopes])) {throwSchemaError(scopeKey);}
  Object.keys(formValidationSchema[fieldsOrScopes]).forEach(k => {
    const validationSchema = formValidationSchema[fieldsOrScopes][k];
    const rootModelKey = addScope(scopeKey, normalizeModelKey(k));
    if (!isObject(validationSchema)) {throwSchemaError(rootModelKey);}
    if (fieldsOrScopes === 'scopes' && hasProp(validationSchema, 'schema')) {
      normalizeSchemaKeys(validationSchema.schema, normalizedFormValidationSchema, 'fields', rootModelKey);
      normalizeSchemaKeys(validationSchema.schema, normalizedFormValidationSchema, 'scopes', rootModelKey);
    }
    else {
      if (normalizedFormValidationSchema[fieldsOrScopes][rootModelKey]) {
        throw new Error(`The model key "${rootModelKey}" may only have one validation schema defined.`);
      }
      normalizedFormValidationSchema[fieldsOrScopes][rootModelKey] = [validationSchema, scopeKey];
    }
  });
}



export function buildLookup(formstate, rootModelKey, value, normalizedFormValidationSchema) {

  const id = generateQuickGuid();

  formstate.lookup.rootModelKeysById[id] = rootModelKey;
  formstate.lookup.idsByRootModelKey[rootModelKey] = id;

  if (rootModelKey === '' && normalizedFormValidationSchema.fields[rootModelKey]) {
    throw new Error('The root scope cannot be overridden as a field.');
  }

  if (!isContainer(value) && normalizedFormValidationSchema.scopes[rootModelKey]) {
    throw new Error(`Root model key "${rootModelKey}" cannot be defined as a scope.`);
  }

  if (!isContainer(value) || normalizedFormValidationSchema.fields[rootModelKey]) {
    // For something like a multi-select you can label the modelKey as a formField and it won't delve into the array of selected options.
    // For a data-type like a "moment", this can prevent polluting the formstate with lots of unnecessary status objects.
    return;
  }

  formstate.lookup.scopes[id] = true;

  if (Array.isArray(value)) {
    const schemaAndNestedScope = normalizedFormValidationSchema.scopes[rootModelKey];
    const validationSchema = schemaAndNestedScope && schemaAndNestedScope[0];

    for (let i = 0, len = value.length; i < len; i++) {
      const itemKey = addScope(rootModelKey, String(i));
      if (hasProp(validationSchema, 'schemaForEach')) {
        const schemaForEach = validationSchema.schemaForEach;
        normalizeSchemaKeys(schemaForEach, normalizedFormValidationSchema, 'fields', itemKey);
        normalizeSchemaKeys(schemaForEach, normalizedFormValidationSchema, 'scopes', itemKey);
      }
      buildLookup(formstate, itemKey, value[i], normalizedFormValidationSchema);
    }
  }
  else {
    Object.keys(value).forEach((k) => {
      const fieldKey = addScope(rootModelKey, k);
      buildLookup(formstate, fieldKey, value[k], normalizedFormValidationSchema);
    });
  }
}




export function buildValidationSchemas(formstate, normalizedFormValidationSchema, fieldsOrScopes) {
  Object.keys(normalizedFormValidationSchema[fieldsOrScopes]).forEach((rootModelKey) => {
    const id = formstate.lookup.idsByRootModelKey[rootModelKey];
    if (!id) {
      throw new Error(`The model key "${rootModelKey}" specified under "${fieldsOrScopes}" in the form validation schema passed to initializeFormstate does not correspond to a model key for the initial model.`);
    }
    if (formstate.validationSchemas[id]) {
      throw new Error(`The model key "${rootModelKey}" can only have one validation schema defined.`);
    }
    const [rawSchema, nestedScopeKey] = normalizedFormValidationSchema[fieldsOrScopes][rootModelKey];
    const schema = buildValidationSchema(rawSchema, rootModelKey, fieldsOrScopes === 'scopes');
    if (Object.keys(schema).length > 0) {
      const nestedScopeId = nestedScopeKey !== '' ? formstate.lookup.idsByRootModelKey[nestedScopeKey] : null;
      formstate.validationSchemas[id] = {...schema, nestedScopeId};
    }
  });
}




export function buildValidationSchema(props, modelKey, isScope) {

  const schema = {};

  // required

  if (props.required) {
    schema.required = true;
  }

  if (schema.required) {
    schema.requiredMessage = (
      isNonEmptyString(props.required) ? props.required : `${humanizeCamelCaseString(fieldName(modelKey))} is required.`
    );
  }

  // validate

  if (hasProp(props, 'validate')) {
    if (typeof(props.validate) === 'function') {
      schema.validate = props.validate;
    }
    else {
      throw new Error(`The "validate" prop for model key "${modelKey}" must be a function.`);
    }
  }

  // validateAsync

  if (hasProp(props, 'validateAsync')) {

    if (isScope) {
      if (typeof(props.validateAsync) !== 'function') {
        throw new Error(`The validateAsync property for scope model key "${modelKey}" must specify a validation function and only a function (scope-level async validation is always run "onSubmit"), for example, validateAsync: verifyAddress.`);
      }
      schema.validateAsync = [props.validateAsync, 'onSubmit'];
    }
    else {
      if (!Array.isArray(props.validateAsync)) {
        throwAsyncPropsError(modelKey);
      }

      const [validateAsyncFunction, whenToRun] = props.validateAsync;

      if (typeof(validateAsyncFunction) !== 'function') {
        throwAsyncPropsError(modelKey);
      }

      if (whenToRun !== 'onChange' && whenToRun !== 'onBlur' && whenToRun !== 'onSubmit') {
        throwAsyncPropsError(modelKey);
      }

      schema.validateAsync = [validateAsyncFunction, whenToRun];
    }
  }

  return schema;
}


function throwAsyncPropsError(modelKey) {
  throw new Error(`The validateAsync property for model key "${modelKey}" must be an array specifying the validation function, and when to run the validation ("onChange", "onBlur", or "onSubmit"). For example, validateAsync: [validateUniqueUsername, 'onBlur'].`);
}


export function createNestedScope(newNestedScopeId, formstate, form) {
  const nestedFormstate = {
    ...formstate,
    nestedScopeId: newNestedScopeId
  };

  const nestedForm = {...form, parentForm: form};

  if (form.getFormstate) {
    nestedForm.getFormstate = () => {
      return {...form.getFormstate(), nestedScopeId: newNestedScopeId};
    };
    nestedForm.setFormstate = (fsOrFunction) => {
      let fs = fsOrFunction;
      if (typeof(fsOrFunction) === 'function') {
        fs = fsOrFunction({...form.getFormstate(), nestedScopeId: newNestedScopeId});
      }
      form.setFormstate({...fs, nestedScopeId: null});
    };
  }
  else {
    nestedForm.setFormstate = (setFormstateFunction) => {
      if (typeof(setFormstateFunction) !== 'function') {
        throw new Error('Please pass a function to setFormstate, something like: (currentFormstate) => rff.changeAndValidate(currentFormstate, modelKey, value, form)');
      }
      form.setFormstate((fs) => {
        const updatedFs = setFormstateFunction({...fs, nestedScopeId: newNestedScopeId});
        return {...updatedFs, nestedScopeId: null};
      });
    };
  }

  return [nestedFormstate, nestedForm];
}
