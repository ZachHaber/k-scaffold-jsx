import { default as clsx } from 'clsx';

import {
  Children,
  cloneElement,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import {
  range,
  toRepeaterBaseName,
  toRepeaterGenericName,
  Trigger,
} from '../utility.js';
import {
  radioContext,
  repeaterContext,
  useRadioContext,
  useRepeaterContext,
} from './contexts.js';
import './jsxExtension.js';

export type BaseHtmlAttributes = HTMLAttributes<HTMLElement>;

// Global object stuff

export type TriggerDefinition = Partial<Omit<Trigger, 'name' | 'type'>>;

export const varObjects: {
  repeatingSectionDetails: { section: string; fields: string[] }[];
  varData: Map<string, Set<string>>;
  cascades: {
    [name: string]: Trigger;
  };
} = {
  repeatingSectionDetails: [],
  varData: new Map<string, Set<string>>([
    ['actionAttributes', new Set()],
    ['attributes', new Set()],
  ]),
  cascades: {
    attr_character_name: {
      name: 'character_name',
      type: 'text',
      defaultValue: '',
      affects: [],
      triggeredFuncs: ['setActionCalls'],
      listenerFunc: 'accessSheet',
      listener: 'change:character_name',
    },
  },
};

//#region Components
type PartPartial<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>> &
  Partial<Pick<T, Extract<keyof T, K>>>;
type PartRequired<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>> &
  Required<Pick<T, Extract<keyof T, K>>>;

export interface LabelWrapperBase {
  label: string;
  labelProps?: BaseHtmlAttributes;
  wrapperProps?: BaseHtmlAttributes;
}

type JSXInputProps = JSX.IntrinsicElements['input'];
export interface InputProps
  extends Omit<JSXInputProps, 'value' | 'checked' | 'defaultValue'> {
  defaultValue?: string | number | undefined;
  trigger?: TriggerDefinition;
  name: string;
  type:
    | 'checkbox'
    | 'hidden'
    | 'number'
    | 'radio'
    | 'range'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';
}

export function Input({ ...props }: InputProps) {
  // props.className = replaceProblems(props.className);
  props.name = replaceSpaces(props.name);
  const repeatingPrefix = useRepeaterContext();
  props.title = props.title ?? attrTitle(props.name, repeatingPrefix);
  props.name = `attr_${props.name}`;
  useAddFieldToFieldsetObj(props.name, repeatingPrefix);
  storeTrigger(props);
  return <input {...makeElementObj(props)} />;
}

type InputSansType = Omit<InputProps, 'type'>;

type TextInputProps = Omit<InputProps, 'type' | 'defaultChecked'>;

export function TextInput(props: TextInputProps) {
  return <Input {...props} type="text" />;
}

export interface CheckboxProps
  extends Omit<InputSansType, 'value' | 'checked' | 'defaultValue'> {}
export function CheckboxInput({ ...props }: CheckboxProps) {
  return <Input {...props} type="checkbox" />;
}

export function Collapse({
  name = 'collapse',
  defaultChecked = true,
  ...props
}: PartPartial<CheckboxProps, 'name'>) {
  return (
    <CheckboxInput
      name={name}
      {...props}
      defaultChecked={defaultChecked}
      className={clsx(props.className, 'collapse')}
    />
  );
}

export interface RadioProps
  extends PartPartial<Omit<InputSansType, 'defaultValue'>, 'name'> {
  value: string | number;
}

export function RadioInput({ name, ...props }: RadioProps) {
  const groupName = useRadioContext();
  name ||= groupName;
  if (!name) {
    throw new Error(
      'RadioInput must have name. Either provide a name, or use a radioContextProvider to provide one'
    );
  }
  return <Input {...props} name={name} type="radio" />;
}

export function NumberInput({
  defaultValue,
  ...props
}: Omit<InputSansType, 'defaultValue'> & { defaultValue?: number }) {
  return <Input {...props} defaultValue={defaultValue} type="number" />;
}

export function RangeInput(props: InputSansType) {
  return <Input {...props} type="range" />;
}

export function HiddenInput(props: InputSansType) {
  return <Input {...props} type="hidden" />;
}
export function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val == null) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

