import {
  getRootModelKey,
  getModelKey,
  getId,
  isScope,
  isRequired,
  initializeFormstate
} from './schemaAndLookup.js';


import {
  getValue,
  getInitialValue,
  isSynclyValid,
  isSynclyInvalid,
  isSynclyValidated,
  isWaiting,
  isAsynclyValid,
  isAsynclyInvalid,
  isAsynclyValidated,
  getAsyncError,
  getAsyncToken,
  getAsyncStartTime,
  getAsyncEndTime,
  isValid,
  isInvalid,
  isValidated,
  getMessage,
  isChanged,
  isBlurred,
  isSubmitting,
  isSubmitted,
  getCustomProperty,
  setValueAndClearStatus,
  setNotSynclyValidated,
  setSynclyValid,
  setSynclyInvalid,
  setNotValidated,
  setValid,
  setInvalid,
  setAsyncStarted,
  setAsynclyValid,
  setAsynclyInvalid,
  setAsyncError,
  setMessage,
  setChanged,
  setBlurred,
  setSubmitting,
  setSubmitted,
  setCustomProperty
} from './fieldAndScopeStatus.js';


import {
  isFormWaiting,
  isFormAsyncError,
  getFormAsyncErrorModelKeys,
  wasAsyncErrorDuringSubmit,
  isInputDisabled,
  isFormSubmitting,
  isFormSubmittedAndUnchanged,
  getFormSubmissionStartTime,
  getFormSubmissionEndTime,
  getFormSubmissionValidity,
  getFormSubmissionAsyncErrorModelKeys,
  getFormSubmissionError,
  getFormSubmissionHistory,
  wasSuccessfulSubmit,
  getFormCustomProperty,
  isModelValid,
  isModelInvalid,
  isPrimedModelInvalid,
  primeOnChange,
  primeOnBlur,
  primeOnChangeThenBlur,
  primeOnSubmit,
  setFormSubmitting,
  setFormSubmitted,
  setFormSubmissionError,
  setInputDisabled,
  setInputEnabled,
  setFormCustomProperty
} from './formStatus.js';


import {
  synclyValidate,
  synclyValidateForm,
  asynclyValidate,
  asynclyValidateForm,
  getPromises,
  changeAndValidate,
  handleChange,
  handleBlur,
  startFormSubmission,
  cancelFormSubmission,
  driveFormSubmission,
  addModelKey,
  deleteModelKey,
  deleteModelKeyAndValidateParentScope
} from './validationAndEventHandlers.js';


import {
  createRffAdaptor,
  createRffNestedFormAdaptor,
  useFormstate,
  bindToSetStateComponent,
  FormScope,
  FormField
} from './reactComponents.js';




const rff = {
  initializeFormstate,
  getRootModelKey,
  getModelKey,
  getId,
  isScope,
  isRequired,
  isFormWaiting,
  isFormAsyncError,
  getFormAsyncErrorModelKeys,
  isInputDisabled,
  isFormSubmitting,
  isFormSubmittedAndUnchanged,
  getFormSubmissionStartTime,
  getFormSubmissionEndTime,
  getFormSubmissionValidity,
  getFormSubmissionAsyncErrorModelKeys,
  getFormSubmissionError,
  getFormSubmissionHistory,
  wasSuccessfulSubmit,
  getFormCustomProperty,
  isModelValid,
  isModelInvalid,
  isPrimedModelInvalid,
  getValue,
  getInitialValue,
  isValid,
  isInvalid,
  isValidated,
  isSynclyValid,
  isSynclyInvalid,
  isSynclyValidated,
  isAsynclyValid,
  isAsynclyInvalid,
  isAsynclyValidated,
  isWaiting,
  getAsyncToken,
  getAsyncStartTime,
  getAsyncEndTime,
  getAsyncError,
  wasAsyncErrorDuringSubmit,
  getMessage,
  isChanged,
  isBlurred,
  isSubmitting,
  isSubmitted,
  getCustomProperty,
  primeOnChange,
  primeOnBlur,
  primeOnChangeThenBlur,
  primeOnSubmit,
  setFormSubmitting,
  setFormSubmissionError,
  setFormSubmitted,
  setInputDisabled,
  setInputEnabled,
  setFormCustomProperty,
  setValueAndClearStatus,
  setValid,
  setInvalid,
  setNotValidated,
  setSynclyValid,
  setSynclyInvalid,
  setNotSynclyValidated,
  setAsyncStarted,
  setAsynclyValid,
  setAsynclyInvalid,
  setAsyncError,
  setMessage,
  setChanged,
  setBlurred,
  setSubmitting,
  setSubmitted,
  setCustomProperty,
  synclyValidate,
  synclyValidateForm,
  validateForm: synclyValidateForm,
  asynclyValidate,
  asynclyValidateForm,
  getPromises,
  changeAndValidate,
  handleChange,
  handleBlur,
  startFormSubmission,
  cancelFormSubmission,
  cancelFormSubmissionKeepInputDisabled: setFormSubmitted,
  driveFormSubmission,
  addModelKey,
  deleteModelKey,
  deleteModelKeyAndValidateParentScope,
  bindToSetStateComponent
};


export { useFormstate, FormScope, FormField, createRffAdaptor, createRffNestedFormAdaptor, rff };
