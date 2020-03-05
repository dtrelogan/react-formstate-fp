import {
  exists, isObject, isNonEmptyString, inScope, sortKeysByScopeLength, modelGet, modelAdd, modelDelete, addScope, parseParentScope, parseRootScope
} from './helperFunctions.js';

import {
  convertToRootModelKey, getRootModelKey, getModelKey, getId, normalizeSchemaKeys, buildLookup, buildValidationSchemas, isScope, createNestedScope
} from './schemaAndLookup.js';

import {
  getValue, isSynclyInvalid, isSynclyValidated, isWaiting, isAsynclyValidated, isChanged, isBlurred, isSubmitting,
  setValueAndClearStatus, setSynclyValid, setSynclyInvalid, setPromise, setChanged, setBlurred, clearStatus, setTouched
} from './fieldAndScopeStatus.js';

import {
  isInputDisabled, isFormSubmitting, isModelValid, setFormSubmitting, setFormSubmitted, setInputDisabled, setInputEnabled
} from './formStatus.js';




//
// synclyValidate
//

export function synclyValidate(formstate, modelKey, form, id = null) {

  if (!id) {
    id = getId(formstate, modelKey);
  }

  if (!isSynclyValidated(formstate, modelKey)) {
    formstate = _synclyValidate(formstate, modelKey, form, id);
  }

  // validate container scopes, in order of precision, with the root scope last.
  const rootModelKey = getRootModelKey(formstate, id);

  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  sortKeysByScopeLength(formstate.lookup.scopes, formstate.lookup.rootModelKeysById).forEach(rootScopeKey => {
    if (inScope(rootModelKey, rootScopeKey)) {
      if (!isSynclyValidated(formstate, rootScopeKey)) {
        formstate = _synclyValidate(formstate, rootScopeKey, form, formstate.lookup.idsByRootModelKey[rootScopeKey]);
      }
    }
  });

  return {...formstate, nestedScopeId};
}


//
// synclyValidateForm
//

export function synclyValidateForm(formstate, form) {
  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  sortKeysByScopeLength(formstate.lookup.rootModelKeysById, formstate.lookup.rootModelKeysById).forEach(rootModelKey => {
    if (!isSynclyValidated(formstate, rootModelKey)) {
      const id = formstate.lookup.idsByRootModelKey[rootModelKey];
      formstate = _synclyValidate(formstate, rootModelKey, form, id);
    }
  });

  return {...formstate, nestedScopeId};
}


export const validateForm = synclyValidateForm;




export function _synclyValidate(formstate, modelKey, form, id) {
  const validationSchema = formstate.validationSchemas[id] || (form.validationSchemas && form.validationSchemas[id]);

  if (!validationSchema) {return setSynclyValid(formstate, modelKey);}

  const value = getValue(formstate, modelKey);

  if (validationSchema.required) {
    const result = validateRequired(value, validationSchema.requiredMessage);
    if (result) {
      return setSynclyInvalid(formstate, modelKey, result);
    }
  }

  if (validationSchema.validate) {
    const nestedScopeId = formstate.nestedScopeId;
    let scopedFormstate = formstate, scopedForm = form;

    if (formstate.nestedScopeId !== validationSchema.nestedScopeId) {
      [scopedFormstate, scopedForm] = createNestedScope(validationSchema.nestedScopeId, formstate, form);
    }

    const result = validationSchema.validate(value, scopedFormstate, scopedForm, id);

    if (isNonEmptyString(result)) {
      return setSynclyInvalid(formstate, modelKey, result);
    }
    if (isObject(result) && result.model) {
      formstate = {...result, nestedScopeId};
      if (isScope(formstate, id) && !isSynclyValidated(formstate, modelKey)) {
        formstate = setSynclyValid(formstate, modelKey);
      }
      return formstate;
    }
    if (result) {
      throw new Error('Validation functions should return an error message, an updated formstate object, or nothing.');
    }
  }

  return setSynclyValid(formstate, modelKey);
}


export function validateRequired(value, configuredMessage) {
  if (!exists(value)) {
    return configuredMessage;
  }
  if (typeof(value) === 'string' && value.trim() === '') {
    return configuredMessage;
  }
  if (Array.isArray(value) && value.length === 0) {
    return configuredMessage;
  }
}



//
// asynclyValidate
//

