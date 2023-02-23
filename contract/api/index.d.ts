import type { CalculatePrimed, Options, Form } from '../core/Form';
import type { Formstate } from '../core/Formstate';
import type { AsyncToken, AsyncValidationFunction, FormValidationSchema, ValidationFunction } from '../core/FormValidationSchema';
import type { Component, PropsWithChildren, ReactElement } from 'react';

//
//
// Supporting Types
//
//

export { CalculatePrimed, Options, Form } from '../core/Form';

export { Formstate } from '../core/Formstate';

export {
    AsyncToken, AsyncWhen, ValidationFunction, AsyncValidationFunction, FieldValidationSchema,
    ScopeValidationSchema, FieldValidationSchemaMap, ScopeValidationSchemaMap, FormValidationSchema
} from '../core/FormValidationSchema';

export interface SubmitValidModel<Model>
{
    (model: Model, form: Form<Model>): void;
}

//
//
// The main API interface
// 
// Bundled into an rff object (below) so that you don't have to import 25 functions into every module
// where you use react-formstate-fp.
//
// The downside of doing this is code size, when downloading to web browsers. I think I got a bit
// careless in terms of bundling nearly everything in here. Some of these functions can certainly
// be extracted and moved elsewhere.
//
//

export interface Rff
{
    readonly initializeFormstate: <Model>(
        initialModel: Model,
        formValidationSchema?: FormValidationSchema<Model>
    ) => Formstate<Model>;

    //
    // Schema/Lookup
    //

    readonly getRootModelKey: <Model>(formstate: Formstate<Model>, id: number) => string;
    readonly getModelKey: <Model>(formstate: Formstate<Model>, id: number) => string;
    readonly getId: <Model>(formstate: Formstate<Model>, modelKey: string) => number;
    readonly isScope: <Model>(formstate: Formstate<Model>, id: number) => boolean;
    readonly isRequired: <Model>(formstate: Formstate<Model>, id: number, form: Form<Model>) => boolean;

    //
    // Form Status
    //

    // async

    readonly isFormWaiting: <Model>(formstate: Formstate<Model>) => boolean;
    readonly isFormAsyncError: <Model>(formstate: Formstate<Model>) => boolean;
    readonly getFormAsyncErrorModelKeys: <Model>(formstate: Formstate<Model>) => readonly string[];

    // submitting

    readonly isInputDisabled: <Model>(formstate: Formstate<Model>) => boolean;
    readonly isFormSubmitting: <Model>(formstate: Formstate<Model>) => boolean;
    readonly isFormSubmittedAndUnchanged: <Model>(formstate: Formstate<Model>) => boolean;
    readonly getFormSubmissionStartTime: <Model>(formstate: Formstate<Model>) => Date | undefined;
    readonly getFormSubmissionEndTime: <Model>(formstate: Formstate<Model>) => Date | null | undefined;
    readonly getFormSubmissionValidity: <Model>(formstate: Formstate<Model>) => boolean | null | undefined;
    readonly getFormSubmissionAsyncErrorModelKeys: <Model>(formstate: Formstate<Model>) => readonly string[] | undefined;
    readonly getFormSubmissionError: <Model>(formstate: Formstate<Model>) => Error | null | undefined;
    readonly getFormSubmissionHistory: <Model>(formstate: Formstate<Model>) => readonly Formstate<Model>[] | undefined;
    readonly wasSuccessfulSubmit: <Model>(formstate: Formstate<Model>) => boolean;
    readonly setFormSubmitting: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly setFormSubmissionError: <Model>(formstate: Formstate<Model>, error: Error) => Formstate<Model>;
    readonly setFormSubmitted: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly setInputDisabled: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly setInputEnabled: <Model>(formstate: Formstate<Model>) => Formstate<Model>;

    // custom

    readonly getFormCustomProperty: <Model>(formstate: Formstate<Model>, name: string) => unknown | undefined;
    readonly setFormCustomProperty: <Model>(formstate: Formstate<Model>, name: string, value: unknown) => Formstate<Model>;

    // validity

    readonly isModelValid: <Model>(formstate: Formstate<Model>) => boolean;
    readonly isModelInvalid: <Model>(formstate: Formstate<Model>) => boolean;
    readonly isPrimedModelInvalid: <Model>(formstate: Formstate<Model>, calculatePrimed: CalculatePrimed<Model>) => boolean;

