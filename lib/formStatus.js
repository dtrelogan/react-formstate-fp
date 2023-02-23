"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFormAsyncErrorModelKeys = getFormAsyncErrorModelKeys;
exports.getFormCustomProperty = getFormCustomProperty;
exports.getFormSubmissionAsyncErrorModelKeys = getFormSubmissionAsyncErrorModelKeys;
exports.getFormSubmissionEndTime = getFormSubmissionEndTime;
exports.getFormSubmissionError = getFormSubmissionError;
exports.getFormSubmissionHistory = getFormSubmissionHistory;
exports.getFormSubmissionStartTime = getFormSubmissionStartTime;
exports.getFormSubmissionValidity = getFormSubmissionValidity;
exports.isFormAsyncError = isFormAsyncError;
exports.isFormSubmittedAndUnchanged = isFormSubmittedAndUnchanged;
exports.isFormSubmitting = isFormSubmitting;
exports.isFormWaiting = isFormWaiting;
exports.isInputDisabled = isInputDisabled;
exports.isModelInvalid = isModelInvalid;
exports.isModelValid = isModelValid;
exports.isPrimedModelInvalid = isPrimedModelInvalid;
exports.markAllStatusesSubmitted = markAllStatusesSubmitted;
exports.markUnsubmittedStatusesSubmitting = markUnsubmittedStatusesSubmitting;
exports.primeOnBlur = primeOnBlur;
exports.primeOnChange = primeOnChange;
exports.primeOnChangeThenBlur = primeOnChangeThenBlur;
exports.primeOnSubmit = primeOnSubmit;
exports.setFormCustomProperty = setFormCustomProperty;
exports.setFormSubmissionError = setFormSubmissionError;
exports.setFormSubmitted = setFormSubmitted;
exports.setFormSubmitting = setFormSubmitting;
exports.setInputDisabled = setInputDisabled;
exports.setInputEnabled = setInputEnabled;
exports.wasAsyncErrorDuringSubmit = wasAsyncErrorDuringSubmit;
exports.wasSuccessfulSubmit = wasSuccessfulSubmit;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _schemaAndLookup = require("./schemaAndLookup.js");

var _fieldAndScopeStatus = require("./fieldAndScopeStatus.js");

//
// Reading form status
//
function isFormWaiting(formstate) {
  return Object.keys(formstate.statuses).some(function (id) {
    var s = formstate.statuses[id];
    return Boolean(s.async.started && !s.async.finished);
  });
}

function _getFormAsyncErrorStatuses(formstate) {
  return Object.keys(formstate.statuses).filter(function (id) {
    return formstate.statuses[id].async.error;
  });
}

function isFormAsyncError(formstate) {
  return _getFormAsyncErrorStatuses(formstate).length > 0;
}

function getFormAsyncErrorModelKeys(formstate) {
  return _getFormAsyncErrorStatuses(formstate).map(function (id) {
    return (0, _schemaAndLookup.getRootModelKey)(formstate, id);
  });
}

function wasAsyncErrorDuringSubmit(formstate, modelKey) {
  var asyncEnd = (0, _fieldAndScopeStatus.getAsyncEndTime)(formstate, modelKey);
  var submitStart = getFormSubmissionStartTime(formstate);
  var submitEnd = getFormSubmissionEndTime(formstate);
  return Boolean(submitStart && submitStart < asyncEnd && (!submitEnd || asyncEnd <= submitEnd));
}

function isInputDisabled(formstate) {
  return formstate.formStatus.inputDisabled;
}

function isFormSubmitting(formstate) {
  return Boolean(formstate.formStatus.submit.started && !formstate.formStatus.submit.finished);
}

function isFormSubmittedAndUnchanged(formstate) {
  return (0, _fieldAndScopeStatus.isSubmitted)((0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    nestedScopeId: null
  }), '');
}

function getFormSubmissionStartTime(formstate) {
  return formstate.formStatus.submit.started;
}

function getFormSubmissionEndTime(formstate) {
  return formstate.formStatus.submit.finished;
}

function getFormSubmissionValidity(formstate) {
  return formstate.formStatus.submit.valid;
}

function getFormSubmissionAsyncErrorModelKeys(formstate) {
  return formstate.formStatus.submit.asyncErrorModelKeys;
}

function getFormSubmissionError(formstate) {
  return formstate.formStatus.submit.submissionError;
}

function getFormSubmissionHistory(formstate) {
  return formstate.formStatus.submitHistory;
}

function wasSuccessfulSubmit(formstate) {
  return Boolean(!isFormSubmitting(formstate) && getFormSubmissionValidity(formstate) && !getFormSubmissionError(formstate));
}

function getFormCustomProperty(formstate, name) {
  return formstate.formStatus.custom[name];
}

