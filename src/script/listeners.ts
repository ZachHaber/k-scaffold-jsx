import { updateSheet } from './accessSheet.js';
import { setActionCalls } from './attributesProxy.js';
import { kvars } from './kvariables.js';
import { getAllAttrs, _generateRowID } from './sheetworkerAliases.js';
import { debug, error, log, parseClickTrigger } from './utility.js';
import { cascades } from './_generated.js';

export function initializeKListeners() {
  on('sheet:opened', updateSheet);
  debug({
    funcKeys: kvars.funcs.keys(),
    funcs: kvars.funcs,
    listeners: kvars.listeners,
    listenerFuncs: kvars.listenerFuncs,
  });
  for (const [event, funcName] of kvars.listeners) {
    if (kvars.listenerFuncs.has(funcName)) {
      on(event, kvars.listenerFuncs.get(funcName)!);
    } else {
      error(
        `No function named "${funcName}" found. No listener created for ${event}`
      );
    }
  }
  for (const [name, trigger] of Object.entries(cascades)) {
    (['calculation', 'triggeredFuncs', 'addFuncs', 'initialFunc'] as const)
      .flatMap((n) => {
        const val = trigger[n];
        return !val
          ? []
          : Array.isArray(val)
          ? val.map((val) => [n, val] as const)
          : [[n, val] as const];
      })
      .forEach(([type, funcName]) => {
        if (!kvars.funcs.has(funcName)) {
          error(
            `No function named "${funcName}" found. Specified in "${name}"->${type}`
          );
        }
      });
  }
  log(`kScaffold Loaded`);
}

kvars.listenerFuncs.set('addItem', (event) => {
  let [, , section] = parseClickTrigger(event.triggerName);
  section = section.replace(/add-/, '');
  getAllAttrs({
    callback: (attributes, sections, casc) => {
      let row = _generateRowID(section, sections);
      debug('addItem', { section, row, event });
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
      attributes.set({ sections, casc });
    },
  });
});

kvars.listenerFuncs.set('editSection', (event) => {
  let [, , section] = parseClickTrigger(event.triggerName);
  debug('editSection', { section, event });
  section = section.replace(/edit-/, '');
  let target = `fieldset.repeating_${section} + .repcontainer`;
  $20(target).toggleClass('ui-sortable editmode');
});
