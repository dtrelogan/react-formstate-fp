import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { rff, useFormstate, FormField, FormScope } from '../lib/index.js';


function render(Test) {
  return ReactDOMServer.renderToString(
    <html lang='en'>
      <head>
        <meta charSet='utf-8'/>
        <title>CI Test</title>
      </head>
      <body>
        <Test/>
      </body>
    </html>
  );
}

describe('useFormstate', () => {
  test('it returns a formstate and a form', () => {
    let called = false;
    function Test() {
      called = true;
      let initialFs = rff.initializeFormstate({a: 1});
      let [fs, form] = useFormstate(initialFs);
      expect(fs.model).toStrictEqual({a: 1});
      expect(typeof(form.setFormstate)).toBe('function');
      expect(typeof(form.getFormstate)).toBe('function');
      return null;
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('you can configure options on the form', () => {
    function Test() {
      let initialFs = rff.initializeFormstate({a: 1});
      let [fs, form] = useFormstate(initialFs, {someOption: true});
      expect(form.someOption).toBe(true);
      return null;
    }
    render(Test);
  });
  test('getFormstate returns a formstate', () => {
    function Test() {
      let initialFs = rff.initializeFormstate({a: 1});
      let [fs, form] = useFormstate(initialFs, {someOption: true});
      expect(form.getFormstate().model).toStrictEqual({a: 1});
      return null;
    }
    render(Test);
  });
  test('you can pass setFormstate a formstate', () => {
    let i = 0;
    function Test() {
      let initialFs = rff.initializeFormstate({a: 1});
      let [fs, form] = useFormstate(initialFs, {someOption: true});
      if (i === 0) {
        i = 1;
        form.setFormstate(rff.setValid(form.getFormstate(), 'a', 'msg'));
        expect(rff.isValid(form.getFormstate(), 'a')).toBe(true);
        expect(rff.getMessage(form.getFormstate(), 'a')).toBe('msg');
      }
      return null;
    }
    render(Test);
  });
  test('you can pass setFormstate a function', () => {
    let i = 0;
    function Test() {
      let initialFs = rff.initializeFormstate({a: 1});
      let [fs, form] = useFormstate(initialFs, {someOption: true});
      if (i === 0) {
        i = 1;
        form.setFormstate((testFs) => {
          return rff.setInvalid(testFs, 'a', 'new msg')
        });
        expect(rff.isInvalid(form.getFormstate(), 'a')).toBe(true);
        expect(rff.getMessage(form.getFormstate(), 'a')).toBe('new msg');
      }
      return null;
    }
    render(Test);
  });
});


describe('bindToSetStateComponent', () => {
  test('creates getFormstate and setFormstate functions', () => {
    let called = false;
    class Test extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          formstate: rff.initializeFormstate({a: 1})
        };
        this.form = rff.bindToSetStateComponent(this);
      }
      render() {
        this.setState = (updates) => this.state = updates;

        expect(this.form.getFormstate().model).toStrictEqual({a: 1});
        this.form.setFormstate(rff.setValid(this.form.getFormstate(), 'a', 'msg'));

        this.form.setFormstate((testFs) => {
          expect(rff.isValid(testFs, 'a')).toBe(true);
          expect(rff.getMessage(testFs, 'a')).toBe('msg');
          return rff.setInvalid(testFs, 'a', 'new msg');
        });

        expect(rff.isInvalid(this.form.getFormstate(), 'a')).toBe(true);
        expect(rff.getMessage(this.form.getFormstate(), 'a')).toBe('new msg');

        called = true;
        return null;
      }
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('allows a custom name rather than formstate', () => {
    let called = false;
    class Test extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          testing: rff.initializeFormstate({a: 1})
        };
        this.form = rff.bindToSetStateComponent(this, 'testing');
      }
      render() {
        this.setState = (updates) => this.state = updates;

        expect(this.form.getFormstate().model).toStrictEqual({a: 1});
        this.form.setFormstate(rff.setValid(this.form.getFormstate(), 'a', 'msg'));

        this.form.setFormstate((testFs) => {
          expect(rff.isValid(testFs, 'a')).toBe(true);
          expect(rff.getMessage(testFs, 'a')).toBe('msg');
          return rff.setInvalid(testFs, 'a', 'new msg');
        });

        expect(rff.isInvalid(this.form.getFormstate(), 'a')).toBe(true);
        expect(rff.getMessage(this.form.getFormstate(), 'a')).toBe('new msg');

        called = true;
        return null;
      }
    }
    render(Test);
    expect(called).toBe(true);
  });
});