export function asynclyValidate(formstate, modelKey, form, id = null) {
  if (isSynclyInvalid(formstate, modelKey) || isAsynclyValidated(formstate, modelKey) || isWaiting(formstate, modelKey)) {
    return formstate;
  }

  if (!id) {
    id = getId(formstate, modelKey);
  }

  const validationSchema = formstate.validationSchemas[id] || (form.validationSchemas && form.validationSchemas[id]);

  const validateAsync = validationSchema && validationSchema.validateAsync;

  if (!validateAsync) {
    return formstate;
  }

  const [validateAsyncFunction, whenToRun] = validateAsync;

  if (whenToRun === 'onSubmit' && !isSubmitting(formstate, modelKey)) {
    return formstate;
  }
  if (whenToRun === 'onBlur' && !isBlurred(formstate, modelKey) && !isSubmitting(formstate, modelKey)) {
    return formstate;
  }

  const nestedScopeId = formstate.nestedScopeId;
  let scopedFormstate = formstate, scopedForm = form;

  if (formstate.nestedScopeId !== validationSchema.nestedScopeId) {
    [scopedFormstate, scopedForm] = createNestedScope(validationSchema.nestedScopeId, formstate, form);
  }

  const result = validateAsyncFunction(getValue(formstate, modelKey), scopedFormstate, scopedForm, id);

  const asyncResultErrorMessage = 'An asynchronous validation function should return a formstate object to update formstate synchronously, or an array of [formstate, asyncToken, promise] to proceed with asynchronous validation.';

  if (!isObject(result) && !Array.isArray(result)) {
    throw new Error(asyncResultErrorMessage);
  }

  if (isObject(result)) {
    return {...result, nestedScopeId};
  }

  const [waitingFormstate, asyncToken, promise] = result;

  if (!isObject(waitingFormstate) || !isNonEmptyString(asyncToken) || !isObject(promise) || !exists(promise.constructor) || promise.constructor.name !== 'Promise') {
    throw new Error(asyncResultErrorMessage);
  }

  return setPromise({...waitingFormstate, nestedScopeId}, asyncToken, promise);
}



//
// asynclyValidateForm
//

export function asynclyValidateForm(formstate, form) {
  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  Object.keys(formstate.lookup.rootModelKeysById).forEach(id => {
    const rootModelKey = getRootModelKey(formstate, id);
    formstate = asynclyValidate(formstate, rootModelKey, form, id);
  });

  return {...formstate, nestedScopeId};
}


//
// getPromises
//

export function getPromises(formstate) {
  return Object.keys(formstate.formStatus.promises).map((asyncToken) => formstate.formStatus.promises[asyncToken]);
}


//
// changeAndValidate
//

export function changeAndValidate(formstate, modelKey, value, form, id = null) {
  formstate = setValueAndClearStatus(formstate, modelKey, value);
  formstate = setChanged(formstate, modelKey);
  formstate = synclyValidate(formstate, modelKey, form, id);
  return asynclyValidate(formstate, modelKey, form, id);
}


//
// handlers
//

export function handleChange(form, value, id) {
  form.setFormstate((formstate) => {
    if (isInputDisabled(formstate)) {return formstate;}
    return changeAndValidate(formstate, getModelKey(formstate, id), value, form, id);
  });
}

export function handleBlur(form, id) {
  form.setFormstate((formstate) => {
    if (isInputDisabled(formstate)) {return formstate;}

    const modelKey = getModelKey(formstate, id);

    formstate = setBlurred(formstate, modelKey);

    if (!isFormSubmitting(formstate)) { // && !isFormSubmittedAndUnchanged(formstate)) {
      if (form.validateOnBlur) {
        formstate = synclyValidate(formstate, modelKey, form, id);
        formstate = asynclyValidate(formstate, modelKey, form, id);
      }
      else if (isChanged(formstate, modelKey)) {
        // If the form is set to NOT validate onBlur, and if they tab right through it, nothing should happen.
        // In that case, if there is async validation to run, at worst it'll run on submit.
        formstate = asynclyValidate(formstate, modelKey, form, id);
      }
    }

    return formstate;
  });
}


//
// startFormSubmission
//

export function startFormSubmission(formstate) {
  if (formstate.nestedScopeId) {
    throw new Error('Nested form components should not submit the form.');
  }

  if (isFormSubmitting(formstate)) {
    throw new Error('The formstate provided to startFormSubmission is already submitting! Please check for this before you call startFormSubmission.');
  }

  return setInputDisabled(setFormSubmitting(formstate));
}


//
// cancelFormSubmission
//

export function cancelFormSubmission(formstate) {
  return setInputEnabled(setFormSubmitted(formstate));
}

//
// driveFormSubmission
//

export function driveFormSubmission(form, submitValidModel) {

  form.setFormstate((formstate) => {

    if (isFormSubmitting(formstate)) {return formstate;}

    formstate = startFormSubmission(formstate);
    formstate = synclyValidateForm(formstate, form);

    // if (isModelInvalid(formstate)) {return cancelFormSubmission(formstate);}

    formstate = asynclyValidateForm(formstate, form);

    Promise.all(getPromises(formstate)).then(() => {

      form.setFormstate((validatedFs) => {

        if (!isModelValid(validatedFs)) {return cancelFormSubmission(validatedFs);}

        Promise.resolve().then(() => {
          submitValidModel(validatedFs.model, form);
        });

        return validatedFs;
      });

    });

    return formstate;
  });
}





//
// addModelKey
//

