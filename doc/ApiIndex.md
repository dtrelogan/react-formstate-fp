# API index

## Building formstate

function initializeFormstate(initialModel, formValidationSchema = {})  


## Querying formstate

### Querying the model

function getValue(formstate, modelKey)  
function getInitialValue(formstate, modelKey)  

### Querying key/id lookup

function getRootModelKey(formstate, id)  
function getModelKey(formstate, id)  
function getId(formstate, modelKey)  
function isScope(formstate, id)  

### Querying the validation schema

function isRequired(formstate, id, form)  

### Querying (aggregate) form status

- Validity  
function isModelValid(formstate)  
function isModelInvalid(formstate)  
function isPrimedModelInvalid(formstate, calculatePrimed)  

- Asynchronous status  
function isFormWaiting(formstate)  
function isFormAsyncError(formstate)  
function getFormAsyncErrorModelKeys(formstate)  
function wasAsyncErrorDuringSubmit(formstate, modelKey)  

- Submission status  
function isFormSubmitting(formstate)  
function isFormSubmittedAndUnchanged(formstate)  
function getFormSubmissionStartTime(formstate)  
function getFormSubmissionEndTime(formstate)  
function getFormSubmissionValidity(formstate)  
function getFormSubmissionAsyncErrorModelKeys(formstate)  
function getFormSubmissionError(formstate)  
function getFormSubmissionHistory(formstate)  
function wasSuccessfulSubmit(formstate)  

- Other  
function isInputDisabled(formstate)  
function getFormCustomProperty(formstate, name)  

### Querying field and scope status

- Synchronous/asynchronous validity  
function isValid(formstate, modelKey)  
function isInvalid(formstate, modelKey)  
function isValidated(formstate, modelKey)  

- Synchronous validity  
function isSynclyValid(formstate, modelKey)  
function isSynclyInvalid(formstate, modelKey)  
function isSynclyValidated(formstate, modelKey)  

- Asynchronous validity  
function isWaiting(formstate, modelKey)  
function isAsynclyValid(formstate, modelKey)  
function isAsynclyInvalid(formstate, modelKey)  
function isAsynclyValidated(formstate, modelKey)  
function getAsyncError(formstate, modelKey)  
function getAsyncToken(formstate, modelKey)  
function getAsyncStartTime(formstate, modelKey)  
function getAsyncEndTime(formstate, modelKey)  

- Touched/Primed  
function isChanged(formstate, modelKey)  
function isBlurred(formstate, modelKey)  
function isSubmitting(formstate, modelKey)  
function isSubmitted(formstate, modelKey)  
function primeOnChange(formstate, modelKey)  
function primeOnBlur(formstate, modelKey)  
function primeOnChangeThenBlur(formstate, modelKey)  
function primeOnSubmit(formstate, modelKey)  

- Other  
function getMessage(formstate, modelKey)  
function getCustomProperty(formstate, modelKey, name)  




## Updating formstate

### Updating the model

function setValueAndClearStatus(formstate, modelKey, value)  
function addModelKey(formstate, modelKey, initialModel, formValidationSchema = {})  
function deleteModelKey(formstate, modelKey)  
function deleteModelKeyAndValidateParentScope(formstate, modelKey, form)  

### Updating (aggregate) form status

function setFormSubmitting(formstate)  
function setFormSubmitted(formstate)  
function setInputDisabled(formstate)  
function setInputEnabled(formstate)  
function setFormCustomProperty(formstate, name, value)  

### Updating field and scope status

- Synchronous validity  
function setNotSynclyValidated(formstate, modelKey, message)  
function setSynclyValid(formstate, modelKey, message)  
function setSynclyInvalid(formstate, modelKey, message)  
function setNotValidated(formstate, modelKey, message)  
function setValid(formstate, modelKey, message)  
function setInvalid(formstate, modelKey, message)  

- Asynchronous validity  
function setAsyncStarted(formstate, modelKey, message)  
function setAsynclyValid(asyncToken, formstate, modelKey, message)  
function setAsynclyInvalid(asyncToken, formstate, modelKey, message)  
function setAsyncError(asyncToken, formstate, modelKey, error, message)  

- Touched  
function setChanged(formstate, modelKey)  
function setBlurred(formstate, modelKey)  
function setSubmitting(formstate, modelKey)  
function setSubmitted(formstate, modelKey)  

- Other  
function setMessage(formstate, modelKey, message)  
function setCustomProperty(formstate, modelKey, name, value)  

*setNotValidated, setValid, and setInvalid are aliases for setNotSynclyValidated, setSynclyValid, setSynclyInvalid*  
*setValueAndClearStatus clears all enclosing scopes too.*  
*setChanged marks all enclosing scopes changed too.*  


## Binding formstate

### onChange and onBlur

function changeAndValidate(formstate, modelKey, value, form)  
function synclyValidate(formstate, modelKey, form)  
function asynclyValidate(formstate, modelKey, form)  
function handleChange(form, value, id)  
function handleBlur(form, id)  

### onSubmit

function startFormSubmission(formstate)  
function synclyValidateForm(formstate, form)  
function validateForm(formstate, form)  
function asynclyValidateForm(formstate, form)  
function getPromises(formstate)  
function setFormSubmissionError(formstate, error)  
function cancelFormSubmission(formstate)  
function cancelFormSubmissionKeepInputDisabled(formstate)  
function driveFormSubmission(form, submitValidModel)  

*validateForm is an alias for synclyValidateForm*  
*cancelFormSubmissionKeepInputDisabled is an alias for setFormSubmitted*  
*startFormSubmission calls setFormSubmitting and setInputDisabled*  
*cancelFormSubmission calls setFormSubmitted and setInputEnabled*  

### React integration

useFormstate  
bindToSetStateComponent  
FormScope  
FormField  
