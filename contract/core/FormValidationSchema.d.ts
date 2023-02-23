import { Formstate } from './Formstate';
import { Form } from './Form';


export type AsyncToken = string;

export type AsyncWhen = 'onChange' | 'onBlur' | 'onSubmit';

export interface ValidationFunction<Model, T>
{
    (value: T, formstate: Formstate<Model>, form: Form<Model>, id: number): string | Formstate<Model> | undefined;
}

export interface AsyncValidationFunction<Model, T>
{
    (value: T, formstate: Formstate<Model>, form: Form<Model>, id: number): Formstate<Model> | [Formstate<Model>, AsyncToken, Promise<void>];
}

interface AbstractValidationSchema<Model, T>
{
    readonly required?: boolean | string;
    readonly validate?: ValidationFunction<Model, T>;
}

export interface FieldValidationSchema<Model, T> extends AbstractValidationSchema<Model, T>
{
    readonly validateAsync?: [AsyncValidationFunction<Model, T>, AsyncWhen];
}

export interface ScopeValidationSchema<Model, T> extends AbstractValidationSchema<Model, T>
{
    readonly validateAsync?: AsyncValidationFunction<Model, T>; // Always runs 'onSubmit'
}

export interface NestedScopeValidationSchema<Model>
{
    readonly schema?: FormValidationSchema<Model>; // recursive types work! awesome.
}

export interface NestedArrayScopeValidationSchema<Model extends readonly any[]>
{
    readonly schemaForEach?: FormValidationSchema<Model[number]>;
}

export type FieldValidationSchemaMap<Model> = {
    [Property in keyof Model]?: FieldValidationSchema<Model, Model[Property]>;
};

export type NonRootScopeValidationSchemaMap<Model> = {
    [Property in keyof Model]?: Model[Property] extends readonly any[] ?
    ScopeValidationSchema<Model, Model[Property]> |
    NestedScopeValidationSchema<Model[Property]> |
    NestedArrayScopeValidationSchema<Model[Property]> :
    ScopeValidationSchema<Model, Model[Property]> |
    NestedScopeValidationSchema<Model[Property]>;
};

interface RootScopeValidationSchema<Model>
{
    ''?: ScopeValidationSchema<Model, Model>;
}

export type ScopeValidationSchemaMap<Model> =
    NonRootScopeValidationSchemaMap<Model> & RootScopeValidationSchema<Model>;

export interface FormValidationSchema<Model>
{
    readonly fields?: FieldValidationSchemaMap<Model>;
    readonly scopes?: ScopeValidationSchemaMap<Model>;
}
