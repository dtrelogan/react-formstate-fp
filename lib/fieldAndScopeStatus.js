"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearStatus = clearStatus;
exports.getValue = getValue;
exports.getInitialValue = getInitialValue;
exports.isSynclyValid = isSynclyValid;
exports.isSynclyInvalid = isSynclyInvalid;
exports.isSynclyValidated = isSynclyValidated;
exports.isWaiting = isWaiting;
exports.isAsynclyValid = isAsynclyValid;
exports.isAsynclyInvalid = isAsynclyInvalid;
exports.isAsynclyValidated = isAsynclyValidated;
exports.getAsyncError = getAsyncError;
exports.getAsyncToken = getAsyncToken;
exports.getAsyncStartTime = getAsyncStartTime;
exports.getAsyncEndTime = getAsyncEndTime;
exports.isValid = isValid;
exports.isInvalid = isInvalid;
exports.isValidated = isValidated;
exports.getMessage = getMessage;
exports.isChanged = isChanged;
exports.isBlurred = isBlurred;
exports.isSubmitting = isSubmitting;
exports.isSubmitted = isSubmitted;
exports.getCustomProperty = getCustomProperty;
exports.setValueAndClearStatus = setValueAndClearStatus;
exports.setNotSynclyValidated = setNotSynclyValidated;
exports.setSynclyValid = setSynclyValid;
exports.setSynclyInvalid = setSynclyInvalid;
exports.setAsyncStarted = setAsyncStarted;
exports.setPromise = setPromise;
exports.clearPromise = clearPromise;
exports.setAsyncFinished = setAsyncFinished;
exports.setAsynclyValid = setAsynclyValid;
exports.setAsynclyInvalid = setAsynclyInvalid;
exports.setAsyncError = setAsyncError;
exports.setMessage = setMessage;
exports.setTouched = setTouched;
exports.setChanged = setChanged;
exports.setBlurred = setBlurred;
exports.setSubmitting = setSubmitting;
exports.setSubmitted = setSubmitted;
exports.setCustomProperty = setCustomProperty;
exports.setInvalid = exports.setValid = exports.setNotValidated = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray.js"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2.js"));

var _helperFunctions = require("./helperFunctions.js");

var _schemaAndLookup = require("./schemaAndLookup.js");

//
// helpers
//
function createStatus() {
  return {
    touched: {},
    synclyValid: null,
    async: {},
    message: '',
    custom: {}
  };
}

function getStatusAndId(formstate, modelKey) {
  var id = (0, _schemaAndLookup.getId)(formstate, modelKey);
  var status = formstate.statuses[id] || createStatus(getValue(formstate, modelKey));
  return [status, id];
}

function getStatus(formstate, modelKey) {
  return getStatusAndId(formstate, modelKey)[0];
}

function upsertStatus(formstate, id, status, message) {
  if (message !== undefined) {
    status = (0, _objectSpread2["default"])({}, status, {
      message: cleanMessage(message)
    });
  }

  var statuses = (0, _objectSpread2["default"])({}, formstate.statuses);
  statuses[id] = status;
  return (0, _objectSpread2["default"])({}, formstate, {
    statuses: statuses
  });
}

function clearStatus(formstate, modelKey) {
  return upsertStatus(formstate, (0, _schemaAndLookup.getId)(formstate, modelKey), createStatus());
} //
// reading field/scope status
//


function getValue(formstate, modelKey) {
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);
  return (0, _helperFunctions.modelGet)(formstate.model, rootModelKey);
}

function getInitialValue(formstate, modelKey) {
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);
  return (0, _helperFunctions.modelGet)(formstate.initialModel, rootModelKey, false);
}

function isSynclyValid(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid === true;
}

function isSynclyInvalid(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid === false;
}

function isSynclyValidated(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid !== null;
}

function isWaiting(formstate, modelKey) {
  var s = getStatus(formstate, modelKey);
  return Boolean(s.async.started && !s.async.finished);
}

function isAsynclyValid(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.asynclyValid === true;
}

function isAsynclyInvalid(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.asynclyValid === false;
}

function isAsynclyValidated(formstate, modelKey) {
  var s = getStatus(formstate, modelKey);
  return s.async.asynclyValid === true || s.async.asynclyValid === false;
}

function getAsyncError(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.error;
}

function getAsyncToken(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.token;
}

function getAsyncStartTime(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.started;
}

