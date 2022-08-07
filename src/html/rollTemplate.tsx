import { default as clsx } from 'clsx';
import { cloneElement, ReactElement, ReactNode } from 'react';
import { isElement } from 'react-is';
import { createSlot } from './components/Slot.js';
import { flattenChildren } from './utils/flattenChildren.js';

export interface RollTemplateProps {
  name: string;
  children?: ReactNode;
}
/**
 * Roll Template Base
 */
export function RollTemplate({ name, children }: RollTemplateProps) {
  return (
    <rolltemplate className={`sheet-rolltemplate-${name}`}>
      {children}
    </rolltemplate>
  );
}

export function RollTemplateWrapper({ name, children }: RollTemplateProps) {
  return (
    <RollTemplate name={name}>
      <div className={`template ${name}`}>{children}</div>
    </RollTemplate>
  );
}

export function MultiPartRollTemplate({ name, children }: RollTemplateProps) {
  return (
    <RollTemplate name={name}>
      <TemplateHelper func="rollBetween" values="computed::finished 0 0" invert>
        <span className="finished" />
      </TemplateHelper>
      <div
        className={clsx(
          'template',
          `${name}`,
          // Note: these are conditional classes that will be joined together,
          templateConditional('continuation'),
          templateConditional('first'),
          'finished'
        )}
      >
        {children}
      </div>
    </RollTemplate>
  );
}

export function CharacterLink() {
  return (
    <TemplateConditional fieldBool="character_name">
      <TemplateConditional fieldBool="character_id">
        <h4 className="character_name">
          [{'{{character_name}}'}](
          {'http://journal.roll20.net/character/{{character_id}}'})
        </h4>
        <TemplateConditional.Else>
          <h4 className="character_name">{'{{character_name}}'}</h4>
        </TemplateConditional.Else>
      </TemplateConditional>
    </TemplateConditional>
  );
}

export function toTemplateAttr(attr: string) {
  return `{{${attr}}}`;
}

export function TemplateAttr({
  children,
}: {
  children: string | string[];
}): JSX.Element {
  return (
    <>
      {'{{'}
      {children}
      {'}}'}
    </>
  );
}

const ElseSlot = createSlot('Else');

export function templateConditional(
  value: string,
  fieldBool = value,
  invert = false
) {
  return `{{${invert ? '^' : '#'}${fieldBool}}}${value}{{/${fieldBool}}}`;
}
export function TemplateConditional({
  fieldBool,
  invert,
  children,
}: {
  fieldBool: string;
  invert?: boolean;
  children?: ReactNode;
}) {
  let elseSlot: ReactElement | undefined;
  const defaultSlot = flattenChildren(children).map((baseChild) => {
    if (!isElement(baseChild)) {
      return baseChild;
    }
    if (baseChild.type === ElseSlot && !baseChild.props['data-used']) {
      elseSlot = cloneElement(baseChild, { 'data-used': 'true' });
      return undefined;
    }
    return baseChild;
  });
  return (
    <>
      {`{{${invert ? '^' : '#'}${fieldBool}}}`}
      {defaultSlot}
      {`{{/${fieldBool}}}`}
      {elseSlot ? (
        <TemplateConditional fieldBool={fieldBool} invert={!invert}>
          {elseSlot}
        </TemplateConditional>
      ) : undefined}
    </>
  );
}
TemplateConditional.Else = ElseSlot;
export type TemplateHelperFunction =
  | 'rollWasCrit'
  | 'rollWasFumble'
  | 'rollTotal'
  | 'rollGreater'
  | 'rollLess'
  | 'rollBetween'
  | 'allprops';
interface TemplateHelperProps {
  func?: TemplateHelperFunction;
  values?: string;
  invert?: boolean;
  children?: ReactNode;
}
export function TemplateHelper({
  func,
  values = '',
  invert,
  children,
}: TemplateHelperProps) {
  const funcValue = func ? `${func}()` : '';
  let elseSlot: ReactElement | undefined;
  const defaultSlot = flattenChildren(children).map((baseChild) => {
    if (!isElement(baseChild)) {
      return baseChild;
    }
    if (baseChild.type === ElseSlot && !baseChild.props['data-used']) {
      elseSlot = cloneElement(baseChild, { 'data-used': 'true' });
      return undefined;
    }
    return baseChild;
  });
  return (
    <>
      {`{{${invert ? '#^' : '#'}${funcValue} ${values}}}`}
      {defaultSlot}
      {`{{/${invert ? '^' : ''}${funcValue} ${values}}}`}
      {elseSlot ? (
        <TemplateHelper func={func} values={values} invert={!invert}>
          {elseSlot}
        </TemplateHelper>
      ) : undefined}
    </>
  );
}
TemplateHelper.Else = ElseSlot;

/**
 * A basic display for an attribute based on a conditional of the same name
 */
export function TemplateConditionalRow({
  fieldBool,
  label = fieldBool,
  className,
}: {
  fieldBool: string;
  className?: string;
  label?: string;
}) {
  return (
    <TemplateConditional fieldBool={fieldBool}>
      <div className={clsx('template-row', className)}>
        <h5 data-i18n={label} className="template-row--header"></h5>
        <span className="description template-row--description">
          <TemplateAttr>{fieldBool}</TemplateAttr>
        </span>
      </div>
    </TemplateConditional>
  );
}
