import { generateQuickGuid, isNonEmptyString, inScope, modelGet, modelAssign } from './helperFunctions.js';
import { convertToRootModelKey, getRootModelKey, getId, isScope } from './schemaAndLookup.js';


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
  const id = getId(formstate, modelKey);
  const status = formstate.statuses[id] || createStatus(getValue(formstate, modelKey));
  return [status, id];
}


function getStatus(formstate, modelKey) {
  return getStatusAndId(formstate, modelKey)[0];
}


function upsertStatus(formstate, id, status, message) {
  if (message !== undefined) {
    status = {...status, message: cleanMessage(message)};
  }
  const statuses = {...formstate.statuses};
  statuses[id] = status;
  return {...formstate, statuses};
}


export function clearStatus(formstate, modelKey) {
  return upsertStatus(formstate, getId(formstate, modelKey), createStatus());
}



//
// reading field/scope status
//

export function getValue(formstate, modelKey) {
  const rootModelKey = convertToRootModelKey(formstate, modelKey);
  return modelGet(formstate.model, rootModelKey);
}

export function getInitialValue(formstate, modelKey) {
  const rootModelKey = convertToRootModelKey(formstate, modelKey);
  return modelGet(formstate.initialModel, rootModelKey, false);
}

export function isSynclyValid(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid === true;
}

export function isSynclyInvalid(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid === false;
}

export function isSynclyValidated(formstate, modelKey) {
  return getStatus(formstate, modelKey).synclyValid !== null;
}

export function isWaiting(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  return Boolean(s.async.started && !s.async.finished);
}

export function isAsynclyValid(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.asynclyValid === true;
}

export function isAsynclyInvalid(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.asynclyValid === false;
}

export function isAsynclyValidated(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  return s.async.asynclyValid === true || s.async.asynclyValid === false;
}

export function getAsyncError(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.error;
}

export function getAsyncToken(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.token;
}

export function getAsyncStartTime(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.started;
}

export function getAsyncEndTime(formstate, modelKey) {
  return getStatus(formstate, modelKey).async.finished;
}


// function getValidity(formstate, modelKey) {
//   if (isInvalid(formstate, modelKey)) {return false;}
//   if (isValid(formstate, modelKey)) {return true;}
//   return null;
// }

export function isValid(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  if (s.synclyValid === false || s.async.asynclyValid === false || Boolean(s.async.error)) {return false;}
  if (s.async.asynclyValid === true) {return true;}
  if (s.synclyValid === true) {return Boolean(!s.async.started || s.async.finished);}
  return false;
}

export function isInvalid(formstate, modelKey) {
  const s = getStatus(formstate, modelKey);
  return s.synclyValid === false || s.async.asynclyValid === false;
}

export function isValidated(formstate, modelKey) {
  return isValid(formstate, modelKey) || isInvalid(formstate, modelKey);
}

export function getMessage(formstate, modelKey) {
  return getStatus(formstate, modelKey).message;
}

export function isChanged(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.changed === true;
}

export function isBlurred(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.blurred === true;
}

export function isSubmitting(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.submitted === 'submitting';
}

export function isSubmitted(formstate, modelKey) {
  return getStatus(formstate, modelKey).touched.submitted === true;
}

export function getCustomProperty(formstate, modelKey, name) {
  return getStatus(formstate, modelKey).custom[name];
}






//
// updating field/scope status
//


export function setValueAndClearStatus(formstate, modelKey, value) {

  const rootModelKey = convertToRootModelKey(formstate, modelKey);

  if (isScope(formstate, getId(formstate, modelKey))) {
    throw new Error(`You cannot set the value for a scope. You can configure "${rootModelKey}" as a field using a validation schema (for something like a multi-select), or you can use addModelKey and deleteModelKey to modify actual scopes.`);
  }

  formstate = clearStatus(formstate, modelKey);

  // Clear all affected scopes too.

  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  Object.keys(formstate.lookup.scopes).forEach(scopeId => {
    const rootScopeKey = getRootModelKey(formstate, scopeId);
    if (inScope(rootModelKey, rootScopeKey)) {
      formstate = clearStatus(formstate, rootScopeKey);
    }
  });

  const model = modelAssign(formstate.model, rootModelKey, value);

  return {...formstate, model, nestedScopeId};
}