function getAsyncEndTime(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.finished;
} // function getValidity(formstate, modelKey) {
//   if (isInvalid(formstate, modelKey)) {return false;}
//   if (isValid(formstate, modelKey)) {return true;}
//   return null;
// }


function isValid(formstate, modelKey) {
  var s = getStatus(formstate, modelKey);

  if (s.synclyValid === false || s.async.asynclyValid === false || Boolean(s.async.error)) {
    return false;
  }

  if (s.async.asynclyValid === true) {
    return true;
  }

  if (s.synclyValid === true) {
    return Boolean(!s.async.started || s.async.finished);
  }

  return false;
}

function isInvalid(formstate, modelKey) {
  var s = getStatus(formstate, modelKey);
  return s.synclyValid === false || s.async.asynclyValid === false;
}

function isValidated(formstate, modelKey) {
  return isValid(formstate, modelKey) || isInvalid(formstate, modelKey);
}

function getMessage(formstate, modelKey) {
  return getStatus(formstate, modelKey).message;
}

function isChanged(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.changed === true;
}

function isBlurred(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.blurred === true;
}

function isSubmitting(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.submitted === 'submitting';
}

function isSubmitted(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.submitted === true;
}

function getCustomProperty(formstate, modelKey, name) {
  return getStatus(formstate, modelKey).custom[name];
} //
// updating field/scope status
//


function setValueAndClearStatus(formstate, modelKey, value) {
  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey);

  if ((0, _schemaAndLookup.isScope)(formstate, (0, _schemaAndLookup.getId)(formstate, modelKey))) {
    throw new Error("You cannot set the value for a scope. You can configure \"".concat(rootModelKey, "\" as a field using a validation schema (for something like a multi-select), or you can use addModelKey and deleteModelKey to modify actual scopes."));
  }

  formstate = clearStatus(formstate, modelKey); // Clear all affected scopes too.
  // Cannot use a relative model key for scopes above the nested scope...

  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  Object.keys(formstate.lookup.scopes).forEach(function (scopeId) {
    var rootScopeKey = (0, _schemaAndLookup.getRootModelKey)(formstate, scopeId);

    if ((0, _helperFunctions.inScope)(rootModelKey, rootScopeKey)) {
      formstate = clearStatus(formstate, rootScopeKey);
    }
  });
  var model = (0, _helperFunctions.modelAssign)(formstate.model, rootModelKey, value);
  return (0, _objectSpread2["default"])({}, formstate, {
    model: model,
    nestedScopeId: nestedScopeId
  });
}

function cleanMessage(message) {
  return (0, _helperFunctions.isNonEmptyString)(message) ? message : '';
}

function setValidity(formstate, modelKey, value, message) {
  var _getStatusAndId = getStatusAndId(formstate, modelKey),
      _getStatusAndId2 = (0, _slicedToArray2["default"])(_getStatusAndId, 2),
      status = _getStatusAndId2[0],
      id = _getStatusAndId2[1];

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    synclyValid: value
  });
  return upsertStatus(formstate, id, newStatus, message);
}

function setNotSynclyValidated(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, null, message);
}

function setSynclyValid(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, true, message);
}

function setSynclyInvalid(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, false, message);
}

var setNotValidated = setNotSynclyValidated;
exports.setNotValidated = setNotValidated;
var setValid = setSynclyValid;
exports.setValid = setValid;
var setInvalid = setSynclyInvalid;
exports.setInvalid = setInvalid;

function setAsyncStarted(formstate, modelKey, message) {
  var _getStatusAndId3 = getStatusAndId(formstate, modelKey),
      _getStatusAndId4 = (0, _slicedToArray2["default"])(_getStatusAndId3, 2),
      status = _getStatusAndId4[0],
      id = _getStatusAndId4[1];

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    async: {
      token: (0, _helperFunctions.generateQuickGuid)(),
      started: Date.now(),
      finished: null,
      asynclyValid: null
    }
  });
  return upsertStatus(formstate, id, newStatus, message);
}

function setPromise(formstate, asyncToken, promise) {
  var promises = (0, _objectSpread2["default"])({}, formstate.formStatus.promises);
  promises[asyncToken] = promise;
  return (0, _objectSpread2["default"])({}, formstate, {
    formStatus: (0, _objectSpread2["default"])({}, formstate.formStatus, {
      promises: promises
    })
  });
}

function clearPromise(formstate, asyncToken) {
  var promises = (0, _objectSpread2["default"])({}, formstate.formStatus.promises);
  delete promises[asyncToken];
  return (0, _objectSpread2["default"])({}, formstate, {
    formStatus: (0, _objectSpread2["default"])({}, formstate.formStatus, {
      promises: promises
    })
  });
}

