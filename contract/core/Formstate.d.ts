import { ValidationFunction, AsyncValidationFunction, AsyncWhen, AsyncToken } from './FormValidationSchema';


interface CustomData
{
    readonly [name: string]: unknown;
}

//
// Lookup
//

interface RootModelKeyMap
{
    readonly [id: number]: string;
}

interface IdMap
{
    readonly [rootModelKey: string]: number;
}

interface ScopeMap
{
    readonly [id: number]: boolean;
}

interface Lookup
{
    readonly rootModelKeysById: RootModelKeyMap;
    readonly idsByRootModelKey: IdMap;
    readonly scopes: ScopeMap;
}

//
// Statuses
//

interface Touched
{
    readonly changed?: true;
    readonly blurred?: true;
    readonly submitted?: true | 'submitting';
}

interface AsyncStatus
{
    readonly started?: Date;
    readonly finished?: null | Date;
    readonly asynclyValid?: null | true | false;
    readonly token?: AsyncToken;
    readonly error?: Error;
}

interface Status
{
    readonly touched: Touched;
    readonly synclyValid: null | true | false;
    readonly async: AsyncStatus;
    readonly message: string;
    readonly custom: CustomData;
}

interface StatusMap
{
    readonly [id: number]: Status;
}

//
// ValidationSchemas
//

interface ValidationSchema<Model>
{
    readonly required?: boolean;
    readonly requiredMessage?: string;
    readonly validate?: ValidationFunction<Model, unknown>;
    readonly validateAsync?: [AsyncValidationFunction<Model, unknown>, AsyncWhen] | AsyncValidationFunction<Model, unknown>;
    readonly nestedScopeId: number | null;
}

interface ValidationSchemaMap<Model>
{
    readonly [id: number]: ValidationSchema<Model>;
}

//
// FormStatus
//

interface SubmitStatus
{
    readonly started?: Date;
    readonly finished?: Date;
    readonly valid?: null | true | false;
    readonly asyncErrorModelKeys?: readonly string[];
    readonly submissionError?: Error;
}

interface PromiseMap
{
    [token: string]: Promise<unknown>;
}

interface FormStatus
{
    readonly submit: SubmitStatus;
    readonly submitHistory: readonly Formstate<unknown>[]; // The model might change in a dynamic form.
    readonly custom: CustomData;
    readonly promises: PromiseMap;
    readonly inputDisabled: boolean;
}

//
// Formstate
//

export interface Formstate<Model>
{
    readonly lookup: Lookup;
    readonly statuses: StatusMap;
    readonly validationSchemas: ValidationSchemaMap<Model>;
    readonly formStatus: FormStatus;
    readonly initialModel: Model;
    readonly model: Model;
    readonly nestedScopeId: null | number;
}