export interface RadioGroupProps {
  children?: ReactNode;
  radios?: Omit<RadioProps, 'name'>[];
  name: string;
  class?: string;
}
export function RadioGroup({
  children,
  radios,
  name,
  class: className,
}: RadioGroupProps) {
  return (
    <radioContext.Provider value={name}>
      <div role="group" className={clsx('RadioGroup', className)}>
        {children}
        {radios?.map((radioProps) => (
          <RadioInput {...radioProps} />
        ))}
      </div>
    </radioContext.Provider>
  );
}

export interface FillLeftProps extends Omit<RadioProps, 'value'> {
  defaultValue?: number;
  wrapperProps?: JSX.IntrinsicElements['div'];
  /**
   * Min value for the range - inclusive
   */
  minValue?: number;
  step?: number;
  /**
   * Max value for the range - exclusive
   */
  maxValue: number;
  noClear?: boolean;
}
export function FillLeft({
  wrapperProps,
  minValue = 1,
  step = 1,
  maxValue,
  noClear,
  defaultValue,
  ...radioProps
}: FillLeftProps) {
  return (
    <div
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'FillLeft')}
    >
      {range(minValue, maxValue, step).map((value, index) => {
        return (
          <RadioInput
            {...radioProps}
            value={value}
            className={clsx(radioProps.className, 'FillLeft__radio', {
              ['FillLeft__radio--clearer']: !noClear && index === 0,
            })}
            defaultChecked={value === defaultValue}
          />
        );
      })}
    </div>
  );
}

type JSXTextArea = JSX.IntrinsicElements['textarea'];
export interface TextareaProps extends Omit<JSXTextArea, 'value'> {
  trigger?: TriggerDefinition;
  name: string;
  defaultValue?: string;
}
export function Textarea({ ...props }: TextareaProps) {
  // props.className = replaceProblems(props.className);
  props.name = replaceSpaces(props.name);
  const repeatingPrefix = useRepeaterContext();
  props.title = props.title ?? attrTitle(props.name, repeatingPrefix);
  props.name = `attr_${props.name}`;
  useAddFieldToFieldsetObj(props.name, repeatingPrefix);
  storeTrigger(props);
  return <textarea {...makeElementObj(props)} />;
}

// interface OptionProps extends Omit<HTMLProps<HTMLOptionElement>, 'selected'> {}

// export function Option({ ...props }: OptionProps) {
//   // props.className = replaceProblems(props.className);
//   return <option {...props}></option>;
// }

type JSXSelectProps = JSX.IntrinsicElements['select'];

