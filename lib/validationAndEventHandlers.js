"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.synclyValidate = synclyValidate;
exports.synclyValidateForm = synclyValidateForm;
exports._synclyValidate = _synclyValidate;
exports.validateRequired = validateRequired;
exports.asynclyValidate = asynclyValidate;
exports.asynclyValidateForm = asynclyValidateForm;
exports.getPromises = getPromises;
exports.changeAndValidate = changeAndValidate;
exports.handleChange = handleChange;
exports.handleBlur = handleBlur;
exports.startFormSubmission = startFormSubmission;
exports.cancelFormSubmission = cancelFormSubmission;
exports.driveFormSubmission = driveFormSubmission;
exports.addModelKey = addModelKey;
exports.deleteModelKey = deleteModelKey;
exports._setContainerScopesChanged = _setContainerScopesChanged;
exports.deleteModelKeyAndValidateParentScope = deleteModelKeyAndValidateParentScope;
exports.validateForm = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray.js"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2.js"));

var _helperFunctions = require("./helperFunctions.js");

var _schemaAndLookup = require("./schemaAndLookup.js");

var _fieldAndScopeStatus = require("./fieldAndScopeStatus.js");

var _formStatus = require("./formStatus.js");

//
// synclyValidate
//
function synclyValidate(formstate, modelKey, form) {
  var id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  if (!id) {
    id = (0, _schemaAndLookup.getId)(formstate, modelKey);
  }

  if (!(0, _fieldAndScopeStatus.isSynclyValidated)(formstate, modelKey)) {
    formstate = _synclyValidate(formstate, modelKey, form, id);
  } // validate container scopes, in order of precision, with the root scope last.


  var rootModelKey = (0, _schemaAndLookup.getRootModelKey)(formstate, id); // Cannot use a relative model key for scopes above the nested scope...

  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  (0, _helperFunctions.sortKeysByScopeLength)(formstate.lookup.scopes, formstate.lookup.rootModelKeysById).forEach(function (rootScopeKey) {
    if ((0, _helperFunctions.inScope)(rootModelKey, rootScopeKey)) {
      if (!(0, _fieldAndScopeStatus.isSynclyValidated)(formstate, rootScopeKey)) {
        formstate = _synclyValidate(formstate, rootScopeKey, form, formstate.lookup.idsByRootModelKey[rootScopeKey]);
      }
    }
  });
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
} //
// synclyValidateForm
//


function synclyValidateForm(formstate, form) {
  // Cannot use a relative model key for scopes above the nested scope...
  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  (0, _helperFunctions.sortKeysByScopeLength)(formstate.lookup.rootModelKeysById, formstate.lookup.rootModelKeysById).forEach(function (rootModelKey) {
    if (!(0, _fieldAndScopeStatus.isSynclyValidated)(formstate, rootModelKey)) {
      var id = formstate.lookup.idsByRootModelKey[rootModelKey];
      formstate = _synclyValidate(formstate, rootModelKey, form, id);
    }
  });
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
}

var validateForm = synclyValidateForm;
exports.validateForm = validateForm;

function _synclyValidate(formstate, modelKey, form, id) {
  var validationSchema = formstate.validationSchemas[id] || form.validationSchemas && form.validationSchemas[id];

  if (!validationSchema) {
    return (0, _fieldAndScopeStatus.setSynclyValid)(formstate, modelKey);
  }

  var value = (0, _fieldAndScopeStatus.getValue)(formstate, modelKey);

  if (validationSchema.required) {
    var result = validateRequired(value, validationSchema.requiredMessage);

    if (result) {
      return (0, _fieldAndScopeStatus.setSynclyInvalid)(formstate, modelKey, result);
    }
  }

  if (validationSchema.validate) {
    var _result = validationSchema.validate(value, formstate, form, id);

    if ((0, _helperFunctions.isNonEmptyString)(_result)) {
      return (0, _fieldAndScopeStatus.setSynclyInvalid)(formstate, modelKey, _result);
    }

    if ((0, _helperFunctions.isObject)(_result) && _result.model) {
      formstate = _result;

      if ((0, _schemaAndLookup.isScope)(formstate, id) && !(0, _fieldAndScopeStatus.isSynclyValidated)(formstate, modelKey)) {
        formstate = (0, _fieldAndScopeStatus.setSynclyValid)(formstate, modelKey);
      }

      return formstate;
    }

    if (_result) {
      throw new Error('Validation functions should return an error message, an updated formstate object, or nothing.');
    }
  }

  return (0, _fieldAndScopeStatus.setSynclyValid)(formstate, modelKey);
}

