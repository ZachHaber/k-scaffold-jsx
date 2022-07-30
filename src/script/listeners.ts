import { updateSheet } from './accessSheet.js';
import { setActionCalls } from './attributesProxy.js';
import { kvars } from './kvariables.js';
import { getAllAttrs, _generateRowID } from './sheetworkerAliases.js';
import { debug, log, parseClickTrigger } from './utility.js';
import { cascades } from './_generated.js';

export function initializeKListeners() {
  on('sheet:opened', updateSheet);
  debug({ funcKeys: kvars.funcs.keys(), funcs: kvars.funcs });
  for (const [event, funcName] of kvars.listeners) {
    if (kvars.listenerFuncs.has(funcName)) {
      on(event, kvars.listenerFuncs.get(funcName)!);
    } else {
      debug(
        `!!!Warning!!! no function named ${funcName} found. No listener created for ${event}`,
        true
      );
    }
  }
  log(`kScaffold Loaded`);
}

kvars.listenerFuncs.set('addItem', (event) => {
  let [, , section] = parseClickTrigger(event.triggerName);
  section = section.replace(/add-/, '');
  getAllAttrs({
    callback: (attributes, sections, casc) => {
      let row = _generateRowID(section, sections);
      debug({ row });
      attributes[`${row}_name`] = '';
      setActionCalls({ attributes, sections });
      const trigger = cascades[`fieldset_repeating_${section}`];
      if (trigger?.addFuncs) {
        trigger.addFuncs.forEach((funcName) => {
          if (kvars.addFuncs.has(funcName)) {
            kvars.addFuncs.get(funcName)!({
              attributes,
              sections,
              casc,
              trigger,
            });
          }
        });
      }
      attributes.set({ attributes, sections, casc });
    },
  });
});

kvars.listenerFuncs.set('editSection', (event) => {
  let [, , section] = parseClickTrigger(event.triggerName);
  section = section.replace(/edit-/, '');
  let target = `fieldset.repeating_${section} + .repcontainer`;
  $20(target).toggleClass('ui-sortable editmode');
});
