import { default as clsx } from 'clsx';
import type { HTMLProps } from 'jsxte/dist/jsx/base-html-tag-props.js';
import type { ImgTagProps } from 'jsxte/dist/jsx/prop-types/img-jsx-props.js';
import type { OptionTagProps } from 'jsxte/dist/jsx/prop-types/option-jsx-props.js';
import type { SelectTagProps } from 'jsxte/dist/jsx/prop-types/select-jsx-props.js';
import type { TextareaTagProps } from 'jsxte/dist/jsx/prop-types/textarea-jsx-props.js';
import './jsxExtension.js';
import { range, Trigger } from '../utility.js';

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
let selectName: string | null = null;
let selectTitle: string | null = null;
let repeatingPrefix = '';

//#region Components
type PartPartial<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>> &
  Partial<Pick<T, Extract<keyof T, K>>>;
type PartRequired<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>> &
  Required<Pick<T, Extract<keyof T, K>>>;

export interface InputProps extends HTMLProps<JSX.InputTagProps> {
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
  // props.class = replaceProblems(props.class);
  props.name = replaceSpaces(props.name);
  props.title = props.title ?? attrTitle(props.name);
  props.name = `attr_${props.name}`;
  addFieldToFieldsetObj(props.name);
  storeTrigger(props);
  return <input {...makeElementObj(props)} />;
}

type InputSansType = Omit<InputProps, 'type'>;

export function Text(props: InputSansType) {
  return <Input {...props} type="text" />;
}

export interface CheckboxProps extends Omit<InputSansType, 'value'> {
  value?: 0 | 1;
}
export function Checkbox({ value, ...props }: CheckboxProps) {
  return <Input {...props} value={String(value)} type="checkbox" />;
}

export function Collapse({
  name = 'collapse',
  value = 1,
  ...props
}: PartPartial<CheckboxProps, 'name'> & { value?: 0 | 1 }) {
  return (
    <Checkbox
      name={name}
      value={value}
      {...props}
      class={clsx(props.class, 'collapse')}
    />
  );
}

export function Radio(props: InputSansType) {
  return <Input {...props} type="radio" />;
}

export function Number({
  value,
  ...props
}: Omit<InputSansType, 'value'> & { value?: number }) {
  return <Input {...props} value={value} type="number" />;
}

export function Range(props: InputSansType) {
  return <Input {...props} type="range" />;
}

export function Hidden(props: InputSansType) {
  return <Input {...props} type="hidden" />;
}
export function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val == null) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

export interface RadioGroupProps {
  children?: JSXTE.TagElement | JSXTE.TagElement[];
  radios?: Omit<InputProps, 'type' | 'name'>[];
  name: string;
  class?: string;
}
export function RadioGroup({
  children,
  radios,
  name,
  class: className,
}: RadioGroupProps) {
  children = ensureArray(children).map((tag) => ({
    ...tag,
    props: { ...tag.props, name: name },
  }));
  return (
    <div role="group" class={clsx('RadioGroup', className)}>
      {children}
      {radios?.map((radioProps) => (
        <Radio {...radioProps} name={name} />
      ))}
    </div>
  );
}

export interface FillLeftProps {
  radioProps: InputSansType;
  divProps?: HTMLProps;
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
  radioProps,
  divProps = {},
  minValue = 1,
  step = 1,
  maxValue,
  noClear,
}: FillLeftProps) {
  return (
    <div {...divProps} class={clsx(divProps.class, 'FillLeft')}>
      {range(minValue, maxValue, step).map((value, index) => {
        return (
          <Radio
            {...radioProps}
            value={String(value)}
            class={clsx(radioProps.class, 'FillLeft__radio', {
              ['FillLeft__radio--clearer']: !noClear && index === 0,
            })}
            checked={String(value) === radioProps.value}
          />
        );
      })}
    </div>
  );
}