interface SelectProps
  extends Omit<JSXSelectProps, 'value' | 'defaultChecked' | 'checked'> {
  trigger?: TriggerDefinition;
  name: string;
  /**
   * Adds a placeholder option that's selected by default and doesn't show in the menu
   */
  placeholder?: string;
  defaultValue?: string;
}
export function Select({
  children,
  placeholder,
  defaultValue = placeholder ? '' : undefined,
  ...props
}: SelectProps) {
  // props.className = replaceProblems(props.className);
  const repeatingPrefix = useRepeaterContext();
  props.name = replaceSpaces(props.name);
  props.title = props.title ?? attrTitle(props.name, repeatingPrefix);
  props.name = `attr_${props.name}`;

  useAddFieldToFieldsetObj(props.name, repeatingPrefix);
  storeTrigger({ ...props, type: 'select' });
  if (!children && !placeholder) {
    throw new TypeError(`Select missing props`);
  }
  return (
    <select {...props} defaultValue={defaultValue}>
      {!!placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

type BaseImageProps = JSX.IntrinsicElements['img'];
export interface ImageProps extends BaseImageProps {
  name: string;
  'data-i18n-alt'?: string;
}

export function Image({ ...props }: ImageProps) {
  // props.className = replaceProblems(props.className);
  const repeatingPrefix = useRepeaterContext();
  if (props.name) {
    props['data-i18n-alt'] ??= props.name;
    props.name = replaceSpaces(props.name);
    props.title ??= attrTitle(props.name, repeatingPrefix);
    props.name = `attr_${props.name}`;
  }
  return <img {...props} />;
}

type JSXSpanProps = JSX.IntrinsicElements['span'];
export interface SpanProps
  extends Omit<
    JSXSpanProps,
    'value' | 'defaultValue' | 'defaultChecked' | 'checked'
  > {
  name?: string;
  trigger?: TriggerDefinition;
}
export function Span({ ...props }: SpanProps) {
  // props.className = replaceProblems(props.className);
  const repeatingPrefix = useRepeaterContext();
  if (props.name) {
    props.name = replaceSpaces(props.name);
    props.title ??= attrTitle(props.name, repeatingPrefix);
    props.name = `attr_${props.name}`;
    useAddFieldToFieldsetObj(props.name, repeatingPrefix);
  }
  const retval = <span {...makeElementObj(props)} />;
  if (props.name) {
    storeTrigger({ ...props, type: 'span' });
  }
  return retval;
}

type JSXDivProps = JSX.IntrinsicElements['div'];
export interface BackgroundDivProps extends JSXDivProps {
  /**
   * The attribute backed dynamic image url
   */
  name: string;
}
export function BackgroundDiv({ ...props }: BackgroundDivProps) {
  // props.className = replaceProblems(props.className);
  const repeatingPrefix = useRepeaterContext();
  if (props.name) {
    props.name = `attr_${replaceSpaces(props.name)}`;
    props.title ??= attrTitle(props.name, repeatingPrefix);
  }
  return <div {...props} />;
}

type JSXButtonProps = JSX.IntrinsicElements['button'];

export interface ButtonProps
  extends Omit<JSXButtonProps, 'type' | 'defaultValue'> {
  name: string;
  trigger?: TriggerDefinition;
  type?: 'action' | 'roll' | undefined;
  value?: string;
}
export function Button({ ...props }: ButtonProps) {
  const repeatingPrefix = useRepeaterContext();
  if (props.type === 'action') {
    props.name = `act_${actionButtonName(props.name)}`;
    props.title ??= buttonTitle(props.name, repeatingPrefix);
    storeTrigger(props);
  } else {
    props.type = 'roll';
    props.name = `roll_${replaceSpaces(props.name)}`;
    props.title ??= buttonTitle(props.name, repeatingPrefix);
  }
  // Due to the disconnect between button types, have to cheat the system a bit...
  return (
    <button
      {...makeElementObj(props)}
      type={props.type as unknown as JSXButtonProps['type']}
    />
  );
}

export function Action({ ...props }: Omit<ButtonProps, 'type'>) {
  return <Button {...props} type="action" />;
}

export function NavButton({ name, ...props }: Omit<ButtonProps, 'type'>) {
  addIfUnique('navButtons', name);
  name = `nav ${name}`;
  return <Action {...props} name={name} />;
}

/**
 * Creates a multi element construction made of a hidden input, a roll button, and a hidden action button. On sheet load, or character sheet name change, the hidden input is updated with an ability call to the action button. The roll button refers to the hidden input as its value. This allows for an action button to be used to call custom roll parsing (or other sheet functionality) while retaining the ability to drag the button to the macro bar. Uses the same arguments as {@link Button}. A trigger should be passed, and will be associated with the action button's name.
 */
export function Roller({
  className,
  trigger,
  children,
  ...props
}: Omit<ButtonProps, 'type' | 'value' | 'children'> & {
  children?: ButtonProps['children'] | ((props: ButtonProps) => ReactNode);
}) {
  const attrName = replaceSpaces(actionInputName(props.name));
  // attrName will get converted by actionButtonName in Button by default.
  // const actionName = actionButtonName(attrName);
  const repeatingPrefix = useRepeaterContext();
  addIfUnique('actionAttributes', `${repeatingPrefix}${attrName}`);
  const buttonProps: ButtonProps = {
    ...props,
    className: clsx(className, 'roller'),
    value: `@${attrName}`,
  };
  return (
    <>
      {typeof children === 'function' ? (
        children(buttonProps)
      ) : (
        <Button {...buttonProps} />
      )}
      <Action
        hidden
        name={attrName}
        trigger={trigger || { listenerFunc: 'initiateRoll' }}
      />
      <HiddenInput name={attrName} />
    </>
  );
}

const repeaterControlClass = 'repcontrol-button';

export interface RepeaterProps {
  /**
   * The name of the repeating section. Will be prefixed with `repeating_` and spaces will be replaced with dashes (`-`).
   */
  name: string;
  /**
   * Trigger that defines how to handle the removal of a row from the fieldset. `Optional`
   */
  trigger?: TriggerDefinition;
  /**
   * Any additional classes that should be used for the repeating section. Note that these are not added to the fieldset itself as adding additional classes to the fieldset itself interferes with calling action buttons from chat, but are added to a span that precedes the fieldset. This allows styling of the repcontainer via a css declaration like `.bonus-class + fieldset + .repcontainer`.
   */
  className?: string;

  children?: ReactNode;
}
/**
 * creates a fieldset for the creation of a repeating section. The mixin prefixes the name with `repeating_` and replaces problem characters (e.g. spaces are replaced with dashes). Additionally, the auto-generated title properties from the K-scaffold\'s mixins will include the proper repeating section information.
 */
export function Repeater({
  name,
  trigger,
  className,
  children,
}: RepeaterProps) {
  const parentRepeater = useRepeaterContext();
  if (parentRepeater) {
    throw new Error(
      `Cannot nest Repeaters. Attempted to nest "${name}" in "${toRepeaterBaseName(
        parentRepeater
      )}"`
    );
  }
  name = actionButtonName(name);
  const section = toRepeaterBaseName(name);
  createFieldsetObj(section);
  if (trigger) {
    storeTrigger({ name: section, type: 'fieldset', trigger });
  }
  return (
    <repeaterContext.Provider value={toRepeaterGenericName(section)}>
      {className ? <span hidden className={className} /> : undefined}
      <fieldset className={section}>{children}</fieldset>
    </repeaterContext.Provider>
  );
}

/**
 * Alias for {@link Repeater} that creates to custom action buttons to add/remove rows to the repeating section. Useful when you need to trigger a sheetworker when a row is added. This also prevents the occassional error of a new row disappearing immediately after the user has clicked the button to create one. Proper use of this will require css to hide the default buttons that fieldsets create automatically. Note that currently this assumes the existence of an addItem and editSection sheetworker function.
 */
export function CustomControlRepeater(props: RepeaterProps) {
  return (
    <>
      <Action
        name={`add ${props.name}`}
        className={clsx(repeaterControlClass, repeaterControlClass + '--add')}
        trigger={{ listenerFunc: 'addItem' }}
      />
      <Action
        name={`add ${props.name}`}
        className={clsx(repeaterControlClass, repeaterControlClass + '--edit')}
        trigger={{ listenerFunc: 'editSection' }}
      />
      <Repeater {...props} />
    </>
  );
}
export interface RepeatingSectionProps extends RepeaterProps {
  /**
   * The name of the section as per {@link Repeater}. This name will also be added to the section's class list as `repeating-container--NAME`. If no id argument is passed, this is also used as the id of the section.
   */
  name: string;
  /**
   * The translation key for the h2 element in the section
   * Or a JSX Element to use as the header
   */
  header: ReactNode;
  /**
   * Array of translation keys to use as column headers. These are added as h5's by default.
   */
  columnArr: string[];
  /**
   * An Element to clone for use with the column headers. Each will get `data-i18n` passed from the columnArr
   */
  columnTag?: ReactElement;
  /**
   * An id to use for the section element.
   */
  id: string;
  wrapperProps?: Omit<BaseHtmlAttributes, 'id' | 'children'>;
}
/**
 * A mixin that creates a section element with an h2, a space for column headers, and a {@link CustomControlRepeater} which can be styled to fit those column headers. The h2 labels the section via `aria-labelledby`.
 */
export function RepeatingSection({
  name,
  header,
  columnArr,
  id,
  columnTag = <h5 />,
  wrapperProps,
  ...props
}: RepeatingSectionProps) {
  <section
    {...wrapperProps}
    id={id}
    className={clsx(
      wrapperProps?.className,
      'section',
      'repeating-container',
      `repeating-container--${replaceProblems(name)}`
    )}
  >
    {typeof header === 'string' ? <h2 data-i18n={header} /> : header}
    {!!columnArr && (
      <div className="repeat-columns">
        {columnArr.map((col) =>
          cloneElement(columnTag, { ['data-i18n']: col, key: col })
        )}
      </div>
    )}
    <CustomControlRepeater {...props} name={name} />
  </section>;
}

/**
 * An alias for {@link Repeater} that creates a fieldset with an added class that can be easily hooked into via CSS to style the fieldset for inline display.
 */
export function InlineRepeater({
  name,
  className,
  children,
  ...props
}: RepeaterProps) {
  const inlineClass = 'inline-fieldset';
  addIfUnique('inlineFieldsets', name);

  return (
    <>
      <Repeater {...props} name={name} className={clsx(className, inlineClass)}>
        <RadioInput
          name="display state"
          className="display-control"
          value="short-display"
          hidden
        />
        <div className={clsx(`${inlineClass}__summary`, 'display-target')}>
          <label className="pointer">
            <CheckboxInput
              name="collapse"
              defaultChecked
              hidden
              trigger={{ triggeredFuncs: ['collapseSection'] }}
            />
            <Span
              name="name"
              className={`${inlineClass}__summary__text`}
            ></Span>
          </label>
        </div>
        <RadioInput
          name="display state"
          className="display-control"
          value="display"
          defaultChecked
          hidden
        />
        <div className={clsx(`${inlineClass}__detail`, 'display-target')}>
          <Collapse />
          {children}
        </div>
      </Repeater>
      <Action
        name={`add ${name}`}
        className={clsx(
          repeaterControlClass,
          `${repeaterControlClass}--add`,
          `${repeaterControlClass}--inline`
        )}
        trigger={{ listenerFunc: 'sectionInteract' }}
      />
      <Action
        name={`edit ${name}`}
        className={clsx(
          repeaterControlClass,
          `${repeaterControlClass}--edit`,
          `${repeaterControlClass}--inline`
        )}
        trigger={{ listenerFunc: 'sectionInteract' }}
      />
    </>
  );
}

export interface ButtonLabelProps extends ButtonProps {
  name: string;
  inputProps: PartPartial<InputSansType, 'name'>;
  wrapperProps?: BaseHtmlAttributes;
  inputType: InputProps['type'];
}

/**
 * A mixin to create a combined button and input that are within the same container. Similar to {@link InputLabel}, but does not use a label.
 *
 * Not quite sure what the purpose of this construction is yet...
 */
export function ButtonLabel({
  inputProps,
  inputType,
  wrapperProps,
  ...buttonProps
}: ButtonLabelProps) {
  return (
    <div
      {...wrapperProps}
      className={clsx(
        wrapperProps?.className,
        'input-label',
        'input-label--button'
      )}
    >
      <Button {...buttonProps} />
      <Input
        {...inputProps}
        type={inputType}
        name={inputProps.name || buttonProps.name}
        className={clsx(inputProps.className, 'input-label__input')}
      />
    </div>
  );
}

/**
 * Similar to the construction created by {@link ButtonLabel}, except that it creates a {@link Roller} construction instead of just a straight button.
 */
export function RollerLabel({
  wrapperProps,
  inputProps,
  inputType,
  ...buttonProps
}: ButtonLabelProps) {
  return (
    <Roller
      {...buttonProps}
      children={(buttonProps) => (
        <ButtonLabel
          wrapperProps={wrapperProps}
          inputProps={inputProps}
          inputType={inputType}
          {...buttonProps}
        />
      )}
    ></Roller>
  );
}

/**
 * Similar to the construction created by {@link ButtonLabel}, except that it specifcally creates an [action button](https://wiki.roll20.net/Button#Action_Button) as per {@link Action}.
 */
export function ActionLabel(props: Omit<ButtonLabelProps, 'type'>) {
  return <ButtonLabel {...props} type={'action'} />;
}

export type JSXLabelProps = JSX.IntrinsicElements['label'];

export interface SelectLabelProps extends SelectProps, LabelWrapperBase {}

export function SelectLabel({
  wrapperProps: wrapperProps,
  label,
  labelProps: labelProps,
  ...selectProps
}: SelectLabelProps) {
  return (
    <label
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'input-label')}
    >
      <Span
        {...labelProps}
        data-i18n={label}
        className={(clsx(labelProps?.className), 'input-label__text')}
      />
      <Select
        {...selectProps}
        className={clsx(selectProps.className, 'input-label__input')}
      ></Select>
    </label>
  );
}

export interface InputLabelProps
  extends InputProps,
    PartPartial<LabelWrapperBase, 'label'> {}

export function InputLabel({
  name,
  label = name,
  wrapperProps,
  labelProps,
  ...inputProps
}: InputLabelProps) {
  return (
    <label
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'input-label')}
    >
      <Span
        {...labelProps}
        data-i18n={label}
        className={(clsx(labelProps?.className), 'input-label__text')}
      />
      <Input
        {...inputProps}
        name={name}
        className={clsx(inputProps.className, 'input-label__input')}
      />
    </label>
  );
}

