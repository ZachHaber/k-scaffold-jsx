import { createContext, useContext } from 'react';
import { RepeaterGenericName } from '../utility.js';

export const repeaterContext = createContext<RepeaterGenericName | ''>('');

export function useRepeaterContext() {
  return useContext(repeaterContext);
}

export const radioContext = createContext<string | undefined>(undefined);

export function useRadioContext() {
  return useContext(radioContext);
}