describe('FormScope', () => {
  test('must be passed a formstate prop', () => {
    function Test() {
      return (
        <FormScope/>
      );
    }
    expect(() => render(Test)).toThrow(/An RFF FormScope element requires "formstate" and "form" props./);
  });
  test('must be passed a form prop', () => {
    function Test() {
      return (
        <FormScope formstate={rff.initializeFormstate({a:1})}/>
      );
    }
    expect(() => render(Test)).toThrow(/An RFF FormScope element requires "formstate" and "form" props./);
  });
  test('the form prop must have a setFormstate function configured', () => {
    function Test() {
      return (
        <FormScope formstate={rff.initializeFormstate({a:1})} form={{}}/>
      );
    }
    expect(() => render(Test)).toThrow(/The "form" prop provided to an RFF FormScope element must contain a "setFormstate" function./);
  });
  test('can configure root scope validation', () => {
    let fs, form;
    function f() {}
    function g() {}
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form} required validate={f} validateAsync={g}/>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, ''), form)).toBe(true);
    expect(form.validationSchemas[rff.getId(fs, '')].validate).toBe(f);
    expect(form.validationSchemas[rff.getId(fs, '')].validateAsync).toStrictEqual([g, 'onSubmit']);
    expect(form.validationSchemas[rff.getId(fs, '')].nestedScopeId).toBe(null);
  });
  test('can configure root scope required validation message', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form} required='msg'/>
      );
    }
    render(Test);
    expect(form.validationSchemas[rff.getId(fs, '')].requiredMessage).toBe('msg');
  });
  test('throws an error if the name does not match a model key', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope name='bubkus' formstate={fs} form={form}/>
      );
    }
    expect(() => render(Test)).toThrow(/does not correspond to anything in your model./);
  });
  test('throws an error if it tries to co-opt a field', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope name='' formstate={fs} form={form}>
          <FormScope name='a'/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/conflicts with your initial model/);
  });
  test('can work with a validation schema', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1}, {scopes:{'':{required:true}}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}/>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, ''), form)).toBe(true);
  });
  test('throws an error if it tries to override a validation schema', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1}, {scopes:{'':{required:true}}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form} required/>
      );
    }
    expect(() => render(Test)).toThrow(/You cannot define validation in your JSX if a validation schema was already provided/);
  });
  test('overwrites an existing jsx validation schema', () => {
    // If you define the form as a ref, then each render you have to decide whether to overwrite the stored validation schema,
    // or to do nothing if one is already defined. RFF makes the decision to overwrite. This test simulates that behavior.
    // (I feel like there was a good reason why it needed to be this way but I can't think of it now. Maybe it doesn't?)
    let fs, form;
    function f() {}
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <div>
          <FormScope formstate={fs} form={form} required/>
          <FormScope formstate={fs} form={form} validate={f}/>
        </div>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, ''), form)).toBe(false);
    expect(form.validationSchemas[rff.getId(fs, '')].validate).toBe(f);
  });
  test('throws an error if you try to configure validation at multiple scopes', () => {
    let fs, form;
    function Nested({formstate, form}) {
      return (
        <FormScope formstate={formstate} form={form} required/>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form} required>
          <Nested nestedForm/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/Validation is defined for root model key "" in two different components?/);
  });
  test('it normalizes the name', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='[a]' required/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
  });
  test('a non-root FormScope requires a name prop', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/A non-root FormScope element requires a non-empty "name" prop./);
  });
  test('it passes along the right props to a nested form', () => {
    let fs, form;
    let called = false;
    function Nested({formstate, form: fm}) {
      called = true;
      expect(formstate.nestedScopeId).toBe(rff.getId(fs, 'a'));
      expect(fm).not.toBe(form);
      expect(typeof(fm.setFormstate)).toBe('function');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='a'>
            <Nested nestedForm/>
          </FormScope>
        </FormScope>
      );
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('it can configure validation in a nested form', () => {
    let fs, form;
    function Nested({formstate, form}) {
      return (
        <FormScope formstate={formstate} form={form} required/>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='a'>
            <Nested nestedForm/>
          </FormScope>
        </FormScope>
      );
    }
    render(Test);
    expect(form.validationSchemas[rff.getId(fs, 'a')].required).toBe(true);
    expect(form.validationSchemas[rff.getId(fs, 'a')].nestedScopeId).toBe(rff.getId(fs, 'a'));
  });
  test('form.adaptors must be an array', () => {
    let fs, form;
    function Adaptor() {
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: 3 };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/The "form.adaptors" option must be an array./);
  });
  test('a configured adaptor gets passed formstate, modelKey, and form', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form}) {
      called = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(formstate.model).toStrictEqual({a:1});
      expect(modelKey).toBe('');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor/>
        </FormScope>
      );
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('adaptors can be passed modelKey', () => {
    let fs, form;
    let called1 = false;
    function Adaptor1({formstate, modelKey, form}) {
      called1 = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(modelKey).toBe('address.line1');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    let called2 = false;
    function Adaptor2({formstate, modelKey, form}) {
      called2 = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(modelKey).toBe('address.line2');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({address: {line1: '', line2: ''}});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor1, Adaptor2] };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor1 modelKey='address.line1'/>
          <Adaptor2 modelKey='address.line2'/>
        </FormScope>
      );
    }
    render(Test);
    expect(called1).toBe(true);
    expect(called2).toBe(true);
  });
  test('modelKeys passed to adaptors are normalized', () => {
    let fs, form;
    let called1 = false;
    function Adaptor1({formstate, modelKey, form}) {
      called1 = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(modelKey).toBe('address.line1');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    let called2 = false;
    function Adaptor2({formstate, modelKey, form}) {
      called2 = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(modelKey).toBe('address.line2');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({address: {line1: '', line2: ''}});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor1, Adaptor2] };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor1 modelKey='address[line1]'/>
          <Adaptor2 modelKey='[address][line2]'/>
        </FormScope>
      );
    }
    render(Test);
    expect(called1).toBe(true);
    expect(called2).toBe(true);
  });
  test('You can place root FormScope at an inner scope, for what its worth', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({address: {line1: '', line2: ''}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope name='address' formstate={fs} form={form}>
          <FormField name='line1' required/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'address.line1'), form)).toBe(true);
  });
  // test('it passes along formstate and form props', () => {
  //   // this is covered by other tests.
  // });
});



