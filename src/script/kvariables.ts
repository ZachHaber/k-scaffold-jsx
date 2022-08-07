import { attributeSets, cascades } from './_generated.js';
import { parseTriggerName, Trigger } from '../utility.js';
import { AttributesProxy, Cascade } from './attributesProxy.js';

export type HandlerFunc = (data: {
  attributes: AttributesProxy;
  sections: Record<string, string[]>;
  trigger?: Trigger;
  casc?: Cascade;
}) => string | number | void;

export type ListenerFunc = (event: EventInfo) => void;

export const kvars = {
  /**
   * This stores the name of your sheet for use in the logging functions {@link log} and {@link debug}. Accessible by `k.sheetName`
   */
  sheetName: 'kScaffold-jsx Powered Sheet',
  /**
   * This stores the version of your sheet for use in the logging functions{@link log} and {@link debug}. It is also stored in the sheet_version attribute on your character sheet. Accessible via `k.version`
   */
  version: 0,
  /**
   * A boolean flag that tells the script whether to enable or disable {@link debug} calls. If the version of the sheet is `0`, or an attribute named `debug_mode` is found on opening this is set to true for your entire session. Otherwise, it remains false.
   */
  debugMode: false,
  /**
   * Extra functions to add to the framework to be run in triggers
   */
  funcs: new Map<string, HandlerFunc>(),

  // Can be converted to a number!
  updateHandlers: new Map<string, HandlerFunc>(),

  openHandlers: new Map<string, HandlerFunc>(),

  allHandlers: new Map<string, HandlerFunc>(),

  // Won't have `trigger` property
  initialSetups: new Map<string, HandlerFunc>(),

  addFuncs: new Map<string, HandlerFunc>(),

  listenerFuncs: new Map<string, ListenerFunc>(),
  listeners: new Map<string, string>(),

  baseGet: Array<string>(),
};
Object.entries(cascades).forEach(([attrName, detailObj]) => {
  if (!attrName.includes('repeating') && detailObj.type !== 'action') {
    kvars.baseGet.push(detailObj.name);
  }
  if (detailObj.listener && detailObj.listenerFunc) {
    kvars.listeners.set(detailObj.listener, detailObj.listenerFunc);
  }
  return kvars.baseGet;
});

kvars.funcs.set('setActionCalls', ({ attributes, sections }) => {
  attributeSets.actions.forEach((base) => {
    let [section, , field] = parseTriggerName(base);
    let fieldAction = field.replace(/_/g, '-');
    if (section) {
      sections[section].forEach((id) => {
        attributes[
          `${section}_${id}_${field}`
        ] = `%{${attributes.character_name}|${section}_${id}_${fieldAction}}`;
      });
    } else {
      attributes[`${field}`] = `%{${attributes.character_name}|${fieldAction}}`;
    }
  });
});