export function MultiInputLabel({
  label,
  wrapperProps,
  labelProps,
  children,
}: {
  children: ReactNode;
} & LabelWrapperBase) {
  const numChildren = Children.count(children);
  return (
    <label
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'input-label', {
        'input-label--dual': numChildren === 2,
        'input-label--multi': numChildren > 2,
      })}
    >
      <Span
        {...labelProps}
        data-i18n={label}
        className={(clsx(labelProps?.className), 'input-label__text')}
      />
      {Children.map(children, (child, index) => {
        if (index < numChildren) {
          // Might need to escape out this slash...
          return [child, <span className="slash h2">/</span>];
        }
        return child;
      })}
    </label>
  );
}

export interface HeadedTextareaProps extends TextareaProps, LabelWrapperBase {}

export function HeadedTextarea({
  wrapperProps,
  label,
  labelProps,
  ...textProps
}: HeadedTextareaProps) {
  return (
    <div
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'headed-textarea')}
    >
      <h3
        {...labelProps}
        data-i18n={label}
        className={clsx(labelProps?.className, 'headed-textarea__header')}
      />
      <Textarea
        {...textProps}
        className={clsx(textProps.className, 'headed-textarea__textarea')}
      />
    </div>
  );
}

export function AdaptiveTextarea({
  wrapperProps,
  labelProps,
  ...textProps
}: Omit<LabelWrapperBase, 'label'> & TextareaProps) {
  return (
    <div
      {...wrapperProps}
      className={clsx(wrapperProps?.className, 'adaptive', 'adaptive--text')}
    >
      <Span
        {...labelProps}
        name={textProps.name}
        className={clsx(labelProps?.className, 'adaptive--text__span')}
      />
      <Textarea
        {...textProps}
        className={clsx(textProps.className, 'adaptive--text__textarea')}
      />
    </div>
  );
}