function cleanMessage(message) {
  return isNonEmptyString(message) ? message : '';
}

function setValidity(formstate, modelKey, value, message) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  const newStatus = {...status, synclyValid: value};
  return upsertStatus(formstate, id, newStatus, message);
}

export function setNotSynclyValidated(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, null, message);
}

export function setSynclyValid(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, true, message);
}

export function setSynclyInvalid(formstate, modelKey, message) {
  return setValidity(formstate, modelKey, false, message);
}

export const setNotValidated = setNotSynclyValidated;
export const setValid = setSynclyValid;
export const setInvalid = setSynclyInvalid;




export function setAsyncStarted(formstate, modelKey, message) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  const newStatus = {...status, async: {
    token: generateQuickGuid(), started: Date.now(), finished: null, asynclyValid: null
  }};
  return upsertStatus(formstate, id, newStatus, message);
}

export function setPromise(formstate, asyncToken, promise) {
  const promises = {...formstate.formStatus.promises};
  promises[asyncToken] = promise;
  return {...formstate, formStatus: {...formstate.formStatus, promises}};
}

export function clearPromise(formstate, asyncToken) {
  const promises = {...formstate.formStatus.promises};
  delete(promises[asyncToken]);
  return {...formstate, formStatus: {...formstate.formStatus, promises}};
}

export function setAsyncFinished(asyncToken, formstate, modelKey, message, result) {
  formstate = clearPromise(formstate, asyncToken);
  const [status, id] = getStatusAndId(formstate, modelKey);
  if (status.async.token !== asyncToken) {return formstate;}
  const newStatus = {...status, async: {...status.async, finished: Date.now(), ...result}};
  return upsertStatus(formstate, id, newStatus, message);
}

// function setNotAsynclyValidated(formstate, modelKey, message) {
//   const [status, id] = getStatusAndId(formstate, modelKey);
//   const newStatus = {...status, async: {}};
//   return upsertStatus(formstate, id, newStatus, message);
// }

export function setAsynclyValid(asyncToken, formstate, modelKey, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {asynclyValid: true});
}

export function setAsynclyInvalid(asyncToken, formstate, modelKey, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {asynclyValid: false});
}

export function setAsyncError(asyncToken, formstate, modelKey, error, message) {
  return setAsyncFinished(asyncToken, formstate, modelKey, message, {error: error || new Error('Unknown error.')});
}



export function setMessage(formstate, modelKey, message) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  return upsertStatus(formstate, id, status, message || '');
}



export function setTouched(formstate, modelKey, howTouched) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  const newStatus = {...status, touched: {...status.touched}};
  newStatus.touched[howTouched] = true;
  return upsertStatus(formstate, id, newStatus);
}


export function setChanged(formstate, modelKey) {

  formstate = setTouched(formstate, modelKey, 'changed');

  // Set all affected scopes changed too.
  const rootModelKey = convertToRootModelKey(formstate, modelKey);

  // Cannot use a relative model key for scopes above the nested scope...
  const nestedScopeId = formstate.nestedScopeId;
  formstate = {...formstate, nestedScopeId: null};

  Object.keys(formstate.lookup.scopes).forEach(scopeId => {
    const rootScopeKey = getRootModelKey(formstate, scopeId);
    if (inScope(rootModelKey, rootScopeKey)) {
      formstate = setTouched(formstate, rootScopeKey, 'changed');
    }
  });

  return {...formstate, nestedScopeId};
}


export function setBlurred(formstate, modelKey) {
  return setTouched(formstate, modelKey, 'blurred');
}


export function setSubmitting(formstate, modelKey) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  if (status.touched.submitted === true && !status.async.error) {return formstate;}
  const newStatus = {...status, touched: {...status.touched, submitted: 'submitting'}};
  return upsertStatus(formstate, id, newStatus);
}


export function setSubmitted(formstate, modelKey) {
  return setTouched(formstate, modelKey, 'submitted');
}



export function setCustomProperty(formstate, modelKey, name, value) {
  const [status, id] = getStatusAndId(formstate, modelKey);
  const newStatus = {...status, custom: {...status.custom}};
  newStatus.custom[name] = value;
  return upsertStatus(formstate, id, newStatus);
}