describe('FormField', () => {
  test('must be passed a formstate prop', () => {
    function Test() {
      return (
        <FormField/>
      );
    }
    expect(() => render(Test)).toThrow(/An RFF FormField element requires "formstate" and "form" props./);
  });
  test('must be passed a form prop', () => {
    function Test() {
      return (
        <FormField formstate={rff.initializeFormstate({a:1})}/>
      );
    }
    expect(() => render(Test)).toThrow(/An RFF FormField element requires "formstate" and "form" props./);
  });
  test('the form prop must have a setFormstate function configured', () => {
    function Test() {
      return (
        <FormField formstate={rff.initializeFormstate({a:1})} form={{}}/>
      );
    }
    expect(() => render(Test)).toThrow(/The "form" prop provided to an RFF FormField element must contain a "setFormstate" function./);
  });
  test('can configure validation', () => {
    let fs, form;
    function f() {}
    function g() {}
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a' required validate={f} validateAsync={[g,'onBlur']}/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
    expect(form.validationSchemas[rff.getId(fs, 'a')].validate).toBe(f);
    expect(form.validationSchemas[rff.getId(fs, 'a')].validateAsync).toStrictEqual([g, 'onBlur']);
    expect(form.validationSchemas[rff.getId(fs, 'a')].nestedScopeId).toBe(null);
  });
  test('can configure a required validation message', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a' required='msg'/>
        </FormScope>
      );
    }
    render(Test);
    expect(form.validationSchemas[rff.getId(fs, 'a')].requiredMessage).toBe('msg');
  });
  test('throws an error if the name does not match a model key', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='bubkus'/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/does not correspond to anything in your model./);
  });
  test('throws an error if it tries to co-opt a scope', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a'/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/conflicts with your initial model/);
  });
  test('can work with a validation schema', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1}, {fields:{'a':{required:true}}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a'/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
  });
  test('throws an error if it tries to override a validation schema', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1}, {fields:{'a':{required:true}}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a' required/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/You cannot define validation in your JSX if a validation schema was already provided/);
  });
  test('overwrites an existing jsx validation schema', () => {
    // If you define the form as a ref, then each render you have to decide whether to overwrite the stored validation schema,
    // or to do nothing if one is already defined. RFF makes the decision to overwrite. This test simulates that behavior.
    // (I feel like there was a good reason why it needed to be this way but I can't think of it now. Maybe it doesn't?)
    let fs, form;
    function f() {}
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a' formstate={fs} form={form} required/>
          <FormField name='a' formstate={fs} form={form} validate={f}/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(false);
    expect(form.validationSchemas[rff.getId(fs, 'a')].validate).toBe(f);
  });
  test('throws an error if you try to configure validation at multiple scopes', () => {
    let fs, form;
    function Nested({formstate, form}) {
      return (
        <FormScope formstate={formstate} form={form}>
          <FormField name='a' required/>
        </FormScope>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <Nested nestedForm/>
          <FormField name='a' required/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/Validation is defined for root model key "a" in two different components?/);
  });
  test('it can lazily initialize form.validationSchemas starting from a nested form', () => {
    // Do not mutate the form unless the user decides to use jsx validation configuration
    let fs, form;
    function Nested({formstate, form}) {
      return (
        <FormScope formstate={formstate} form={form}>
          <FormField name='a' required/>
        </FormScope>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <Nested nestedForm/>
          <FormField name='a' required/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/Validation is defined for root model key "a" in two different components?/);
  });
  test('it normalizes the name', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='[a]' required/>
        </FormScope>
      );
    }
    render(Test);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
  });
  test('requires a name prop', () => {
    let fs, form;
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField/>
        </FormScope>
      );
    }
    expect(() => render(Test)).toThrow(/A FormField element requires a non-empty "name" prop./);
  });
  test('it can configure validation in a nested form', () => {
    let fs, form;
    function Nested({formstate, form}) {
      return (
        <FormScope formstate={formstate} form={form}>
          <FormField name='aa' required/>
        </FormScope>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:{aa:1}});
      form = { setFormstate: (f) => { fs = f(fs); } };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='a'>
            <Nested nestedForm/>
          </FormScope>
        </FormScope>
      );
    }
    render(Test);
    expect(form.validationSchemas[rff.getId(fs, 'a.aa')].required).toBe(true);
    expect(form.validationSchemas[rff.getId(fs, 'a.aa')].nestedScopeId).toBe(rff.getId(fs, 'a'));
  });
  test('a configured adaptor gets passed formstate, modelKey, and form', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form}) {
      called = true;
      expect(formstate.nestedScopeId).toBe(null);
      expect(formstate.model).toStrictEqual({a:1});
      expect(modelKey).toBe('a');
      expect(typeof(form.setFormstate)).toBe('function');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:1});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='a'>
            <Adaptor/>
          </FormField>
        </FormScope>
      );
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('names can use dot notation', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form}) {
      called = true;
      expect(modelKey.slice(0,8)).toBe('address.');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({address: {line1: '', line2: ''}});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <FormField name='address.line1'>
            <Adaptor/>
          </FormField>
          <FormField name='address.line2'>
            <Adaptor/>
          </FormField>
        </FormScope>
      );
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('names can be array indexes', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form}) {
      called = true;
      expect(modelKey).toBe('a.0');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:[0,1,2]});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='a'>
            <FormField name={0}>
              <Adaptor/>
            </FormField>
          </FormScope>
        </FormScope>
      );
    }
    render(Test);
    expect(called).toBe(true);
  });
  test('field override does not conflict with jsx validation', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form, children}) {
      called = true;
      expect(modelKey).toBe('');
      return (
        <div>
          {children}
        </div>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:[0,1,2]}, {fields: {a: {}}});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor>
            <FormField name='a' required/>
          </Adaptor>
        </FormScope>
      );
    }
    const output = render(Test);
    expect(called).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
  });
  // test('it passes along formstate and form props', () => {
  //   // this is covered by other tests.
  // });
});