export function AdaptiveInput({
  wrapperProps,
  ...textProps
}: { wrapperProps: BaseHtmlAttributes } & InputProps) {
  // No idea what the "maxWidth" line is about... no references to that outside of the mixin
  return (
    <div
      {...wrapperProps}
      className={clsx(wrapperProps.className, 'adaptive', 'adaptive--input')}
    >
      <Span name={textProps.name} className="adaptive--input__span" />
      <Input
        {...textProps}
        className={clsx(textProps.className, 'adaptive--input__textarea')}
      />
    </div>
  );
}

export interface CompendiumAttributes {
  /**
   * A prefix to attach to the default attribute names.
   */
  prefix?: string;
  /**
   * An array of the lookup attributes to create targets for. The target attributes are named based on the compendium attribute they are for.
   */
  lookupAttributes?: string[];
  /**
   * The compendium attribute that should trigger the sheetworkers to handle the compendium drop.
   */
  triggerAccept?: string;
  /**
   * The trigger object.
   */
  trigger?: TriggerDefinition;
}

/**
 * Creates a set of compendium drop target attributes. Defaults to creating target attributes for the `Name` and `data` compendium attributes.
 */
export function CompendiumAttributes({
  prefix,
  lookupAttributes = ['Name', 'data'],
  triggerAccept = 'Name',
  trigger = { triggeredFuncs: ['handleCompendiumDrop'] },
}: CompendiumAttributes) {
  prefix ??= '';
  lookupAttributes.map((accept) => {
    const inputProps: InputSansType = {
      name: `${prefix}drop ${accept.toLowerCase()}`,
      accept,
      defaultValue: '',
    };
    if (accept === triggerAccept) {
      inputProps.trigger = trigger;
    }
    return <HiddenInput {...inputProps} />;
  });
}
// export function
//#endregion

