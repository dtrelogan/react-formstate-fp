import { getRootModelKey } from './schemaAndLookup.js';
import {
  isValid, isInvalid, isChanged, isBlurred, isSubmitting, isSubmitted,
  isWaiting, isAsynclyValidated, getAsyncEndTime, getAsyncError, setSubmitting, setSubmitted
} from './fieldAndScopeStatus.js';



//
// Reading form status
//

export function isFormWaiting(formstate) {
  return Object.keys(formstate.statuses).some(id => {
    const s = formstate.statuses[id];
    return Boolean(s.async.started && !s.async.finished);
  });
}

function _getFormAsyncErrorStatuses(formstate) {
  return Object.keys(formstate.statuses).filter(id => formstate.statuses[id].async.error);
}

export function isFormAsyncError(formstate) {
  return _getFormAsyncErrorStatuses(formstate).length > 0;
}

export function getFormAsyncErrorModelKeys(formstate) {
  return _getFormAsyncErrorStatuses(formstate).map(id => getRootModelKey(formstate, id));
}

export function wasAsyncErrorDuringSubmit(formstate, modelKey) {
  const asyncEnd = getAsyncEndTime(formstate, modelKey);
  const submitStart = getFormSubmissionStartTime(formstate);
  const submitEnd = getFormSubmissionEndTime(formstate);
  return Boolean(submitStart && submitStart < asyncEnd && (!submitEnd || asyncEnd <= submitEnd));
}

export function isInputDisabled(formstate) {
  return formstate.formStatus.inputDisabled;
}

export function isFormSubmitting(formstate) {
  return Boolean(formstate.formStatus.submit.started && !formstate.formStatus.submit.finished);
}

export function isFormSubmittedAndUnchanged(formstate) {
  return isSubmitted({...formstate, nestedScopeId: null}, '');
}

export function getFormSubmissionStartTime(formstate) {
  return formstate.formStatus.submit.started;
}

export function getFormSubmissionEndTime(formstate) {
  return formstate.formStatus.submit.finished;
}

export function getFormSubmissionValidity(formstate) {
  return formstate.formStatus.submit.valid;
}

export function getFormSubmissionAsyncErrorModelKeys(formstate) {
  return formstate.formStatus.submit.asyncErrorModelKeys;
}

export function getFormSubmissionError(formstate) {
  return formstate.formStatus.submit.submissionError;
}

export function getFormSubmissionHistory(formstate) {
  return formstate.formStatus.submitHistory;
}

export function wasSuccessfulSubmit(formstate) {
  return Boolean(!isFormSubmitting(formstate) && getFormSubmissionValidity(formstate) && !getFormSubmissionError(formstate));
}

export function getFormCustomProperty(formstate, name) {
  return formstate.formStatus.custom[name];
}

export function isModelValid(formstate) {
  formstate = {...formstate, nestedScopeId: null};
  return Object.keys(formstate.lookup.idsByRootModelKey).every(rootModelKey => isValid(formstate, rootModelKey));
}

function _true() {return true;}

export function isModelInvalid(formstate) {
  return isPrimedModelInvalid(formstate, _true);
}

export function isPrimedModelInvalid(formstate, calculatePrimed) {
  formstate = {...formstate, nestedScopeId: null};
  return Object.keys(formstate.statuses).some(id => {
    const rootModelKey = getRootModelKey(formstate, id);
    const primed = (calculatePrimed || primeOnChange)(formstate, rootModelKey);
    return isInvalid(formstate, rootModelKey) && primed;
  });
}


// These don't try to be all things to all people because the user can provide their own logic.

export function primeOnChange(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || isChanged(formstate, modelKey);
}

export function primeOnBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || isBlurred(formstate, modelKey);
}

export function primeOnChangeThenBlur(formstate, modelKey) {
  return primeOnSubmit(formstate, modelKey) || (isChanged(formstate, modelKey) && isBlurred(formstate, modelKey));
}

export function primeOnSubmit(formstate, modelKey) {
  if (isSubmitted(formstate, modelKey)) {return true;}
  if (isWaiting(formstate, modelKey) || isAsynclyValidated(formstate, modelKey) || getAsyncError(formstate, modelKey)) {return true;}
  return isSubmitting(formstate, modelKey) && !isFormWaiting(formstate); // Wait until async finishes to show all new results at same time.
}






//
// Modifying form status
//

export function setFormSubmitting(formstate) {
  const formStatus = {...formstate.formStatus};
  formStatus.submit = { started: Date.now() };
  formstate = {...formstate, formStatus};

  // markUnsubmittedStatusesSubmitting adds flexibility for priming.
  // It is relevant even if there is no asynchronous validation.
  return markUnsubmittedStatusesSubmitting(formstate);
}



export function markUnsubmittedStatusesSubmitting(formstate) {
  Object.keys(formstate.lookup.idsByRootModelKey).forEach((rootModelKey) => {
    formstate = setSubmitting(formstate, rootModelKey);
  });
  return formstate;
}


export function setFormSubmitted(formstate) {
  const submit = {...formstate.formStatus.submit, finished: Date.now()};

  if (isModelInvalid(formstate)) {submit.valid = false;}
  else if (isModelValid(formstate)) {submit.valid = true;}
  else {submit.valid = null;}

  // If the user customizes the submit, and decides not to run async validation if the model is syncly invalid,
  // then there could be async errors that didn't technically happen during the submit. To be precise, it's arguably
  // better to filter those out when capturing submit history.

  const asyncErrorModelKeys = getFormAsyncErrorModelKeys(formstate).filter(modelKey => wasAsyncErrorDuringSubmit(formstate, modelKey));
  if (asyncErrorModelKeys.length > 0) {
    submit.asyncErrorModelKeys = asyncErrorModelKeys;
  }

  formstate = {...formstate, formStatus: {...formstate.formStatus, submit}};
  formstate.formStatus.submitHistory = [formstate, ...formstate.formStatus.submitHistory];

  return markAllStatusesSubmitted(formstate);
}



export function markAllStatusesSubmitted(formstate) {
  Object.keys(formstate.lookup.idsByRootModelKey).forEach((rootModelKey) => {
    formstate = setSubmitted(formstate, rootModelKey);
  });
  return formstate;
}


export function setFormSubmissionError(formstate, error) {
  return {...formstate,
    formStatus: {...formstate.formStatus,
      submit: {...formstate.formStatus.submit,
        submissionError: error || new Error('Unknown error.')
      }
    }
  };
}


function _setInputDisabled(formstate, inputDisabled) {
  return {...formstate, formStatus: {...formstate.formStatus, inputDisabled}};
}

export function setInputDisabled(formstate) {
  return _setInputDisabled(formstate, true);
}

export function setInputEnabled(formstate) {
  return _setInputDisabled(formstate, false);
}


export function setFormCustomProperty(formstate, name, value) {
  formstate = {...formstate, formStatus: {...formstate.formStatus, custom: {...formstate.formStatus.custom}}};
  formstate.formStatus.custom[name] = value;
  return formstate;
}