describe('addProps', () => {
  test('navigates children of rff elements, non-rff elements, and children of non-rff elements', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form}) {
      called = true;
      expect(modelKey).toBe('a.0');
      return null;
    }
    function Test() {
      fs = rff.initializeFormstate({a:[0,1,2]});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <div>
            {null}
            <br/>
            <input type='submit' value='testing a non-rff element with props'/>
            <FormScope name='a'>
              <FormField name={0}>
                <span><Adaptor/></span>
              </FormField>
            </FormScope>
          </div>
        </FormScope>
      );
    }
    const output = render(Test);
    expect(called).toBe(true);
    expect(output.indexOf('bubkus')).toBe(-1);
    const i = output.indexOf('<body><div><br/><input type="submit" value="testing a non-rff element with props"/><span></span></div></body>');
    expect(i).not.toBe(-1);
  });
  test('navigates children of adaptor elements', () => {
    let fs, form;
    let called = false;
    function Adaptor({formstate, modelKey, form, children}) {
      called = true;
      expect(modelKey).toBe('');
      return (
        <div>
          {children}
        </div>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({a:[0,1,2]}, {fields: {a: {}}});
      form = { setFormstate: (f) => { fs = f(fs); }, adaptors: [Adaptor] };
      return (
        <FormScope formstate={fs} form={form}>
          <Adaptor>
            <FormField name='a' required/>
          </Adaptor>
        </FormScope>
      );
    }
    const output = render(Test);
    expect(called).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'a'), form)).toBe(true);
  });
  test('navigates children of nested form elements', () => {
    let fs, form;
    let called = false;
    function NestedForm({formstate, form, children}) {
      called = true;
      expect(formstate.nestedScopeId).toBe(rff.getId(fs, 'address'));
      return (
        <div>
          {children}
        </div>
      );
    }
    function Test() {
      fs = rff.initializeFormstate({address: { line1: '' }});
      form = { setFormstate: (f) => { fs = f(fs); }};
      return (
        <FormScope formstate={fs} form={form}>
          <FormScope name='address'>
            <NestedForm nestedForm>
              <FormField name='line1' required/>
            </NestedForm>
          </FormScope>
        </FormScope>
      );
    }
    const output = render(Test);
    expect(called).toBe(true);
    expect(rff.isRequired(fs, rff.getId(fs, 'address.line1'), form)).toBe(true);
  });
});
