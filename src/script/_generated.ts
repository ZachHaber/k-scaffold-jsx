// This file is auto-generated as part of the build
import { Trigger, deserialize } from '../utility.js';
export const cascades: { [name: string]: Trigger } = deserialize(
  `{"attr_character_name":{"name":"character_name","type":"text","defaultValue":"","affects":[],"triggeredFuncs":["setActionCalls"],"listenerFunc":"accessSheet","listener":"change:character_name"}}`
);
export const repeatingSectionDetails: { section: string; fields: string[] }[] =
  deserialize(`[]`);
export const attributeSets: Record<
  'actions' | 'attributes' | '',
  Set<string>
> = deserialize(
  `{"actions":{"@@prototype":"Set","value":[]},"attributes":{"@@prototype":"Set","value":[]}}`
);