//#region helper functions
/*
declare const cleanVar: <T extends string | undefined>(v: T) =>
  T extends string ? string : undefined;
*/

type OptString<T extends string | undefined> = T extends string
  ? string
  : undefined;

const attrTitle = <T extends string | undefined>(
  string: T,
  repeatingPrefix: string
): OptString<T> =>
  (typeof string === 'string'
    ? `@{${repeatingPrefix}${replaceSpaces(string)
        .replace(/_max$/, '|max')
        .replace(/^attr_/, '')}}`
    : undefined) as OptString<T>;

const buttonTitle = <T extends string | undefined>(
  string: T,
  repeatingPrefix: string
): OptString<T> =>
  (typeof string === 'string'
    ? `%{${repeatingPrefix}${replaceSpaces(string).replace(
        /^(?:act|roll)_/,
        ''
      )}}`
    : undefined) as OptString<T>;

const replaceSpaces = <T extends string | undefined>(string: T): OptString<T> =>
  string?.replace(/\s+/g, '_') as OptString<T>;

const replaceProblems = <T extends string | undefined>(
  string: T
): OptString<T> => string?.replace(/[\(\)\[\]\|\/\\]/g, '-') as OptString<T>;

const capitalize = <T extends string | undefined>(string: T): OptString<T> =>
  string?.replace(/(?:^|\s+|\/)[a-z]/gi, (letter) =>
    letter.toUpperCase()
  ) as OptString<T>;
