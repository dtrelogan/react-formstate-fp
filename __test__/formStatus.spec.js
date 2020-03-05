import { rff } from '../lib/index.js';

describe('isFormWaiting', () => {
  test('it returns true if any fields or scopes are waiting', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isFormWaiting(fs)).toBe(false);
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.isFormWaiting(fs)).toBe(true);
  });
});

describe('isFormAsyncError', () => {
  test('it returns true if any fields or scopes have async errors', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isFormAsyncError(fs)).toBe(false);
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.isFormAsyncError(fs)).toBe(true);
  });
});

describe('getFormAsyncErrorModelKeys', () => {
  test('it returns the model keys of any fields or scopes that have async errors', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.getFormAsyncErrorModelKeys(fs)).toStrictEqual([]);
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.getFormAsyncErrorModelKeys(fs)).toStrictEqual(['a']);
  });
});

describe('wasAsyncErrorDuringSubmit', () => {
  test('it returns false if the async error was not during a submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.wasAsyncErrorDuringSubmit(fs, 'a')).toBe(false);
  });
  test('it returns false if the async error was before a submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    fs = rff.setFormSubmitting(fs);
    expect(rff.wasAsyncErrorDuringSubmit(fs, 'a')).toBe(false);
  });
  test('it returns true if the async error is during an unfinished submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    fs.statuses[rff.getId(fs, 'a')].async.finished += 1;
    expect(rff.wasAsyncErrorDuringSubmit(fs, 'a')).toBe(true);
  });
  test('it returns true if the async error was during a submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    fs = rff.setFormSubmitted(fs);
    fs.statuses[rff.getId(fs, 'a')].async.finished += 1;
    fs.formStatus.submit.finished += 1;
    expect(rff.wasAsyncErrorDuringSubmit(fs, 'a')).toBe(true);
  });
});

describe('setInputDisabled', () => {
  test('it sets the input disabled flag', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isInputDisabled(fs)).toBe(false);
    fs = rff.setInputDisabled(fs);
    expect(rff.isInputDisabled(fs)).toBe(true);
  });
});

describe('setInputEnabled', () => {
  test('it unsets the input disabled flag', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setInputDisabled(fs);
    expect(rff.isInputDisabled(fs)).toBe(true);
    fs = rff.setInputEnabled(fs);
    expect(rff.isInputDisabled(fs)).toBe(false);
  });
});

describe('setFormSubmitting', () => {
  test('it puts the form into submitting status', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isFormSubmitting(fs)).toBe(false);
    expect(rff.isSubmitting(fs, '')).toBe(false);
    expect(rff.isSubmitting(fs, 'a')).toBe(false);
    expect(rff.getFormSubmissionStartTime(fs)).toBe(undefined);
    const before = Date.now();
    fs = rff.setFormSubmitting(fs);
    expect(rff.isFormSubmitting(fs)).toBe(true);
    expect(rff.isSubmitting(fs, '')).toBe(true);
    expect(rff.isSubmitting(fs, 'a')).toBe(true);
    expect(rff.isFormSubmittedAndUnchanged(fs)).toBe(false);
    expect(rff.isSubmitted(fs, '')).toBe(false);
    expect(rff.isSubmitted(fs, 'a')).toBe(false);
    expect(rff.getFormSubmissionStartTime(fs)).toBeGreaterThanOrEqual(before);
    expect(rff.getFormSubmissionEndTime(fs)).toBe(undefined);
    expect(rff.getFormSubmissionValidity(fs)).toBe(undefined);
    expect(rff.getFormSubmissionAsyncErrorModelKeys(fs)).toBe(undefined);
    expect(rff.getFormSubmissionError(fs)).toBe(undefined);
    expect(rff.getFormSubmissionHistory(fs)).toStrictEqual([]);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
  });
});