export interface TextareaProps extends HTMLProps<TextareaTagProps> {
  trigger?: TriggerDefinition;
  name: string;
}
export function Textarea({ ...props }: TextareaProps) {
  // props.class = replaceProblems(props.class);
  props.name = replaceSpaces(props.name);
  props.title = props.title ?? attrTitle(props.name);
  props.name = `attr_${props.name}`;
  addFieldToFieldsetObj(props.name);
  storeTrigger(props);
  return <textarea {...makeElementObj(props)} />;
}

interface OptionProps extends HTMLProps<OptionTagProps> {
  trigger?: TriggerDefinition;
}

export function Option({ trigger, ...props }: OptionProps) {
  // props.class = replaceProblems(props.class);
  return <option {...props}></option>;
}

interface SelectProps extends HTMLProps<SelectTagProps> {
  trigger?: TriggerDefinition;
  name: string;
  /**
   * Adds a placeholder option that's selected by default and doesn't show in the menu
   */
  placeholder?: string;
}
export function Select({ children, placeholder, ...props }: SelectProps) {
  // props.class = replaceProblems(props.class);
  props.name = replaceSpaces(props.name);
  props.title = props.title ?? attrTitle(props.name);
  props.name = `attr_${props.name}`;
  try {
    selectName = props.name;
    selectTitle = props.title;
    addFieldToFieldsetObj(props.name);
    storeTrigger({ ...props, type: 'select' });
    if (!children && !placeholder) {
      throw new TypeError(`Select missing props`);
    }
    return (
      <select {...props}>
        {!!placeholder && (
          <Option value="" disabled hidden selected>
            {placeholder}
          </Option>
        )}
        {children}
      </select>
    );
  } finally {
    selectName = null;
    selectTitle = null;
  }
}

export interface ImageProps extends HTMLProps<ImgTagProps> {
  name: string;
  'data-i18n-alt'?: string;
}

export function Image({ ...props }: ImageProps) {
  // props.class = replaceProblems(props.class);
  if (props.name) {
    props['data-i18n-alt'] ??= props.name;
    props.name = replaceSpaces(props.name);
    props.title ??= attrTitle(props.name);
    props.name = `attr_${props.name}`;
  }
  return <img {...props} />;
}

export interface SpanProps extends HTMLProps {
  name?: string;
  trigger?: TriggerDefinition;
}
export function Span({ ...props }: SpanProps) {
  // props.class = replaceProblems(props.class);
  if (props.name) {
    props.name = replaceSpaces(props.name);
    props.title ??= attrTitle(props.name);
    props.name = `attr_${props.name}`;
    addFieldToFieldsetObj(props.name);
  }
  const retval = <span {...makeElementObj(props)} />;
  if (props.name) {
    storeTrigger({ ...props, type: 'span' });
  }
  return retval;
}

export interface BackgroundDivProps extends HTMLProps {
  /**
   * The attribute backed dynamic image url
   */
  name: string;
}
export function BackgroundDiv({ ...props }: BackgroundDivProps) {
  // props.class = replaceProblems(props.class);
  if (props.name) {
    props.name = `attr_${replaceSpaces(props.name)}`;
    props.title ??= attrTitle(props.name);
  }
  return <div {...props} />;
}
export interface ButtonProps extends HTMLProps<JSX.ButtonTagProps> {
  name: string;
  trigger?: TriggerDefinition;
}
export function Button({ ...props }: ButtonProps) {
  if (props.type === 'action') {
    props.name = `act_${actionButtonName(props.name)}`;
    storeTrigger(props);
  } else {
    props.type = 'roll';
    props.name = `roll_${replaceSpaces(props.name)}`;
  }
  props.title ??= buttonTitle(props.name);
  return <button {...makeElementObj(props)} />;
}

export function Action({ ...props }: Omit<ButtonProps, 'type'>) {
  return <Button {...props} type="action" />;
}

