# Typescript sample code

These examples use dependency injection.

An example form component:

```tsx
import type { Form } from 'react-bootstrap';
import type {
    FormScope as RffFormScope, FormValidationSchema, Rff, useFormstate as useRff
} from 'react-formstate-fp';
import type { ControlHeaderComponent } from '@project/contract/app/components/form/ControlHeader';
import type { InputComponent } from '@project/contract/app/components/form/Input';
import type {
    UpsertAccountComponent
    // Model
} from '@project/contract/app/components/form/UpsertAccount';
import type { SpinnerComponent } from '@project/contract/app/components/glue/Spinner';
import type { LayoutComponent } from '@project/contract/app/components/layout/Layout';


// model type pulled out of .d.ts file for this code snippet

export interface UserAccountInputModel
{
    readonly fullName: string;
    readonly email: string;
    readonly imageUrl?: string;
    readonly primaryCaraitId?: string;
}

// html forms don't like optional strings...

type Model = Required<UserAccountInputModel>;


/* eslint-disable */

export const diUpsertAccount = (
    rff: Rff,
    FormScope: typeof RffFormScope,
    useFormstate: typeof useRff,
    BsForm: typeof Form,
    Layout: LayoutComponent,
    Spinner: SpinnerComponent,
    ControlHeader: ControlHeaderComponent,
    InputRow: InputComponent<Model>
): UpsertAccountComponent =>
{
    /* eslint-enable */

    const validationSchema: FormValidationSchema<Model> = {
        fields: {
            fullName: {
                required: 'Please provide your full name',
                validate: (value: string) =>
                {
                    if (!(/^\S+ +.+$/u).test(value.trim()))
                    {
                        return 'Please provide your first and last name';
                    }

                    return;
                }
            },
            email: {
                required: 'Please provide your email address',
                validate: (value: string) =>
                {
                    if (!(/^\S+@\S+\.\S+$/u).test(value.trim()))
                    {
                        return 'Please provide a valid email address';
                    }

                    return;
                }
            }
        }
    };

    return ({ initialModel, registrationId, submitValidModel, caraits }) =>
    {
        const [formstate, form] = useFormstate(
            () => rff.initializeFormstate(initialModel, validationSchema),
            {
                adaptors: [InputRow],
                calculatePrimed: rff.primeOnBlur
                // validateOnBlur: true
            }
        );

        // image input was removed for brevity.

        const submitWaitingMessage = ''; // this particular component won't be waiting.

        //
        // Submit function
        //

        function submit(e: React.FormEvent<HTMLFormElement>): void
        {
            e.preventDefault();

            rff.driveFormSubmission(form, (model) =>
            {
                const cancelFormSubmission = (): void =>
                {
                    form.setFormstate((fs) => rff.cancelFormSubmission(fs));
                };

                // submitValidModel supplied by parent component, because it'll be a different
                // action depending on whether this component is creating or editing an account.
                // Passing the parent component a cancelFormSubmission function for error handling.

                submitValidModel(model, cancelFormSubmission);
            });
        }

        //
        // Form markup
        //

        const submitting = rff.isFormSubmitting(formstate);

        return (
            <Layout className="">
                <div className="gc-form-container">
                    <BsForm noValidate onSubmit={submit}>
                        <Spinner visible={submitting} />
                        <ControlHeader
                            className="mb-5"
                            disabled={
                                Boolean(submitWaitingMessage) ||
                                submitting ||
                                rff.isPrimedModelInvalid(formstate, form.calculatePrimed)
                            }
                            heading={registrationId ? 'Create your account' : 'Edit your account'}
                            text={submitWaitingMessage || (registrationId ? 'Register' : 'Save Changes')}
                            variant={submitWaitingMessage ? "warning" : "primary"}
                        />
                        <FormScope<Model> form={form} formstate={formstate}>
                            <InputRow label="Full name" name="fullName" />
                            <InputRow label="Email address" name="email" />
                            {
                                caraits.length ?
                                    <InputRow
                                        label="Profile carait"
                                        name="primaryCaraitId"
                                        options={caraits.map((c) => ({ id: c.id, text: c.name }))}
                                        type="select"
                                    /> :
                                    null
                            }
                        </FormScope>
                    </BsForm>
                </div>
            </Layout>
        );
    };
};
```

