import { ReactNode } from 'react';

export interface RollTemplateProps {
  className?: string;
  children?: ReactNode;
}

declare global {
  namespace React {
    interface HTMLAttributes<T> {
      inert?: 'true' | 'false' | '';
      'data-i18n'?: string;
      'data-i18n-title'?: string;
      'data-i18n-alt'?: string;
      'data-i18n-placeholder'?: string;
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      rolltemplate: RollTemplateProps;
    }
  }
}

export {};