function validateRequired(value, configuredMessage) {
  if (!(0, _helperFunctions.exists)(value)) {
    return configuredMessage;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return configuredMessage;
  }

  if (Array.isArray(value) && value.length === 0) {
    return configuredMessage;
  }
} //
// asynclyValidate
//


function asynclyValidate(formstate, modelKey, form) {
  var id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  if ((0, _fieldAndScopeStatus.isSynclyInvalid)(formstate, modelKey) || (0, _fieldAndScopeStatus.isAsynclyValidated)(formstate, modelKey) || (0, _fieldAndScopeStatus.isWaiting)(formstate, modelKey)) {
    return formstate;
  }

  if (!id) {
    id = (0, _schemaAndLookup.getId)(formstate, modelKey);
  }

  var validationSchema = formstate.validationSchemas[id] || form.validationSchemas && form.validationSchemas[id];
  var validateAsync = validationSchema && validationSchema.validateAsync;

  if (!validateAsync) {
    return formstate;
  }

  var _validateAsync = (0, _slicedToArray2["default"])(validateAsync, 2),
      validateAsyncFunction = _validateAsync[0],
      whenToRun = _validateAsync[1];

  if (whenToRun === 'onSubmit' && !(0, _fieldAndScopeStatus.isSubmitting)(formstate, modelKey)) {
    return formstate;
  }

  if (whenToRun === 'onBlur' && !(0, _fieldAndScopeStatus.isBlurred)(formstate, modelKey) && !(0, _fieldAndScopeStatus.isSubmitting)(formstate, modelKey)) {
    return formstate;
  }

  var asyncResultErrorMessage = 'An asynchronous validation function should return a formstate object to update formstate synchronously, or an array of [formstate, asyncToken, promise] to proceed with asynchronous validation.';
  var result = validateAsyncFunction((0, _fieldAndScopeStatus.getValue)(formstate, modelKey), formstate, form, Number(id));

  if (!(0, _helperFunctions.isObject)(result) && !Array.isArray(result)) {
    throw new Error(asyncResultErrorMessage);
  }

  if ((0, _helperFunctions.isObject)(result)) {
    return result;
  }

  var _result2 = (0, _slicedToArray2["default"])(result, 3),
      waitingFormstate = _result2[0],
      asyncToken = _result2[1],
      promise = _result2[2];

  if (typeof asyncToken !== 'string' || !(0, _helperFunctions.isObject)(promise) || !(0, _helperFunctions.exists)(promise.constructor) || promise.constructor.name !== 'Promise') {
    throw new Error(asyncResultErrorMessage);
  }

  return (0, _fieldAndScopeStatus.setPromise)(waitingFormstate, asyncToken, promise);
} //
// asynclyValidateForm
//


function asynclyValidateForm(formstate, form) {
  // Cannot use a relative model key for scopes above the nested scope...
  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  Object.keys(formstate.lookup.rootModelKeysById).forEach(function (id) {
    var rootModelKey = (0, _schemaAndLookup.getRootModelKey)(formstate, id);
    formstate = asynclyValidate(formstate, rootModelKey, form, id);
  });
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
} //
// getPromises
//


function getPromises(formstate) {
  return Object.keys(formstate.formStatus.promises).map(function (asyncToken) {
    return formstate.formStatus.promises[asyncToken];
  });
} //
// changeAndValidate
//


function changeAndValidate(formstate, modelKey, value, form) {
  var id = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  formstate = (0, _fieldAndScopeStatus.setValueAndClearStatus)(formstate, modelKey, value);
  formstate = (0, _fieldAndScopeStatus.setChanged)(formstate, modelKey);
  formstate = synclyValidate(formstate, modelKey, form, id);
  return asynclyValidate(formstate, modelKey, form, id);
} //
// handlers
//


function handleChange(form, value, id) {
  form.setFormstate(function (formstate) {
    if ((0, _formStatus.isInputDisabled)(formstate)) {
      return formstate;
    }

    return changeAndValidate(formstate, (0, _schemaAndLookup.getModelKey)(formstate, id), value, form, id);
  });
}

