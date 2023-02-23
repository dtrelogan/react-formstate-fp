"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildLookup = buildLookup;
exports.buildValidationSchema = buildValidationSchema;
exports.buildValidationSchemas = buildValidationSchemas;
exports.convertToRootModelKey = convertToRootModelKey;
exports.createNestedScope = createNestedScope;
exports.getId = getId;
exports.getModelKey = getModelKey;
exports.getRootModelKey = getRootModelKey;
exports.initializeFormstate = initializeFormstate;
exports.isRequired = isRequired;
exports.isScope = isScope;
exports.normalizeSchemaKeys = normalizeSchemaKeys;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _helperFunctions = require("./helperFunctions.js");

//
// lookup
//
function convertToRootModelKey(formstate, modelKey) {
  var nestedScopeKey = formstate.nestedScopeId && getRootModelKey(formstate, formstate.nestedScopeId);
  return (0, _helperFunctions.addScope)(nestedScopeKey, (0, _helperFunctions.normalizeModelKey)(modelKey));
}

function getRootModelKey(formstate, id) {
  var rootModelKey = formstate.lookup.rootModelKeysById[id];

  if (!(0, _helperFunctions.exists)(rootModelKey)) {
    throw new Error("Could not find rootModelKey for id ".concat(id));
  }

  return rootModelKey;
}

function getModelKey(formstate, id) {
  var rootModelKey = getRootModelKey(formstate, id);

  if (formstate.nestedScopeId) {
    var nestedScopeKey = getRootModelKey(formstate, formstate.nestedScopeId);
    return rootModelKey.slice(nestedScopeKey.length + 1);
  }

  return rootModelKey;
}

function getId(formstate, modelKey) {
  var rootModelKey = convertToRootModelKey(formstate, modelKey);
  var id = formstate.lookup.idsByRootModelKey[rootModelKey];

  if (!id) {
    throw new Error("Could not find id for rootModelKey \"".concat(rootModelKey, "\""));
  }

  return id;
}

function isScope(formstate, id) {
  return Boolean(formstate.lookup.scopes[id]);
}

function isRequired(formstate, id, form) {
  var validationSchema = formstate.validationSchemas[id];
  var jsxValidationSchema = form && form.validationSchemas && form.validationSchemas[id];
  return Boolean(validationSchema && validationSchema.required || jsxValidationSchema && jsxValidationSchema.required);
} //
// initializeFormstate
//


function initializeFormstate(initialModel) {
  var formValidationSchema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!(0, _helperFunctions.isContainer)(initialModel)) {
    throw new Error('The initialModel passed to initializeFormstate must be an object or an array.');
  }

  var formstate = {
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
    initialModel: initialModel,
    model: initialModel,
    nestedScopeId: null
  };
  var normalizedFormValidationSchema = {
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
  throw new Error('The form validation schema passed to initializeFormstate is not in the right format.' + (modelKey ? " See model key ".concat(modelKey, ".") : ''));
}

function normalizeSchemaKeys(formValidationSchema, normalizedFormValidationSchema, fieldsOrScopes, scopeKey) {
  if (!(0, _helperFunctions.isObject)(formValidationSchema)) {
    throwSchemaError(scopeKey);
  }

  if (formValidationSchema[fieldsOrScopes] === undefined) {
    return;
  } // Maybe they only defined fields and not scopes, or vice versa, or neither.


  if (!(0, _helperFunctions.isObject)(formValidationSchema[fieldsOrScopes])) {
    throwSchemaError(scopeKey);
  }

  Object.keys(formValidationSchema[fieldsOrScopes]).forEach(function (k) {
    var validationSchema = formValidationSchema[fieldsOrScopes][k];
    var rootModelKey = (0, _helperFunctions.addScope)(scopeKey, (0, _helperFunctions.normalizeModelKey)(k));

    if (!(0, _helperFunctions.isObject)(validationSchema)) {
      throwSchemaError(rootModelKey);
    }

    if (fieldsOrScopes === 'scopes' && (0, _helperFunctions.hasProp)(validationSchema, 'schema')) {
      normalizeSchemaKeys(validationSchema.schema, normalizedFormValidationSchema, 'fields', rootModelKey);
      normalizeSchemaKeys(validationSchema.schema, normalizedFormValidationSchema, 'scopes', rootModelKey);
    } else {
      if (normalizedFormValidationSchema[fieldsOrScopes][rootModelKey]) {
        throw new Error("The model key \"".concat(rootModelKey, "\" may only have one validation schema defined."));
      }

      normalizedFormValidationSchema[fieldsOrScopes][rootModelKey] = [validationSchema, scopeKey];
    }
  });
}

