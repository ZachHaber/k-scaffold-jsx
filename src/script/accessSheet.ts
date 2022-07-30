import { setActionCalls } from './attributesProxy.js';
import { HandlerFunc, kvars, ListenerFunc } from './kvariables.js';
import { getAllAttrs } from './sheetworkerAliases.js';
import { debug, log } from './utility.js';

export function updateSheet() {
  log('updating sheet');
  getAllAttrs({
    props: ['debug_mode', ...kvars.baseGet],
    callback(attributes, sections, casc) {
      kvars.debugMode = kvars.debugMode || !!attributes.debug_mode;
      debug({ sheet_version: attributes.sheet_version });
      if (!attributes.sheet_version) {
        for (const [funcName, handler] of kvars.initialSetups) {
          debug(`running ${funcName}`);
          handler({ attributes, sections, casc });
        }
      } else {
        for (const [ver, handler] of kvars.updateHandlers) {
          if (+attributes.sheet_version < +ver) {
            handler({ attributes, sections, casc });
          }
        }
      }
      for (const [funcName, func] of kvars.openHandlers) {
        debug(`running ${funcName}`);
        func({ attributes, sections, casc });
      }
      setActionCalls({ attributes, sections });
      attributes.sheet_version = kvars.version;
      log(`Sheet Update applied. Current Sheet Version ${kvars.version}`);
      attributes.set();
      log('Sheet ready for use');
    },
  });
}

/**
 * This is the default listener function for attributes that the K-Scaffold uses. It utilizes the `triggerFuncs`, `listenerFunc`, `calculation`, and `affects` properties of the K-scaffold trigger object (see the Pug section of the scaffold for more details).
 * @param  event
 * @returns
 * @example
 * //Call from an attribute change
 * on('change:an_attribute',k.accessSheet);
 */
export const accessSheet: ListenerFunc = (event) => {
  debug({ funcs: kvars.funcs.keys() });
  debug({ event });
  getAllAttrs({
    callback: (attributes, sections, casc) => {
      let trigger = attributes.getCascObj(event, casc);
      attributes.processChange({ event, trigger, attributes, sections, casc });
    },
  });
};

kvars.listenerFuncs.set('accessSheet', accessSheet);
