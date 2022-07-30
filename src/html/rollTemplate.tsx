import { default as clsx } from 'clsx';

export interface RollTemplateProps {
  name: string;
  children?: JSXTE.ElementChildren;
}
/**
 * Roll Template Base
 */
export function RollTemplate({ name, children }: RollTemplateProps) {
  return (
    <rolltemplate class={`sheet-rolltemplate-${name}`}>{children}</rolltemplate>
  );
}

export function RollTemplateWrapper({ name, children }: RollTemplateProps) {
  return (
    <RollTemplate name={name}>
      <div class={`template ${name}`}>{children}</div>
    </RollTemplate>
  );
}

export function MultiPartRollTemplate({ name, children }: RollTemplateProps) {
  return (
    <RollTemplate name={name}>
      <TemplateHelper func="rollBetween" values="computed::finished 0 0" invert>
        <span class="finished" />
      </TemplateHelper>
      <div
        class={clsx(
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
        <h4 class="character_name">
          [{'{{character_name}}'}](
          {'http://journal.roll20.net/character/{{character_id}}'})
        </h4>
      </TemplateConditional>
      <TemplateConditional fieldBool="chracter_id" invert>
        <h4 class="character_name">{'{{character_name}}'}</h4>
      </TemplateConditional>
    </TemplateConditional>
  );
}

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
  children?: JSXTE.ElementChildren;
}) {
  return (
    <>
      {`{{${invert ? '^' : '#'}${fieldBool}}}`}
      {children}
      {`{{/${fieldBool}}}`}
    </>
  );
}
export type TemplateHelperFunction =
  | 'rollWasCrit'
  | 'rollWasFumble'
  | 'rollTotal'
  | 'rollGreater'
  | 'rollLess'
  | 'rollBetween'
  | 'allProps';
interface TemplateHelperProps {
  func?: TemplateHelperFunction;
  values?: string;
  invert?: boolean;
  children?: JSXTE.ElementChildren;
}
export function TemplateHelper({
  func,
  values = '',
  invert,
  children,
}: TemplateHelperProps) {
  const funcValue = func ? `${func}()` : '';
  return (
    <>
      {`{{${invert ? '#^' : '#'}${funcValue} ${values}}}`}
      {children}
      {`{{/${invert ? '^' : ''}${funcValue} ${values}}}`}
    </>
  );
}
// type TemplateHelperSansFunc = Omit<TemplateHelperProps, "func">;
// export function RollWasCrit(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollWasCrit" />;
// }
// export function RollWasFumble(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollWasFumble" />;
// }
// export function RollTotal(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollTotal" />;
// }
// export function RollGreater(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollGreater" />;
// }
// export function RollLess(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollLess" />;
// }
// export function RollBetween(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="rollBetween" />;
// }
// export function AllProps(props: TemplateHelperSansFunc) {
//   return <TemplateHelper {...props} func="allProps" />;
// }