function isModelValid(formstate) {
  formstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    nestedScopeId: null
  });
  return Object.keys(formstate.lookup.idsByRootModelKey).every(function (rootModelKey) {
    return (0, _fieldAndScopeStatus.isValid)(formstate, rootModelKey);
  });
}

function _true() {
  return true;
}

function isModelInvalid(formstate) {
  return isPrimedModelInvalid(formstate, _true);
}

function isPrimedModelInvalid(formstate, calculatePrimed) {
  formstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    nestedScopeId: null
  });
  return Object.keys(formstate.statuses).some(function (id) {
    var rootModelKey = (0, _schemaAndLookup.getRootModelKey)(formstate, id);
    var primed = (calculatePrimed || primeOnChange)(formstate, rootModelKey);
    return (0, _fieldAndScopeStatus.isInvalid)(formstate, rootModelKey) && primed;
  });
} // These don't try to be all things to all people because the user can provide their own logic.


function primeOnChange(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || (0, _fieldAndScopeStatus.isChanged)(formstate, modelKey);
}

function primeOnBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || (0, _fieldAndScopeStatus.isBlurred)(formstate, modelKey);
}

function primeOnChangeThenBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || (0, _fieldAndScopeStatus.isChanged)(formstate, modelKey) && (0, _fieldAndScopeStatus.isBlurred)(formstate, modelKey);
}

function primeOnSubmit(formstate, modelKey) {
  if ((0, _fieldAndScopeStatus.isSubmitted)(formstate, modelKey)) {
    return true;
  }

  if ((0, _fieldAndScopeStatus.isWaiting)(formstate, modelKey) || (0, _fieldAndScopeStatus.isAsynclyValidated)(formstate, modelKey) || (0, _fieldAndScopeStatus.getAsyncError)(formstate, modelKey)) {
    return true;
  }

  return (0, _fieldAndScopeStatus.isSubmitting)(formstate, modelKey) && !isFormWaiting(formstate); // Wait until async finishes to show all new results at same time.
} //
// Modifying form status
//


function setFormSubmitting(formstate) {
  var formStatus = (0, _objectSpread2["default"])({}, formstate.formStatus);
  formStatus.submit = {
    started: Date.now()
  };
  formstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    formStatus: formStatus
  }); // markUnsubmittedStatusesSubmitting adds flexibility for priming.
  // It is relevant even if there is no asynchronous validation.

  return markUnsubmittedStatusesSubmitting(formstate);
}

function markUnsubmittedStatusesSubmitting(formstate) {
  Object.keys(formstate.lookup.idsByRootModelKey).forEach(function (rootModelKey) {
    formstate = (0, _fieldAndScopeStatus.setSubmitting)(formstate, rootModelKey);
  });
  return formstate;
}

function setFormSubmitted(formstate) {
  var submit = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus.submit), {}, {
    finished: Date.now()
  });

  if (isModelInvalid(formstate)) {
    submit.valid = false;
  } else if (isModelValid(formstate)) {
    submit.valid = true;
  } else {
    submit.valid = null;
  } // If the user customizes the submit, and decides not to run async validation if the model is syncly invalid,
  // then there could be async errors that didn't technically happen during the submit. To be precise, it's arguably
  // better to filter those out when capturing submit history.


  var asyncErrorModelKeys = getFormAsyncErrorModelKeys(formstate).filter(function (modelKey) {
    return wasAsyncErrorDuringSubmit(formstate, modelKey);
  });

  if (asyncErrorModelKeys.length > 0) {
    submit.asyncErrorModelKeys = asyncErrorModelKeys;
  }

  formstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    formStatus: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus), {}, {
      submit: submit
    })
  });
  formstate.formStatus.submitHistory = [formstate].concat((0, _toConsumableArray2["default"])(formstate.formStatus.submitHistory));
  return markAllStatusesSubmitted(formstate);
}

function markAllStatusesSubmitted(formstate) {
  Object.keys(formstate.lookup.idsByRootModelKey).forEach(function (rootModelKey) {
    formstate = (0, _fieldAndScopeStatus.setSubmitted)(formstate, rootModelKey);
  });
  return formstate;
}

function setFormSubmissionError(formstate, error) {
  return (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    formStatus: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus), {}, {
      submit: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus.submit), {}, {
        submissionError: error || new Error('Unknown error.')
      })
    })
  });
}

function _setInputDisabled(formstate, inputDisabled) {
  return (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    formStatus: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus), {}, {
      inputDisabled: inputDisabled
    })
  });
}

function setInputDisabled(formstate) {
  return _setInputDisabled(formstate, true);
}

function setInputEnabled(formstate) {
  return _setInputDisabled(formstate, false);
}

function setFormCustomProperty(formstate, name, value) {
  formstate = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate), {}, {
    formStatus: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, formstate.formStatus), {}, {
      custom: (0, _objectSpread2["default"])({}, formstate.formStatus.custom)
    })
  });
  formstate.formStatus.custom[name] = value;
  return formstate;
}