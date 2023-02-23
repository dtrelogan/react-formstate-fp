import { Formstate } from './Formstate';

//
// Form
//

export interface CalculatePrimed<Model>
{
    (formstate: Formstate<Model>, modelKey: string): boolean;
}

export interface Options<Model>
{
    readonly calculatePrimed: CalculatePrimed<Model>;
    readonly adaptors?: readonly Function[]; // An array of React Components.
}

export interface Form<Model> extends Options<Model>
{
    readonly setFormstate: (formstate: Formstate<Model> | ((fs: Formstate<Model>) => Formstate<Model>)) => void;
    readonly getFormstate?: () => Formstate<Model>;
}