describe('setFormSubmitted', () => {
  test('it puts the form into submitted status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setFormSubmitted(fs);
    expect(rff.isFormSubmitting(fs)).toBe(false);
    expect(rff.isSubmitting(fs, '')).toBe(false);
    expect(rff.isSubmitting(fs, 'a')).toBe(false);
    expect(rff.isFormSubmittedAndUnchanged(fs)).toBe(true);
    expect(rff.isSubmitted(fs, '')).toBe(true);
    expect(rff.isSubmitted(fs, 'a')).toBe(true);
    expect(rff.getFormSubmissionEndTime(fs)).toBeGreaterThanOrEqual(rff.getFormSubmissionStartTime(fs));
    expect(rff.getFormSubmissionValidity(fs)).toBe(null);
    expect(rff.getFormSubmissionAsyncErrorModelKeys(fs)).toBe(undefined);
    expect(rff.getFormSubmissionError(fs)).toBe(undefined);
    expect(rff.getFormSubmissionHistory(fs).length).toStrictEqual(1);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
  });
  test('it captures valid status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setValid(fs, '', '');
    fs = rff.setValid(fs, 'a', '');
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionValidity(fs)).toBe(true);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(true);
  });
  test('it captures invalid status', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setInvalid(fs, 'a', '');
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionValidity(fs)).toBe(false);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
  });
  test('it captures async error model keys', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs.statuses[rff.getId(fs, 'a')].async.started -= 10;
    fs = rff.setFormSubmitting(fs);
    fs.formStatus.submit.started -= 5;
    fs = rff.setAsyncStarted(fs, '', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, ''), fs, '', new Error('123'), '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('456'), '');
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionValidity(fs)).toBe(null);
    expect(rff.getFormSubmissionAsyncErrorModelKeys(fs).length).toBe(2);
    expect(rff.getFormSubmissionError(fs)).toBe(undefined);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
  });
  test('it does not capture async error model key that happened before the submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('456'), '');
    fs = rff.setFormSubmitting(fs);
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionValidity(fs)).toBe(null);
    expect(rff.getFormSubmissionAsyncErrorModelKeys(fs)).toBe(undefined);
    expect(rff.getFormSubmissionError(fs)).toBe(undefined);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
  });
});

describe('setFormSubmissionError', () => {
  test('it stores an error that occurs during a submit', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setValid(fs, '', '');
    fs = rff.setValid(fs, 'a', '');
    fs = rff.setFormSubmissionError(fs, new Error('123'));
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionEndTime(fs)).toBeGreaterThanOrEqual(rff.getFormSubmissionStartTime(fs));
    expect(rff.getFormSubmissionValidity(fs)).toBe(true);
    expect(rff.getFormSubmissionAsyncErrorModelKeys(fs)).toBe(undefined);
    expect(rff.getFormSubmissionError(fs).message).toBe('123');
    expect(rff.getFormSubmissionHistory(fs).length).toStrictEqual(1);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(false);
    expect(rff.isFormSubmittedAndUnchanged(fs)).toBe(true);
  });
  test('it stores a default error if none provided', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmissionError(fs);
    expect(rff.getFormSubmissionError(fs).message).toBe('Unknown error.');
  });
});

describe('isFormSubmittedAndUnchanged', () => {
  test('it returns whether the form is submitted and unchanged', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormSubmitting(fs);
    fs = rff.setValid(fs, '', '');
    fs = rff.setValid(fs, 'a', '');
    fs = rff.setFormSubmitted(fs);
    expect(rff.getFormSubmissionValidity(fs)).toBe(true);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(true);
    expect(rff.isFormSubmittedAndUnchanged(fs)).toBe(true);
    fs = rff.setValueAndClearStatus(fs, 'a', 2);
    expect(rff.wasSuccessfulSubmit(fs)).toBe(true);
    expect(rff.isFormSubmittedAndUnchanged(fs)).toBe(false);
  });
});