export function addModelKey(formstate, modelKey, initialModel, formValidationSchema = {}) {

  const rootModelKey = convertToRootModelKey(formstate, modelKey);

  formstate = {
    ...formstate,
    lookup: {
      ...formstate.lookup,
      rootModelKeysById: {...formstate.lookup.rootModelKeysById},
      idsByRootModelKey: {...formstate.lookup.idsByRootModelKey},
      scopes: {...formstate.lookup.scopes}
    },
    validationSchemas: {...formstate.validationSchemas},
    model: modelAdd(formstate.model, rootModelKey, initialModel)
    // formStatus
    // statuses
    // nestedScopeId
  };

  const normalizedFormValidationSchema = {
    fields: {},
    scopes: {}
  };

  normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, 'fields', rootModelKey);
  normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, 'scopes', rootModelKey);

  buildLookup(formstate, rootModelKey, initialModel, normalizedFormValidationSchema);

  buildValidationSchemas(formstate, normalizedFormValidationSchema, 'fields');
  buildValidationSchemas(formstate, normalizedFormValidationSchema, 'scopes');

  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};
  formstate = _setContainerScopesChanged(formstate, rootModelKey);
  return {...formstate, nestedScopeId};
}


//
// deleteModelKey
//

export function deleteModelKey(formstate, modelKey) {

  const rootModelKeyToDelete = convertToRootModelKey(formstate, modelKey);

  const purgedFormstate = {
    ...formstate,
    lookup: {
      rootModelKeysById: {},
      idsByRootModelKey: {},
      scopes: {}
    },
    statuses: {},
    validationSchemas: {},
    model: modelDelete(formstate.model, rootModelKeyToDelete)
    // formStatus
    // nestedScopeId
  };

  const [parentScope, i] = parseParentScope(rootModelKeyToDelete);
  const deletingFromArray = Array.isArray(modelGet(formstate.model, parentScope));

  Object.keys(formstate.lookup.idsByRootModelKey).forEach(rootModelKey => {
    if (!inScope(rootModelKey, rootModelKeyToDelete)) {
      const id = formstate.lookup.idsByRootModelKey[rootModelKey];

      let shiftedRootModelKey = null;

      if (deletingFromArray && inScope(rootModelKey, parentScope) && rootModelKey !== parentScope) {
        const indexAndRemainder = rootModelKey.slice(parentScope.length + 1);
        const [j, remainder] = parseRootScope(indexAndRemainder);
        if (Number(j) > Number(i)) {
          const shiftedIndex = String(Number(j) - 1);
          const shiftedIndexAndRemainder = addScope(shiftedIndex, remainder);
          shiftedRootModelKey = addScope(parentScope, shiftedIndexAndRemainder);
        }
      }

      purgedFormstate.lookup.rootModelKeysById[id] = shiftedRootModelKey || rootModelKey;
      purgedFormstate.lookup.idsByRootModelKey[shiftedRootModelKey || rootModelKey] = id;

      if (formstate.lookup.scopes[id]) {
        purgedFormstate.lookup.scopes[id] = true;
      }

      const status = formstate.statuses[id];

      if (status) {
        purgedFormstate.statuses[id] = status;
      }

      const validationSchema = formstate.validationSchemas[id];

      if (validationSchema) {
        purgedFormstate.validationSchemas[id] = validationSchema;
      }
    }
  });


  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...purgedFormstate, nestedScopeId: null};
  formstate = _setContainerScopesChanged(formstate, rootModelKeyToDelete);
  return {...formstate, nestedScopeId};
}



// This assumes nestedScopeId already set to null.
// This is to handle a case where you delete the nested scope.
//
export function _setContainerScopesChanged(formstate, rootModelKey) {
  const [parentScope] = parseParentScope(rootModelKey);

  Object.keys(formstate.lookup.scopes).forEach(scopeId => {
    const rootScopeKey = getRootModelKey(formstate, scopeId);
    if (inScope(parentScope, rootScopeKey)) {
      formstate = clearStatus(formstate, rootScopeKey);
      formstate = setTouched(formstate, rootScopeKey, 'changed');
    }
  });

  return formstate;
}

// Too easy to mess up the signature when calling this. It's easy enough to just call synclyValidate yourself...
//
// export function addModelKeyAndValidate(formstate, modelKey, form, initialModel, formValidationSchema = {}) {
//   formstate = addModelKey(formstate, modelKey, initialModel, formValidationSchema);
//   return synclyValidate(formstate, modelKey, form);
// }


// In this case, you cannot get to the parent scope in a nested form without a whole lot of hassle, so this one is more helpful.
//
export function deleteModelKeyAndValidateParentScope(formstate, modelKey, form) {
  // Do this before the nestedScopeId modelKey potentially gets deleted.
  const rootModelKey = convertToRootModelKey(formstate, modelKey);
  const [parentScope] = parseParentScope(rootModelKey);

  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  formstate = deleteModelKey(formstate, rootModelKey);
  formstate = synclyValidate(formstate, parentScope, form, formstate.lookup.idsByRootModelKey[parentScope]);

  return {...formstate, nestedScopeId};
}
