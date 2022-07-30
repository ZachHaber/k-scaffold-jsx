import 'jsxte/jsx-runtime';
import { ButtonTagProps as BaseButtonTagProps } from 'jsxte/dist/jsx/prop-types/button-jsx-props.js';
import { InputTagProps as BaseInputTagProps } from 'jsxte/dist/jsx/prop-types/input-jsx-props.js';

type RollTemplateProps = { class?: string; children?: JSXTE.ElementChildren };

type StrippedInputProps = 'pattern' | 'value';
// declare module "jsxte/jsx/base-html-tag-props" {
//   export interface BaseHTMLTagProps {
//     inert?: AttributeBool;
//     role?: AriaRole;
//     "data-i18n"?: string;
//   }
// }

declare global {
  namespace JSXTE {
    interface BaseHTMLTagProps {
      // role?: AriaRole;
      'data-i18n'?: string;
      'data-i18n-title'?: string;
      'aria-level'?: string;
      // role?: AriaRole;
    }
  }
  // namespace TJSXExtends {
  //   interface AttributeAcceptedTypes {
  //     inert?: boolean;
  //     role?: string;
  //   }
  // }
  namespace JSX {
    // export type BaseHTMLTagProps = {
    //   inert?: boolean;
    // };
    // interface OptionTagProps {
    //   inert?: boolean;
    //   value?: string;
    // }
    // interface BaseHTMLTagProps extends BaseBaseHTMLTagProps {
    //   role?: string;
    // }
    interface ButtonTagProps extends Omit<BaseButtonTagProps, 'type'> {
      type?: 'button' | 'reset' | 'submit' | 'action' | 'roll';
      value?: string;
    }
    interface InputTagProps
      extends Omit<BaseInputTagProps, StrippedInputProps> {
      value?: string | number;
      inputmode?:
        | 'none'
        | 'text'
        | 'tel'
        | 'url'
        | 'email'
        | 'numeric'
        | 'decimal'
        | 'search';
    }
    interface Test {
      blah: 5;
    }
    interface IntrinsicElements {
      rolltemplate: RollTemplateProps;
    }
  }
}

type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';
export {};