const actionButtonName = <T extends string | undefined>(
  name: T
): OptString<T> =>
  (typeof name === 'string'
    ? `${name.replace(/_|\s+/g, '-')}`
    : undefined) as OptString<T>;
const actionInputName = <T extends string | undefined>(name: T): OptString<T> =>
  (typeof name === 'string'
    ? `${name}_action`.replace(/roll_action/, 'action')
    : undefined) as OptString<T>;
const titleToName = (string: string) =>
  string.replace(/(?:^[@%]\{)|(?:\}$)/g, '');

const addIfUnique = (
  arrName: 'navButtons' | 'actionAttributes' | 'inlineFieldsets',
  item: string
) => {
  const set = varObjects.varData.get(arrName);
  if (!set) {
    varObjects.varData.set(arrName, new Set([item]));
    return;
  }
  set.add(item);
};

interface TriggerElement {
  trigger?: TriggerDefinition;
  title?: string;
  name?: string;
  type?: string;
  value?: string | number | undefined;
  defaultValue?: string | number | undefined;
  defaultChecked?: boolean;
}

const namePrefix = new Map<string | undefined, string>(
  Object.entries({
    roll: 'roll_',
    action: 'act_',
    fieldset: 'fieldset_',
  })
);

const typeDefs = new Map<string | undefined, string | number>(
  Object.entries({
    select: '',
    radio: 0,
    checkbox: 0,
    number: 0,
    text: '',
    span: '',
  })
);

const eventTypes = new Map<string | undefined, string>(
  Object.entries({
    roll: 'clicked',
    action: 'clicked',
    fieldset: 'remove',
  })
);

