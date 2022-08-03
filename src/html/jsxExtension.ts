import { ReactNode } from 'react';

export interface RollTemplateProps {
  className?: string;
  children?: ReactNode;
}

declare module 'csstype' {
  interface Properties {
    '--quick-width'?: string;
  }
}
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      inert?: 'true' | 'false' | '';
      'data-i18n'?: string;
      'data-i18n-title'?: string;
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      rolltemplate: RollTemplateProps;
    }
  }
}

export {};