    //
    // Field/Scope Status
    //

    // value

    // It's usually easier to use formstate.model.x rather than getValue(formstate, 'x');
    // The one exception is when you are using a modelKey like getValue(formstate, 'address.line1');
    //
    readonly getValue: <Model>(formstate: Formstate<Model>, modelKey: string) => unknown;
    readonly getInitialValue: <Model>(formstate: Formstate<Model>, modelKey: string) => unknown | undefined;
    readonly setValueAndClearStatus: <Model>(formstate: Formstate<Model>, modelKey: string, value: unknown) => Formstate<Model>;

    // validity

    readonly isValid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isInvalid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isValidated: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isSynclyValid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isSynclyInvalid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isSynclyValidated: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly getMessage: <Model>(formstate: Formstate<Model>, modelKey: string) => string;
    readonly setValid: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setInvalid: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setNotValidated: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setSynclyValid: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setSynclyInvalid: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setNotSynclyValidated: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setMessage: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;

    // async

    readonly isAsynclyValid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isAsynclyInvalid: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isAsynclyValidated: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isWaiting: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly getAsyncToken: <Model>(formstate: Formstate<Model>, modelKey: string) => AsyncToken | undefined;
    readonly getAsyncStartTime: <Model>(formstate: Formstate<Model>, modelKey: string) => Date | undefined;
    readonly getAsyncEndTime: <Model>(formstate: Formstate<Model>, modelKey: string) => Date | null | undefined;
    readonly getAsyncError: <Model>(formstate: Formstate<Model>, modelKey: string) => Error | undefined;
    readonly wasAsyncErrorDuringSubmit: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly setAsyncStarted: <Model>(formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setAsynclyValid: <Model>(asyncToken: AsyncToken, formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setAsynclyInvalid: <Model>(asyncToken: AsyncToken, formstate: Formstate<Model>, modelKey: string, message: string) => Formstate<Model>;
    readonly setAsyncError: <Model>(asyncToken: AsyncToken, formstate: Formstate<Model>, modelKey: string, error: Error, message: string) => Formstate<Model>;

    // touched

    readonly isChanged: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isBlurred: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isSubmitting: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly isSubmitted: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly setChanged: <Model>(formstate: Formstate<Model>, modelKey: string) => Formstate<Model>;
    readonly setBlurred: <Model>(formstate: Formstate<Model>, modelKey: string) => Formstate<Model>;
    readonly setSubmitting: <Model>(formstate: Formstate<Model>, modelKey: string) => Formstate<Model>;
    readonly setSubmitted: <Model>(formstate: Formstate<Model>, modelKey: string) => Formstate<Model>;

    // custom

    readonly getCustomProperty: <Model>(formstate: Formstate<Model>, modelKey: string, name: string) => unknown | undefined;
    readonly setCustomProperty: <Model>(formstate: Formstate<Model>, modelKey: string, name: string, value: unknown) => Formstate<Model>;

    // primed

    readonly primeOnChange: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly primeOnBlur: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly primeOnChangeThenBlur: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;
    readonly primeOnSubmit: <Model>(formstate: Formstate<Model>, modelKey: string) => boolean;

    //
    // Validation
    //

    readonly synclyValidate: <Model>(formstate: Formstate<Model>, modelKey: string, form: Form<Model>) => Formstate<Model>;
    readonly synclyValidateForm: <Model>(formstate: Formstate<Model>, form: Form<Model>) => Formstate<Model>;
    readonly validateForm: <Model>(formstate: Formstate<Model>, form: Form<Model>) => Formstate<Model>;
    readonly asynclyValidate: <Model>(formstate: Formstate<Model>, modelKey: string, form: Form<Model>) => Formstate<Model>;
    readonly asynclyValidateForm: <Model>(formstate: Formstate<Model>, form: Form<Model>) => Formstate<Model>;
    readonly getPromises: <Model>(formstate: Formstate<Model>) => readonly Promise<unknown>[];
    // There is a simple 'change' function that skips validation, called setValueAndClearStatus
    readonly changeAndValidate: <Model>(formstate: Formstate<Model>, modelKey: string, value: unknown, form: Form<Model>) => Formstate<Model>;

    //
    // Event Handlers
    //

    // handleChange and handleBlur take an id rather than a modelKey so that, in the case of a dynamic form,
    // a defunct change handler won't bind to a form field that was removed from the form (and possibly
    // replaced by a field with the same name).
    // This is an extreme edge case and if it were a possibility in your form you'd have to be prepared to
    // catch the resulting exception, but arguably this is better than some orphaned change handler
    // unexpectedly updating your form's data.
    // That said, yes, in 99.99% of use cases this is not something to be concerned about, so having to use
    // an rff.getId() call to use the changeHandler is admittedly a little cumbersome.

    readonly handleChange: <Model>(form: Form<Model>, value: unknown, id: number) => void;
    readonly handleBlur: <Model>(form: Form<Model>, id: number) => void;

    //
    // Convenience Functions
    //

    readonly startFormSubmission: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly cancelFormSubmission: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly cancelFormSubmissionKeepInputDisabled: <Model>(formstate: Formstate<Model>) => Formstate<Model>;
    readonly driveFormSubmission: <Model>(form: Form<Model>, submitValidModel: SubmitValidModel<Model>) => void;

    //
    // Dynamic Forms
    //

    readonly addModelKey: <Model, NewModel>(
        formstate: Formstate<Model>,
        modelKey: string,
        initialModel: NewModel,
        formValidationSchema: FormValidationSchema<NewModel>
    ) => Formstate<NewModel>;

    readonly deleteModelKey: <Model, NewModel>(
        formstate: Formstate<Model>,
        modelKey: string,
    ) => Formstate<NewModel>;

    readonly deleteModelKeyAndValidateParentScope: <Model, NewModel>(
        formstate: Formstate<Model>,
        modelKey: string,
        form: Form<Model>
    ) => Formstate<NewModel>;

    //
    // React Component Adaptor
    //

    readonly bindToSetStateComponent: <Model>(
        component: Component,
        statePropertyName?: string
    ) => Form<Model>;
}

//
//
//
//
// Top-Level API
//
//
//
//

//
//
// FormScope, FormField, and adaptor-related props
//
//

export interface FormFieldName // If not wrapped by FormField, provide a field name TO the adaptor.
{
    readonly name?: string;
}

export interface RffFormProps<Model> // A nested form will RECEIVE these props from rff
{
    readonly form: Form<Model>;
    readonly formstate: Formstate<Model>;
}

export interface RffProps<Model> extends RffFormProps<Model> // An adaptor will RECEIVE these props from rff
{
    readonly modelKey: string;
}

export function createRffAdaptor<Props, Model>(
    Component: React.FunctionComponent<Props & RffProps<Model>>
): React.FunctionComponent<Props & FormFieldName>;

export function createRffNestedFormAdaptor<Props, Model>(
    Component: React.FunctionComponent<Props & RffFormProps<Model>>
): React.FunctionComponent<Props & { nestedForm: true }>;



export interface ScopeOrFieldProps<Model>
{
    readonly name: string;
    readonly required?: boolean | string;
    // name is not known at compile time and typescript cannot handle dynamic types. using unknown instead.
    readonly validate?: ValidationFunction<Model, unknown>; //<Model, Model[name]>;
    readonly validateAsync?: AsyncValidationFunction<Model, unknown>; //<Model, Model[name]>;
}

export type ValidatedRootScopeProps<Model> = RffFormProps<Model> & Omit<ScopeOrFieldProps<Model>, "name">;

export function FormScope<Model>(
    props: PropsWithChildren<RffFormProps<Model> | ScopeOrFieldProps<Model> | ValidatedRootScopeProps<Model>>,
    context?: any
): ReactElement<any, any>;

export function FormField<Model>(
    props: PropsWithChildren<ScopeOrFieldProps<Model>>,
    context?: any
): ReactElement<any, any>;

//
//
// useFormstate and rff
//
//

export function useFormstate<Model, CustomOptions extends Options<Model>>(
    initialFormstate: Formstate<Model> | (() => Formstate<Model>),
    options: CustomOptions
): [Formstate<Model>, Form<Model>];

export const rff: Rff;