An example input component:

```tsx
import type { Form } from 'react-bootstrap';
import type { createRffAdaptor as rffAdapt, Form as RffForm, FormFieldName, Rff } from 'react-formstate-fp';
// import type { InputComponent, InputComponentProps } from '@project/contract/app/components/form/Input';
import type { InputLayoutComponent } from '@project/contract/app/components/form/InputLayout';


// types pulled from .d.ts file for this code snippet

export interface InputComponentProps<Model> extends FormFieldName
{
    readonly autoFocus?: boolean;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly label: string;
    readonly onChange?: (form: RffForm<Model>, value: unknown, id: number) => void;
    readonly placeholder?: string;
    readonly type?: 'password' | 'text' | 'textarea' | 'select' | 'switch';
}

export type InputComponent<Model> = React.FunctionComponent<InputComponentProps<Model>>;



/* eslint-disable */

export function diInput<Model>(
    createRffAdaptor: typeof rffAdapt,
    rff: Rff,
    InputLayout: InputLayoutComponent,
    BsForm: typeof Form
): InputComponent<Model>
{
    // react-formstate-fp mangles props between the form component and the input component
    // use this function to keep typescript happy.
    // note there is a similar function in the react-formstate-fp api for adapting nested form components.

    return createRffAdaptor<InputComponentProps<Model>, Model>((props) =>
    {
        /* eslint-enable */

        const { autoFocus, className, disabled, form, formstate, label, modelKey,
            onChange, placeholder, type } = props;

        const rffFieldId = rff.getId(formstate, modelKey);
        const controlName = rff.getRootModelKey(formstate, rffFieldId);
        const controlId = `${controlName}Input`;
        const helpBlockId = `${controlName}Help`;
        const primed = form.calculatePrimed(formstate, modelKey);
        const invalid = primed && rff.isInvalid(formstate, modelKey);
        const valid = primed && rff.isValid(formstate, modelKey);

        let input: React.ReactNode = null;

        if (type === 'password' || type === 'text' || !type)
        {
            input = (
                <BsForm.Control
                    aria-describedby={helpBlockId}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    disabled={disabled}
                    id={controlId}
                    isInvalid={invalid}
                    isValid={valid}
                    name={controlName}
                    onBlur={(): void => rff.handleBlur(form, rffFieldId)}
                    onChange={(e): void => (onChange ?? rff.handleChange)(form, e.target.value, rffFieldId)}
                    placeholder={placeholder}
                    spellCheck="false"
                    type={type || 'text'}
                    value={rff.getValue(formstate, modelKey) as string}
                />
            );
        }

        // other input types omitted for brevity.

        // layout component omitted for brevity.

        return (
            <InputLayout
                className={className}
                label={label}
                input={input}
                inputId={controlId}
                inputName={controlName}
                isValid={valid}
                isInvalid={invalid}
                helpText={rff.getMessage(formstate, modelKey)}
                helpId={helpBlockId}
            />
        );
    });
}
```

Note that Typescript presented a choice between accurately typed validation handlers (i.e., validateEmail(value: string) instead of validateEmail(value: unknown)) and being able to specify model keys like 'address.line1' in a validation schema.

Accurately typed validation handlers seem to be more convenient, generally, and you can use nested validation schemas to handle the 'address.line1' case, so went the strongly typed route.

If you use "inline" validation specification (i.e., put it directly in the TSX markup), then you have to use weakly typed validation handlers and cast from unknown. Can't do better in that case.