function setAsyncFinished(asyncToken, formstate, modelKey, message, result) {
  formstate = clearPromise(formstate, asyncToken);

  var _getStatusAndId5 = getStatusAndId(formstate, modelKey),
      _getStatusAndId6 = (0, _slicedToArray2["default"])(_getStatusAndId5, 2),
      status = _getStatusAndId6[0],
      id = _getStatusAndId6[1];

  if (status.async.token !== asyncToken) {
    return formstate;
  }

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    async: (0, _objectSpread2["default"])({}, status.async, {
      finished: Date.now()
    }, result)
  });
  return upsertStatus(formstate, id, newStatus, message);
} // function setNotAsynclyValidated(formstate, modelKey, message) {
//   const [status, id] = getStatusAndId(formstate, modelKey);
//   const newStatus = {...status, async: {}};
//   return upsertStatus(formstate, id, newStatus, message);
// }


function setAsynclyValid(asyncToken, formstate, modelKey, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {
    asynclyValid: true
  });
}

function setAsynclyInvalid(asyncToken, formstate, modelKey, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {
    asynclyValid: false
  });
}

function setAsyncError(asyncToken, formstate, modelKey, error, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {
    error: error || new Error('Unknown error.')
  });
}

function setMessage(formstate, modelKey, message) {
  var _getStatusAndId7 = getStatusAndId(formstate, modelKey),
      _getStatusAndId8 = (0, _slicedToArray2["default"])(_getStatusAndId7, 2),
      status = _getStatusAndId8[0],
      id = _getStatusAndId8[1];

  return upsertStatus(formstate, id, status, message || '');
}

function setTouched(formstate, modelKey, howTouched) {
  var _getStatusAndId9 = getStatusAndId(formstate, modelKey),
      _getStatusAndId10 = (0, _slicedToArray2["default"])(_getStatusAndId9, 2),
      status = _getStatusAndId10[0],
      id = _getStatusAndId10[1];

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    touched: (0, _objectSpread2["default"])({}, status.touched)
  });
  newStatus.touched[howTouched] = true;
  return upsertStatus(formstate, id, newStatus);
}

function setChanged(formstate, modelKey) {
  formstate = setTouched(formstate, modelKey, 'changed'); // Set all affected scopes changed too.

  var rootModelKey = (0, _schemaAndLookup.convertToRootModelKey)(formstate, modelKey); // Cannot use a relative model key for scopes above the nested scope...

  var nestedScopeId = formstate.nestedScopeId;
  formstate = (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: null
  });
  Object.keys(formstate.lookup.scopes).forEach(function (scopeId) {
    var rootScopeKey = (0, _schemaAndLookup.getRootModelKey)(formstate, scopeId);

    if ((0, _helperFunctions.inScope)(rootModelKey, rootScopeKey)) {
      formstate = setTouched(formstate, rootScopeKey, 'changed');
    }
  });
  return (0, _objectSpread2["default"])({}, formstate, {
    nestedScopeId: nestedScopeId
  });
}

function setBlurred(formstate, modelKey) {
  return setTouched(formstate, modelKey, 'blurred');
}

function setSubmitting(formstate, modelKey) {
  var _getStatusAndId11 = getStatusAndId(formstate, modelKey),
      _getStatusAndId12 = (0, _slicedToArray2["default"])(_getStatusAndId11, 2),
      status = _getStatusAndId12[0],
      id = _getStatusAndId12[1];

  if (status.touched.submitted === true && !status.async.error) {
    return formstate;
  }

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    touched: (0, _objectSpread2["default"])({}, status.touched, {
      submitted: 'submitting'
    })
  });
  return upsertStatus(formstate, id, newStatus);
}

function setSubmitted(formstate, modelKey) {
  return setTouched(formstate, modelKey, 'submitted');
}

function setCustomProperty(formstate, modelKey, name, value) {
  var _getStatusAndId13 = getStatusAndId(formstate, modelKey),
      _getStatusAndId14 = (0, _slicedToArray2["default"])(_getStatusAndId13, 2),
      status = _getStatusAndId14[0],
      id = _getStatusAndId14[1];

  var newStatus = (0, _objectSpread2["default"])({}, status, {
    custom: (0, _objectSpread2["default"])({}, status.custom)
  });
  newStatus.custom[name] = value;
  return upsertStatus(formstate, id, newStatus);
}