export function NavButton(props: Omit<ButtonProps, 'type'>) {
  addIfUnique('navButtons', props.name);
  props.name = `nav ${props.name}`;
  return <Action {...props} />;
}

/**
 * Creates a multi element construction made of a hidden input, a roll button, and a hidden action button. On sheet load, or character sheet name change, the hidden input is updated with an ability call to the action button. The roll button refers to the hidden input as its value. This allows for an action button to be used to call custom roll parsing (or other sheet functionality) while retaining the ability to drag the button to the macro bar. Uses the same arguments as {@link Button}. A trigger should be passed, and will be associated with the action button's name.
 */
export function Roller({
  class: className,
  trigger,
  children,
  ...props
}: Omit<ButtonProps, 'type' | 'value' | 'children'> & {
  children?:
    | ButtonProps['children']
    | ((props: ButtonProps) => JSXTE.ElementChildren);
}) {
  const attrName = replaceSpaces(actionInputName(props.name));
  // attrName will get converted by actionButtonName in Button by default.
  // const actionName = actionButtonName(attrName);
  addIfUnique('actionAttributes', `${repeatingPrefix}${attrName}`);
  const buttonProps = {
    ...props,
    class: clsx(className, 'roller'),
    value: `@${attrName}`,
  };
  return (
    <>
      {typeof children === 'function' ? (
        children(buttonProps)
      ) : (
        <Button
          {...buttonProps}
          class={clsx(className, 'roller')}
          value={`@{${attrName}}`}
        />
      )}
      <Action
        hidden="true"
        name={attrName}
        trigger={trigger || { listenerFunc: 'initiateRoll' }}
      />
      <Hidden name={attrName} />
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
  class?: string;

  children?: JSXTE.ElementChildren;
}
/**
 * creates a fieldset for the creation of a repeating section. The mixin prefixes the name with `repeating_` and replaces problem characters (e.g. spaces are replaced with dashes). Additionally, the auto-generated title properties from the K-scaffold\'s mixins will include the proper repeating section information.
 */
export function Repeater({
  name,
  trigger,
  class: className,
  children,
}: RepeaterProps) {
  name = actionButtonName(name);
  const section = `repeating_${name}`;
  repeatingPrefix = `${section}_$X_`;
  createFieldsetObj(section);
  if (trigger) {
    storeTrigger({ name: section, type: 'fieldset', trigger });
  }
  try {
    return (
      <>
        {className ? <span hidden class={className} /> : undefined}
        <fieldset class={section}>{children}</fieldset>
      </>
    );
  } finally {
    repeatingPrefix = '';
  }
}

/**
 * Alias for {@link Repeater} that creates to custom action buttons to add/remove rows to the repeating section. Useful when you need to trigger a sheetworker when a row is added. This also prevents the occassional error of a new row disappearing immediately after the user has clicked the button to create one. Proper use of this will require css to hide the default buttons that fieldsets create automatically. Note that currently this assumes the existence of an addItem and editSection sheetworker function.
 */
export function CustomControlRepeater(props: RepeaterProps) {
  return (
    <>
      <Action
        name={`add ${props.name}`}
        class={clsx(repeaterControlClass, repeaterControlClass + '--add')}
        trigger={{ listenerFunc: 'addItem' }}
      />
      <Action
        name={`add ${props.name}`}
        class={clsx(repeaterControlClass, repeaterControlClass + '--edit')}
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
   */
  header: string;
  /**
   * Array of translation keys to use as column headers. These are added as h5's.
   */
  columnArr: string[];
  /**
   * An id to use for the section element.
   */
  id: string;
}
/**
 * A mixin that creates a section element with an h2, a space for column headers, and a {@link CustomControlRepeater} which can be styled to fit those column headers. The h2 labels the section via `aria-labelledby`.
 */
export function RepeatingSection({
  name,
  header,
  columnArr,
  id,
  ...props
}: RepeatingSectionProps) {
  <section
    class={clsx(
      'section',
      'repeating-container',
      `repeating-container--${replaceProblems(name)}`
    )}
  >
    {!!header && <h2 data-i18n={header} />}
    {!!columnArr && (
      <div class="repeat-columns">
        {columnArr.map((col) => (
          <h5 data-i18n={col} />
        ))}
      </div>
    )}
    <CustomControlRepeater {...props} name={name} />
  </section>;
}

/**
 * An alias for {@link Repeater} that creates a fieldset with an added class that can be easily hooked into via CSS to style the fieldset for inline display.
 */
export function inlineFieldset({
  name,
  class: className,
  children,
  ...props
}: RepeaterProps) {
  const inlineClass = 'inline-fieldset';
  addIfUnique('inlineFieldsets', name);

  return (
    <>
      <Repeater {...props} name={name} class={clsx(className, inlineClass)}>
        <Radio
          name="display state"
          class="display-control"
          value="short-display"
          hidden
        />
        <div class={clsx(`${inlineClass}__summary`, 'display-target')}>
          <label class="pointer">
            <Checkbox
              name="collapse"
              value={1}
              hidden
              trigger={{ triggeredFuncs: ['collapseSection'] }}
            />
            <Span name="name" class={`${inlineClass}__summary__text`}></Span>
          </label>
        </div>
        <Radio
          name="display state"
          class="display-control"
          value="display"
          checked
          hidden
        />
        <div class={clsx(`${inlineClass}__detail`, 'display-target')}>
          <Collapse />
          {children}
        </div>
      </Repeater>
      <Action
        name={`add ${name}`}
        class={clsx(
          repeaterControlClass,
          `${repeaterControlClass}--add`,
          `${repeaterControlClass}--inline`
        )}
        trigger={{ listenerFunc: 'sectionInteract' }}
      />
      <Action
        name={`edit ${name}`}
        class={clsx(
          repeaterControlClass,
          `${repeaterControlClass}--edit`,
          `${repeaterControlClass}--inline`
        )}
        trigger={{ listenerFunc: 'sectionInteract' }}
      />
    </>
  );
}

/**
 * A mixin to create a combined button and input that are within the same container. Similar to {@link InputLabel}, but does not use a label.
 */
export function ButtonLabel({
  inputProps,
  buttonProps,
  divProps,
}: {
  inputProps: InputProps;
  buttonProps: ButtonProps;
  divProps?: HTMLProps;
}) {
  /*
   * Wasn't sure about this... it appears to be a copy paste error from elsewhere
   * if spanObj
   *   - buttonObj.class = buttonObj.class ? `${buttonObj.class} input-label__text` : 'input-label__text
   */
  return (
    <div
      class={clsx(divProps?.class, 'input-label', 'input-label--button')}
      {...divProps}
    >
      <Button {...buttonProps} name={buttonProps.name || inputProps.name} />
      <Input
        {...inputProps}
        class={clsx(inputProps.class, 'input-label__input')}
      />
    </div>
  );
}

/**
 * Similar to the construction created by {@link ButtonLabel}, except that it creates a {@link Roller} construction instead of just a straight button.
 */
export function RollerLabel(props: {
  inputProps: InputProps;
  buttonProps: ButtonProps;
  divProps?: HTMLProps;
}) {
  return (
    <Roller
      {...props.buttonProps}
      children={(buttonProps) => (
        <ButtonLabel {...props} buttonProps={buttonProps} />
      )}
    ></Roller>
  );
}

/**
 * Similar to the construction created by {@link ButtonLabel}, except that it specifcally creates an [action button](https://wiki.roll20.net/Button#Action_Button) as per {@link Action}.
 */
export function ActionLabel(props: {
  inputProps: InputProps;
  buttonProps: Omit<ButtonProps, 'type'>;
  divProps?: HTMLProps;
}) {
  return (
    <ButtonLabel
      {...props}
      buttonProps={{ ...props.buttonProps, type: 'action' }}
    />
  );
}

export function SelectLabel({
  labelProps,
  children,
  selectProps,
  label,
  spanProps,
}: {
  label: string;
  selectProps: SelectProps;
  labelProps?: HTMLProps;
  spanProps?: SpanProps;
  children: JSXTE.ElementChildren;
}) {
  return (
    <label {...labelProps} class={clsx(labelProps?.class, 'input-label')}>
      <Span
        {...spanProps}
        data-i18n={label}
        class={(clsx(spanProps?.class), 'input-label__text')}
      />
      <Select
        {...selectProps}
        class={clsx(selectProps.class, 'input-label__input')}
      >
        {children}
      </Select>
    </label>
  );
}

export function InputLabel({
  label,
  inputProps,
  labelProps,
  spanProps,
}: {
  label: string;
  inputProps: InputProps;
  labelProps?: HTMLProps;
  spanProps?: SpanProps;
}) {
  return (
    <label {...labelProps} class={clsx(labelProps?.class, 'input-label')}>
      <Span
        {...spanProps}
        data-i18n={label}
        class={(clsx(spanProps?.class), 'input-label__text')}
      />
      <Input
        {...inputProps}
        class={clsx(inputProps.class, 'input-label__input')}
      />
    </label>
  );
}

export function MultiInputLabel({
  label,
  inputArr,
  labelProps,
  spanProps,
}: {
  label: string;
  inputArr: InputProps[];
  labelProps: HTMLProps;
  spanProps: SpanProps;
}) {
  return (
    <label
      {...labelProps}
      class={clsx(labelProps?.class, 'input-label', {
        'input-label--dual': inputArr.length === 2,
        'input-label--multi': inputArr.length > 2,
      })}
    >
      <Span
        {...spanProps}
        data-i18n={label}
        class={(clsx(spanProps?.class), 'input-label__text')}
      />
      {inputArr.map((inputProps, index) => {
        if (!inputProps) {
          return undefined;
        }
        return (
          <>
            <Input {...inputProps} />
            {/* Might need to escape out this slash... */}
            {index < inputArr.length && <span class="slash h2">/</span>}
          </>
        );
      })}
    </label>
  );
}

export function HeadedTextarea({
  textProps,
  header,
  ...rest
}: { textProps: TextareaProps; header: string } & Omit<HTMLProps, 'children'>) {
  return (
    <div {...rest} class={clsx(rest.class, 'headed-textarea')}>
      <h3 data-i18n={header} class="headed-textarea__header" />
      <Textarea
        {...textProps}
        class={clsx(textProps.class, 'headed-textarea__textarea')}
      />
    </div>
  );
}

export function AdaptiveTextarea({
  textProps,
  ...rest
}: { textProps: TextareaProps } & Omit<HTMLProps, 'children'>) {
  return (
    <div {...rest} class={clsx(rest.class, 'adaptive', 'adaptive--text')}>
      <Span name={textProps.name} class="adaptive--text__span" />
      <Textarea
        {...textProps}
        class={clsx(textProps.class, 'adaptive--text__textarea')}
      />
    </div>
  );
}

export function AdaptiveInput({
  textProps,
  ...rest
}: { textProps: InputProps } & Omit<HTMLProps, 'children'>) {
  // No idea what the "maxWidth" line is about... no references to that outside of the mixin
  return (
    <div {...rest} class={clsx(rest.class, 'adaptive', 'adaptive--input')}>
      <Span name={textProps.name} class="adaptive--input__span" />
      <Input
        {...textProps}
        class={clsx(textProps.class, 'adaptive--input__textarea')}
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
      value: '',
    };
    if (accept === triggerAccept) {
      inputProps.trigger = trigger;
    }
    return <Hidden {...inputProps} />;
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

const attrTitle = <T extends string | undefined>(string: T): OptString<T> =>
  (typeof string === 'string'
    ? `@{${repeatingPrefix}${replaceSpaces(string)
        .replace(/_max$/, '|max')
        .replace(/^attr_/, '')}}`
    : undefined) as OptString<T>;

const buttonTitle = <T extends string | undefined>(string: T): OptString<T> =>
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
const titleToName = (string: string) => string.replace(/[@%]\{|\}/g, '');

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
  value?: string | number;
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
  if (!element.trigger || !element.name) {
    // If there's no trigger or no name, return...
    return;
  }
  const elementName = element.title ? titleToName(element.title) : element.name;

  const trigger: Trigger = {
    ...element.trigger,
    name: elementName.replace(/\|/g, '_'),
  };

  // trigger.name = elementName.replace(/\|/g, "_");
  const cascName = `${
    namePrefix.get(element.type) || 'attr_'
  }${trigger.name.replace(/^(?:act_|roll_|fieldset_)/, '')}`;
  let match = trigger.name.match(/(repeating_[^_]+)_[^_]+_(.+)/);
  let [, section, field] = match || [, , trigger.name];
  let eventType = eventTypes.get(element.type) || 'change';
  if (!varObjects.cascades[cascName]) {
    if (
      trigger.listener ||
      trigger.triggeredFuncs ||
      trigger.listenerFunc ||
      trigger.initialFunc ||
      trigger.affects
    ) {
      trigger.listener ??= `${eventType}:${section || ''}${field}`;
      trigger.listenerFunc ??= 'accessSheet';
    }
    trigger.type = element.type;
    if (!namePrefix.has(element.type)) {
      trigger.defaultValue = trigger.hasOwnProperty('defaultValue')
        ? trigger.defaultValue
        : element.type === 'checkbox' && !element.hasOwnProperty('checked')
        ? 0
        : element.hasOwnProperty('value')
        ? element.value
        : typeDefs.get(element.type) ?? '';
      trigger.triggeredFuncs ??= [];
      if (trigger.affects) {
        trigger.affects = trigger.affects.map((affect) =>
          replaceSpaces(affect)
        );
      } else {
        trigger.affects = [];
      }
    }
    varObjects.cascades[cascName] = { ...trigger };
  } else {
    if (!namePrefix.has(varObjects.cascades[cascName].type)) {
      if (trigger.triggeredFuncs?.length) {
        varObjects.cascades[cascName].triggeredFuncs = [
          ...new Set([
            ...(varObjects.cascades[cascName].triggeredFuncs || []),
            ...trigger.triggeredFuncs,
          ]),
        ];
      }
      if (trigger.affects?.length) {
        varObjects.cascades[cascName].affects = [
          ...new Set([
            ...(varObjects.cascades[cascName].affects || []),
            ...trigger.affects,
          ]),
        ];
      }
      varObjects.cascades[cascName].calculation ??= trigger.calculation;
    }
    if (
      trigger.listenerFunc ||
      trigger.triggeredFuncs?.length ||
      trigger.affects?.length
    ) {
      varObjects.cascades[cascName].listener ??=
        trigger.listener || `${eventType}:${section || ''}${field}`;
      varObjects.cascades[cascName].listenerFunc ??=
        trigger.listenerFunc || 'accessSheet';
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

const addFieldToFieldsetObj = function (name: string) {
  let section = repeatingPrefix.replace(/_[^_]+_$/, '');
  let sectionDetails = getSectionDetails(section);
  name = name.replace(/^attr_/, '');
  if (sectionDetails && sectionDetails.fields.indexOf(name) < 0) {
    sectionDetails.fields.push(name);
  }
};

const makeElementObj = function <T extends { trigger?: TriggerDefinition }>(
  obj: T
): Omit<T, 'trigger'> {
  const { trigger, ...newObj } = obj;
  return newObj;
};
//#endregion