function handleBlur(form, id) {
  form.setFormstate(function (formstate) {
    if ((0, _formStatus.isInputDisabled)(formstate)) {
      return formstate;
    }

    var modelKey = (0, _schemaAndLookup.getModelKey)(formstate, id);
    formstate = (0, _fieldAndScopeStatus.setBlurred)(formstate, modelKey);

    if (!(0, _formStatus.isFormSubmitting)(formstate)) {
      // && !isFormSubmittedAndUnchanged(formstate)) {
      if (form.validateOnBlur) {
        formstate = synclyValidate(formstate, modelKey, form, id);
        formstate = asynclyValidate(formstate, modelKey, form, id);
      } else if ((0, _fieldAndScopeStatus.isChanged)(formstate, modelKey)) {
        // If the form is set to NOT validate onBlur, and if they tab right through it, nothing should happen.
        // In that case, if there is async validation to run, at worst it'll run on submit.
        formstate = asynclyValidate(formstate, modelKey, form, id);
      }
    }

    return formstate;
  });
} //
// startFormSubmission
//


function startFormSubmission(formstate) {
  if (formstate.nestedScopeId) {
    throw new Error('Nested form components should not submit the form.');
  }

  if ((0, _formStatus.isFormSubmitting)(formstate)) {
    throw new Error('The formstate provided to startFormSubmission is already submitting! Please check for this before you call startFormSubmission.');
  }

  return (0, _formStatus.setInputDisabled)((0, _formStatus.setFormSubmitting)(formstate));
} //
// cancelFormSubmission
//


function cancelFormSubmission(formstate) {
  return (0, _formStatus.setInputEnabled)((0, _formStatus.setFormSubmitted)(formstate));
} //
// driveFormSubmission
//


function driveFormSubmission(form, submitValidModel) {
  form.setFormstate(function (formstate) {
    if ((0, _formStatus.isFormSubmitting)(formstate)) {
      return formstate;
    }

    formstate = startFormSubmission(formstate);
    formstate = synclyValidateForm(formstate, form); // if (isModelInvalid(formstate)) {return cancelFormSubmission(formstate);}

    formstate = asynclyValidateForm(formstate, form);
    Promise.all(getPromises(formstate)).then(function () {
      form.setFormstate(function (validatedFs) {
        if (!(0, _formStatus.isModelValid)(validatedFs)) {
          return cancelFormSubmission(validatedFs);
        }

        Promise.resolve().then(function () {
          submitValidModel(validatedFs.model, form);
        });
        return validatedFs;
      });
    });
    return formstate;
  });
} //
// addModelKey
//


function addModelKey(formstate, modelKey, initialModel) {
  var formValidationSchema = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    lookup: (0, _objectSpread2["default"])({}, formstate.lookup, {
      rootModelKeysById: (0, _objectSpread2["default"])({}, formstate.lookup.rootModelKeysById),
      idsByRootModelKey: (0, _objectSpread2["default"])({}, formstate.lookup.idsByRootModelKey),
      scopes: (0, _objectSpread2["default"])({}, formstate.lookup.scopes)
    }),
    validationSchemas: (0, _objectSpread2["default"])({}, formstate.validationSchemas),
    model: (0, _helperFunctions.modelAdd)(formstate.model, rootModelKey, initialModel) // formStatus
    // statuses
    // nestedScopeId

  });
  var normalizedFormValidationSchema = {
    fields: {},
    scopes: {}
  };
  (0, _schemaAndLookup.normalizeSchemaKeys)(formValidationSchema, normalizedFormValidationSchema, 'fields', rootModelKey);
  (0, _schemaAndLookup.normalizeSchemaKeys)(formValidationSchema, normalizedFormValidationSchema, 'scopes', rootModelKey);
  (0, _schemaAndLookup.buildLookup)(formstate, rootModelKey, initialModel, normalizedFormValidationSchema);
  (0, _schemaAndLookup.buildValidationSchemas)(formstate, normalizedFormValidationSchema, 'fields');
  (0, _schemaAndLookup.buildValidationSchemas)(formstate, normalizedFormValidationSchema, 'scopes'); // Cannot use a relative model key for scopes above the nested scope...

  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  formstate = _setContainerScopesChanged(formstate, rootModelKey);
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
} //
// deleteModelKey
//