function buildLookup(formstate, rootModelKey, value, normalizedFormValidationSchema) {
  var id = (0, _helperFunctions.generateQuickGuid)();
  formstate.lookup.rootModelKeysById[id] = rootModelKey;
  formstate.lookup.idsByRootModelKey[rootModelKey] = id;

  if (rootModelKey === '' && normalizedFormValidationSchema.fields[rootModelKey]) {
    throw new Error('The root scope cannot be overridden as a field.');
  }

  if (!(0, _helperFunctions.isContainer)(value) && normalizedFormValidationSchema.scopes[rootModelKey]) {
    throw new Error("Root model key \"".concat(rootModelKey, "\" cannot be defined as a scope."));
  }

  if (!(0, _helperFunctions.isContainer)(value) || normalizedFormValidationSchema.fields[rootModelKey]) {
    // For something like a multi-select you can label the modelKey as a formField and it won't delve into the array of selected options.
    // For a data-type like a "moment", this can prevent polluting the formstate with lots of unnecessary status objects.
    return;
  }

  formstate.lookup.scopes[id] = true;

  if (Array.isArray(value)) {
    var schemaAndNestedScope = normalizedFormValidationSchema.scopes[rootModelKey];
    var validationSchema = schemaAndNestedScope && schemaAndNestedScope[0];

    for (var i = 0, len = value.length; i < len; i++) {
      var itemKey = (0, _helperFunctions.addScope)(rootModelKey, String(i));

      if ((0, _helperFunctions.hasProp)(validationSchema, 'schemaForEach')) {
        var schemaForEach = validationSchema.schemaForEach;
        normalizeSchemaKeys(schemaForEach, normalizedFormValidationSchema, 'fields', itemKey);
        normalizeSchemaKeys(schemaForEach, normalizedFormValidationSchema, 'scopes', itemKey);
      }

      buildLookup(formstate, itemKey, value[i], normalizedFormValidationSchema);
    }
  } else {
    Object.keys(value).forEach(function (k) {
      var fieldKey = (0, _helperFunctions.addScope)(rootModelKey, k);
      buildLookup(formstate, fieldKey, value[k], normalizedFormValidationSchema);
    });
  }
}

function buildValidationSchemas(formstate, normalizedFormValidationSchema, fieldsOrScopes) {
  Object.keys(normalizedFormValidationSchema[fieldsOrScopes]).forEach(function (rootModelKey) {
    var id = formstate.lookup.idsByRootModelKey[rootModelKey];

    if (!id) {
      throw new Error("The model key \"".concat(rootModelKey, "\" specified under \"").concat(fieldsOrScopes, "\" in the form validation schema passed to initializeFormstate does not correspond to a model key for the initial model."));
    }

    if (formstate.validationSchemas[id]) {
      throw new Error("The model key \"".concat(rootModelKey, "\" can only have one validation schema defined."));
    }

    var _normalizedFormValida = (0, _slicedToArray2["default"])(normalizedFormValidationSchema[fieldsOrScopes][rootModelKey], 2),
        rawSchema = _normalizedFormValida[0],
        nestedScopeKey = _normalizedFormValida[1];

    var schema = buildValidationSchema(rawSchema, rootModelKey, fieldsOrScopes === 'scopes');

    if (Object.keys(schema).length > 0) {
      var nestedScopeId = nestedScopeKey !== '' ? formstate.lookup.idsByRootModelKey[nestedScopeKey] : null;
      formstate.validationSchemas[id] = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, schema), {}, {
        nestedScopeId: nestedScopeId
      });
    }
  });
}

function buildValidationSchema(props, modelKey, isScope) {
  var schema = {}; // required

  if (props.required) {
    schema.required = true;
  }

  if (schema.required) {
    schema.requiredMessage = (0, _helperFunctions.isNonEmptyString)(props.required) ? props.required : "".concat((0, _helperFunctions.humanizeCamelCaseString)((0, _helperFunctions.fieldName)(modelKey)), " is required.");
  } // validate


  if ((0, _helperFunctions.hasProp)(props, 'validate')) {
    if (typeof props.validate === 'function') {
      schema.validate = props.validate;
    } else {
      throw new Error("The \"validate\" prop for model key \"".concat(modelKey, "\" must be a function."));
    }
  } // validateAsync


  if ((0, _helperFunctions.hasProp)(props, 'validateAsync')) {
    if (isScope) {
      if (typeof props.validateAsync !== 'function') {
        throw new Error("The validateAsync property for scope model key \"".concat(modelKey, "\" must specify a validation function and only a function (scope-level async validation is always run \"onSubmit\"), for example, validateAsync: verifyAddress."));
      }

      schema.validateAsync = [props.validateAsync, 'onSubmit'];
    } else {
      if (!Array.isArray(props.validateAsync)) {
        throwAsyncPropsError(modelKey);
      }

      var _props$validateAsync = (0, _slicedToArray2["default"])(props.validateAsync, 2),
          validateAsyncFunction = _props$validateAsync[0],
          whenToRun = _props$validateAsync[1];

      if (typeof validateAsyncFunction !== 'function') {
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
  throw new Error("The validateAsync property for model key \"".concat(modelKey, "\" must be an array specifying the validation function, and when to run the validation (\"onChange\", \"onBlur\", or \"onSubmit\"). For example, validateAsync: [validateUniqueUsername, 'onBlur']."));
}

function createNestedScope(newNestedScopeId, formstate, form) {
  var nestedFormstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    nestedScopeId: newNestedScopeId
  });
  var nestedForm = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, form), {}, {
    parentForm: form
  });

  if (form.getFormstate) {
    nestedForm.getFormstate = function () {
      return (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, form.getFormstate()), {}, {
        nestedScopeId: newNestedScopeId
      });
    };

    nestedForm.setFormstate = function (fsOrFunction) {
      var fs = fsOrFunction;

      if (typeof fsOrFunction === 'function') {
        fs = fsOrFunction((0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, form.getFormstate()), {}, {
          nestedScopeId: newNestedScopeId
        }));
      }

      form.setFormstate((0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, fs), {}, {
        nestedScopeId: null
      }));
    };
  } else {
    nestedForm.setFormstate = function (setFormstateFunction) {
      if (typeof setFormstateFunction !== 'function') {
        throw new Error('Please pass a function to setFormstate, something like: (currentFormstate) => rff.changeAndValidate(currentFormstate, modelKey, value, form)');
      }

      form.setFormstate(function (fs) {
        var updatedFs = setFormstateFunction((0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, fs), {}, {
          nestedScopeId: newNestedScopeId
        }));
        return (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, updatedFs), {}, {
          nestedScopeId: null
        });
      });
    };
  }

  return [nestedFormstate, nestedForm];
}