describe('setFormCustomProperty', () => {
  test('it sets a custom property on the form', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setFormCustomProperty(fs, 'hello', 'there');
    expect(rff.getFormCustomProperty(fs, 'hello')).toBe('there');
    fs = rff.setValueAndClearStatus(fs, 'a', 2);
    expect(rff.getFormCustomProperty(fs, 'hello')).toBe('there');
  });
});

describe('isModelValid', () => {
  test('it returns true if all fields and scopes are valid', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isModelValid(fs)).toBe(false);
    fs = rff.setValid(fs, '');
    expect(rff.isModelValid(fs)).toBe(false);
    fs = rff.setValid(fs, 'a');
    expect(rff.isModelValid(fs)).toBe(true);
  });
});

describe('isModelInvalid', () => {
  test('it returns true if any fields and scopes are invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isModelInvalid(fs)).toBe(false);
    fs = rff.setInvalid(fs, '');
    expect(rff.isModelInvalid(fs)).toBe(true);
  });
});

describe('isPrimedModelInvalid', () => {
  test('it returns true if any primed fields and scopes are invalid', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.isPrimedModelInvalid(fs, rff.primeOnChange)).toBe(false);
    fs = rff.setInvalid(fs, '');
    expect(rff.isPrimedModelInvalid(fs, rff.primeOnChange)).toBe(false);
    fs = rff.setChanged(fs, '');
    expect(rff.isPrimedModelInvalid(fs, rff.primeOnChange)).toBe(true);
    expect(rff.isPrimedModelInvalid(fs)).toBe(true);
  });
});

describe('primeOnSubmit', () => {
  test('it returns false by default', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.primeOnSubmit(fs, 'a')).toBe(false);
  });
  test('it returns true if the field is submitted', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is waiting', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is asyncly validated', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsynclyValid(rff.getAsyncToken(fs, 'a'), fs, 'a', '');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(true);
  });
  test('it returns true if the field had an async error', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setAsyncStarted(fs, 'a', '');
    fs = rff.setAsyncError(rff.getAsyncToken(fs, 'a'), fs, 'a', new Error('123'), '');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is submitting but not waiting', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitting(fs, 'a', '');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(true);
    fs = rff.setAsyncStarted(fs, '', '');
    expect(rff.primeOnSubmit(fs, 'a')).toBe(false);
  });
});

describe('primeOnChange', () => {
  test('it returns false by default', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.primeOnChange(fs, 'a')).toBe(false);
  });
  test('it returns true if the field is changed', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setChanged(fs, 'a');
    expect(rff.primeOnChange(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is submitted', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    expect(rff.primeOnChange(fs, 'a')).toBe(true);
  });
});

describe('primeOnBlur', () => {
  test('it returns false by default', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.primeOnBlur(fs, 'a')).toBe(false);
  });
  test('it returns true if the field is blurred', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setBlurred(fs, 'a');
    expect(rff.primeOnBlur(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is submitted', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    expect(rff.primeOnBlur(fs, 'a')).toBe(true);
  });
});

describe('primeOnChangeThenBlur', () => {
  test('it returns false by default', () => {
    let fs = rff.initializeFormstate({a: 1});
    expect(rff.primeOnChangeThenBlur(fs, 'a')).toBe(false);
  });
  test('it returns false if the field is blurred', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setBlurred(fs, 'a');
    expect(rff.primeOnChangeThenBlur(fs, 'a')).toBe(false);
  });
  test('it returns false if the field is changed', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setChanged(fs, 'a');
    expect(rff.primeOnChangeThenBlur(fs, 'a')).toBe(false);
  });
  test('it returns true if the field is changed and blurred', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setChanged(fs, 'a');
    fs = rff.setBlurred(fs, 'a');
    expect(rff.primeOnChangeThenBlur(fs, 'a')).toBe(true);
  });
  test('it returns true if the field is submitted', () => {
    let fs = rff.initializeFormstate({a: 1});
    fs = rff.setSubmitted(fs, 'a');
    expect(rff.primeOnChangeThenBlur(fs, 'a')).toBe(true);
  });
});