function deleteModelKey(formstate, modelKey) {
  var rootModelKeyToDelete = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);
  var purgedFormstate = (0, _objectSpread2["default"])({}, formstate, {
    lookup: {
      rootModelKeysById: {},
      idsByRootModelKey: {},
      scopes: {}
    },
    statuses: {},
    validationSchemas: {},
    model: (0, _helperFunctions.modelDelete)(formstate.model, rootModelKeyToDelete) // formStatus
    // nestedScopeId

  });

  var _parseParentScope = (0, _helperFunctions.parseParentScope)(rootModelKeyToDelete),
      _parseParentScope2 = (0, _slicedToArray2["default"])(_parseParentScope, 2),
      parentScope = _parseParentScope2[0],
      i = _parseParentScope2[1];

  var deletingFromArray = Array.isArray((0, _helperFunctions.modelGet)(formstate.model, parentScope));
  Object.keys(formstate.lookup.idsByRootModelKey).forEach(function (rootModelKey) {
    if (!(0, _helperFunctions.inScope)(rootModelKey, rootModelKeyToDelete)) {
      var id = formstate.lookup.idsByRootModelKey[rootModelKey];
      var shiftedRootModelKey = null;

      if (deletingFromArray && (0, _helperFunctions.inScope)(rootModelKey, parentScope) && rootModelKey !== parentScope) {
        var indexAndRemainder = rootModelKey.slice(parentScope.length + 1);

        var _parseRootScope = (0, _helperFunctions.parseRootScope)(indexAndRemainder),
            _parseRootScope2 = (0, _slicedToArray2["default"])(_parseRootScope, 2),
            j = _parseRootScope2[0],
            remainder = _parseRootScope2[1];

        if (Number(j) > Number(i)) {
          var shiftedIndex = String(Number(j) - 1);
          var shiftedIndexAndRemainder = (0, _helperFunctions.addScope)(shiftedIndex, remainder);
          shiftedRootModelKey = (0, _helperFunctions.addScope)(parentScope, shiftedIndexAndRemainder);
        }
      }

      purgedFormstate.lookup.rootModelKeysById[id] = shiftedRootModelKey || rootModelKey;
      purgedFormstate.lookup.idsByRootModelKey[shiftedRootModelKey || rootModelKey] = id;

      if (formstate.lookup.scopes[id]) {
        purgedFormstate.lookup.scopes[id] = true;
      }

      var status = formstate.statuses[id];

      if (status) {
        purgedFormstate.statuses[id] = status;
      }

      var validationSchema = formstate.validationSchemas[id];

      if (validationSchema) {
        purgedFormstate.validationSchemas[id] = validationSchema;
      }
    }
  }); // Cannot use a relative model key for scopes above the nested scope...

  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, purgedFormstate, {
    nestedScopeId: null
  });
  formstate = _setContainerScopesChanged(formstate, rootModelKeyToDelete);
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
} // This assumes nestedScopeId already set to null.
// This is to handle a case where you delete the nested scope.
//


function _setContainerScopesChanged(formstate, rootModelKey) {
  var _parseParentScope3 = (0, _helperFunctions.parseParentScope)(rootModelKey),
      _parseParentScope4 = (0, _slicedToArray2["default"])(_parseParentScope3, 1),
      parentScope = _parseParentScope4[0];

  Object.keys(formstate.lookup.scopes).forEach(function (scopeId) {
    var rootScopeKey = (0, _schemaAndLookup.getRootModelKey)(formstate, scopeId);

    if ((0, _helperFunctions.inScope)(parentScope, rootScopeKey)) {
      formstate = (0, _fieldAndScopeStatus.clearStatus)(formstate, rootScopeKey);
      formstate = (0, _fieldAndScopeStatus.setTouched)(formstate, rootScopeKey, 'changed');
    }
  });
  return formstate;
} // Too easy to mess up the signature when calling this. It's easy enough to just call synclyValidate yourself...
//
// export function addModelKeyAndValidate(formstate, modelKey, form, initialModel, formValidationSchema = {}) {
//   formstate = addModelKey(formstate, modelKey, initialModel, formValidationSchema);
//   return synclyValidate(formstate, modelKey, form);
// }
// In this case, you cannot get to the parent scope in a nested form without a whole lot of hassle, so this one is more helpful.
//


function deleteModelKeyAndValidateParentScope(formstate, modelKey, form) {
  // Do this before the nestedScopeId modelKey potentially gets deleted.
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);

  var _parseParentScope5 = (0, _helperFunctions.parseParentScope)(rootModelKey),
      _parseParentScope6 = (0, _slicedToArray2["default"])(_parseParentScope5, 1),
      parentScope = _parseParentScope6[0]; // Cannot use a relative model key for scopes above the nested scope...


  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  formstate = deleteModelKey(formstate, rootModelKey);
  formstate = synclyValidate(formstate, parentScope, form, formstate.lookup.idsByRootModelKey[parentScope]);
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
}