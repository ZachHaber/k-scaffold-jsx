import { default as clsx } from 'clsx';
import { Children, cloneElement, ReactElement, ReactNode } from 'react';

type ReactChildren = ReactElement | ReactElement[] | null;
// export interface TemplateProps {
//   name?: string;
//   children: ReactNode;
// }
// export const Template = memo<TemplateProps>(function Template({
//   name,
//   children,
// }) {
//   return children as ReactElement;
// });
const slotSymbol = Symbol('slot');
export interface TemplateProps<Props, Args = {}> {
  name?: string;
  children: ReactNode | ((props: Props & Args) => JSX.Element);
}
// const typedMemo: <T>(c: T) => T = memo;
// export const Slot = typedMemo(function Slot<T>({ children }: TemplateProps<T>) {
//   return children as ReactElement;
// });
export const createSlot = <Props extends object, Args extends object = {}>(
  name: string
) => {
  function slot({
    children,
    ...rest
  }: TemplateProps<Props, Args>): JSX.Element {
    return typeof children === 'function'
      ? children(rest as unknown as Props & Args)
      : Children.count(children) === 1
      ? cloneElement(children as JSX.Element, {
          ...rest,
          ...(children as any).props,
          className: clsx(
            (rest as any).className,
            (children as any).props.className
          ),
        })
      : (children as JSX.Element);
  }
  slot.displayName = `Slot(${name})`;

  slot[slotSymbol] = name;
  return slot;
};

export function getSlotName(slot: ReturnType<typeof createSlot>): string {
  return slot[slotSymbol];
}