const storeTrigger = function (element: TriggerElement) {
  // Don't know if this will break this...
  if (!element.name) {
    // If there's no trigger or no name, return...
    return;
  }
  const elementName =
    element.title?.startsWith('@{') || element.title?.startsWith('%{')
      ? titleToName(element.title)
      : element.name;

  const trigger: Trigger = {
    ...element.trigger,
    name: elementName
      .replace(/\|/g, '_')
      .replace(/^(?:act_|roll_|fieldset_)/, ''),
  };

  // trigger.name = elementName.replace(/\|/g, "_");
  const cascName = `${
    namePrefix.get(element.type) || 'attr_'
  }${trigger.name.replace(/^(?:act_|roll_|fieldset_)/, '')}`;

  const [, section, field] = trigger.name.match(
    /(repeating_[^_]+)_[^_]+_(.+)/
  ) || [, , trigger.name];

  const eventType = eventTypes.get(element.type) || 'change';
  const listener = `${eventType}:${section ? `${section}:` : ''}${field}`;
  const cascade = varObjects.cascades[cascName];
  if (!cascade) {
    if (
      trigger.listener ||
      trigger.triggeredFuncs ||
      trigger.listenerFunc ||
      trigger.initialFunc ||
      trigger.affects
    ) {
      trigger.listener ??= listener;
      trigger.listenerFunc ??= 'accessSheet';
    }
    trigger.type = element.type;
    if (!namePrefix.has(element.type)) {
      trigger.defaultValue =
        trigger.defaultValue ??
        (element.type === 'checkbox'
          ? boolToNumber(!!element.defaultChecked)
          : undefined) ??
        element.defaultValue ??
        typeDefs.get(element.type) ??
        '';
      trigger.triggeredFuncs ??= [];
      trigger.affects =
        trigger.affects?.map((affect) => replaceSpaces(affect)) ?? [];
    }
    varObjects.cascades[cascName] = { ...trigger };
  } else {
    if (!namePrefix.has(cascade.type)) {
      if (trigger.triggeredFuncs?.length) {
        cascade.triggeredFuncs = [
          ...new Set([
            ...(cascade.triggeredFuncs || []),
            ...trigger.triggeredFuncs,
          ]),
        ];
      }
      if (trigger.affects?.length) {
        cascade.affects = [
          ...new Set([...(cascade.affects || []), ...trigger.affects]),
        ];
      }
      cascade.calculation ??= trigger.calculation;
    }
    if (
      trigger.listenerFunc ||
      trigger.triggeredFuncs?.length ||
      trigger.affects?.length
    ) {
      cascade.listener ??= trigger.listener || listener;
      cascade.listenerFunc ??= trigger.listenerFunc || 'accessSheet';
    }
  }
};

const getSectionDetails = function (section: string) {
  return varObjects.repeatingSectionDetails.find(
    (obj) => obj.section === section
  );
};

const createFieldsetObj = function (section: string) {
  !getSectionDetails(section)
    ? varObjects.repeatingSectionDetails.push({ section, fields: [] })
    : null;
};

function useAddFieldToFieldsetObj(name: string, repeatingPrefix: string) {
  let section = repeatingPrefix.replace(/_[^_]+_$/, '');
  let sectionDetails = getSectionDetails(section);
  name = name.replace(/^attr_/, '');
  if (sectionDetails && sectionDetails.fields.indexOf(name) < 0) {
    sectionDetails.fields.push(name);
  }
}

const makeElementObj = function <T extends { trigger?: TriggerDefinition }>(
  obj: T
): Omit<T, 'trigger'> {
  const { trigger, ...newObj } = obj;
  return newObj;
};
//#endregion

// function throwIfArray<T extends string | number | Array<any>>(value: T): T &
//   (string | number) {
//     if(Array.isArray(T)){
//       throw new TypeError('Value cannot be an array!');
//     }
//   }

function boolToNumber<T extends boolean | undefined>(
  val: T
): T extends boolean ? 0 | 1 : undefined {
  if (val == null) {
    return val as unknown as ReturnType<typeof boolToNumber<T>>;
  }
  return (val ? 1 : 0) as unknown as ReturnType<typeof boolToNumber<T>>;
}
