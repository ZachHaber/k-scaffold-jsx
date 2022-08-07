import { commaArray, parseTriggerName, Trigger } from '../utility.js';
import { HandlerFunc, kvars, ListenerFunc } from './kvariables.js';
import { kSetAttrs, kSetSectionOrder } from './sheetworkerAliases.js';
import { debug, error } from './utility.js';
import { attributeSets, cascades } from './_generated.js';

export interface Attributes {
  [attr: string]: string;
  // [attr: `_reporder_${string}`]: string[];
}
export type Cascade = Record<string, Trigger>;

export type AttributesProxyBase = {
  /**
   * - Applies any updates to the sheet. Also applies any repeating section reorders. This uses ES6 destructuring function argument assignment so all arguments should be passed in as properties of a single object with the indicated keys (e.g. `attributes.set({vocal:true,callback:() => log('attributes were set')})`)
   */
  set(
    this: AttributesProxy,
    obj?: {
      /**
       *  - set will not be silent. Inverts the standard behavior of setAttrs options object
       */
      vocal?: boolean;
      sections?: Record<string, string[]>;
      casc?: Cascade;
      /**
       * A callback to be invoked once the setAttrs is completed
       */
      callback?: () => // obj: {
      // /**
      //  * The instance of the attributeProxy to use for further set operations
      //  */
      // attributes?: AttributesProxy;
      // /**
      //  * An object containing the idArrays for each repeating section
      //  */
      // sections: object;
      // /**
      //  * as {@link AttributesProxy.casc the casc property}
      //  */
      // casc: Cascade;
      // }
      void;
    }
  ): void;
  /**
   * The original attribute values from the getAttrs call
   */
  attributes: Attributes;
  /**
   * Any changes that are made by the script are stored here
   */
  updates: Attributes;
  /**
   * any changes to repeating section orders stored here
   */
  repOrders: Record<string, string[]>;
  /**
   * queue of attributes affected to iterate through. Only used if the whole proxy is passed to attributes.set()
   */
  queue: string[];
  /**
   * The details of how to handle all attributes
   */
  casc: Cascade;
  /**
   * function to iterate through attribute changes for default handling
   */
  processChange: (
    this: AttributesProxy,
    data: {
      event?: EventInfo;
      trigger: Trigger;
      sections: Record<string, string[]>;
      casc: Cascade;
    }
  ) => void;
  /**
   * Calls functions that are triggered whenever an attribute is changed or affected
   */
  triggerFunctions: (
    this: AttributesProxy,
    trigger: Trigger,
    sections: Record<string, string[]>,
    casc?: Cascade
  ) => void;
  /**
   * Calls functions that are only triggered when an attribute is the triggering event
   */
  initialFunction: (
    this: AttributesProxy,
    trigger: Trigger,
    sections: Record<string, string[]>,
    casc: Cascade
  ) => void;
  alwaysFunctions: (
    this: AttributesProxy,
    trigger: Trigger,
    sections: Record<string, string[]>,
    casc: Cascade
  ) => void;
  /**
   * Gets the appropriate cascade object for a given attribute or action button
   */
  getCascObj(this: AttributesProxy, event: EventInfo, casc: Cascade): Trigger;
  getRepOrder(this: AttributesProxy, section: string): string[];
  setRepOrder(this: AttributesProxy, section: string, value: string[]): void;
};

export type AttributesProxy = AttributesProxyBase & {
  // [attr: `_reporder_${string}`]: string;
  /**
   * - Your attribute values are stored in the attribute proxy under their attribute names. You can reference the current value of the attribute by calling it directly from the proxy (e.g. `attributes.my_attribute`). This will return either the original value if no changes have been made, or the updated value if changes have previously been applied. Storing an updated value is done by simple assignment (e.g. `attributes.my_attributes = 5`).
   */
  [name_of_attribute: string]: string | number;
};

export function createAttrProxy(attrs: Attributes): AttributesProxy {
  const attrTarget: AttributesProxyBase = {
    updates: {} as Attributes,
    attributes: { ...attrs } as Attributes,
    repOrders: {},
    queue: [],
    casc: {},
    getRepOrder(section) {
      const token = `_reporder_${section}`;
      const value = this.attributes[token];
      if (Array.isArray(value)) {
        return value;
      }
      return commaArray(value);
    },
    setRepOrder(section, value) {
      this.attributes[`_reporder_${section}`] = value.join(',');
    },
    set({ sections, casc, callback, vocal } = {}) {
      if (this.queue.length && sections && casc) {
        const triggerName = this.queue.shift();
        if (triggerName) {
          const trigger = this.getCascObj(
            { sourceAttribute: triggerName } as any,
            casc
          );
          this.processChange({ trigger, sections, casc });
        }
      } else {
        debug({ updates: this.updates });
        const trueCallback = Object.keys(this.repOrders).length
          ? () => {
              Object.entries(this.repOrders).forEach(([section, order]) => {
                kSetSectionOrder(section, order);
              });
              callback?.();
            }
          : callback;
        Object.keys(this.updates).forEach(
          (key) => (this.attributes[key] = this.updates[key])
        );
        const update = this.updates;
        this.updates = {};
        kSetAttrs(update as any, vocal, trueCallback);
      }
    },
    getCascObj(event, casc) {
      let eventName = event.triggerName || event.sourceAttribute;
      let typePrefix = 'attr_';
      if (eventName.startsWith('clicked:')) {
        typePrefix = 'act_';
        eventName = eventName.replace('clicked:', '');
      } else if (event.removedInfo) {
        typePrefix = 'fieldset_';
        eventName = eventName.replace('remove:', '');
      }
      return casc[`${typePrefix}${eventName}`];
    },
    triggerFunctions(trigger, sections) {
      if (trigger.triggeredFuncs?.length) {
        debug(`triggering functions for ${trigger.name}`);
        trigger.triggeredFuncs.forEach((funcName) => {
          const func = kvars.funcs.get(funcName);
          if (!func) {
            error(
              `No function named ${funcName} found. Triggered function not called for ${trigger.name}`
            );
          } else {
            func({ trigger, attributes: this, sections });
          }
        });
      }
    },
    initialFunction(trigger, sections) {
      if (trigger.initialFunc) {
        debug(`intial functions for ${trigger.name}`);
        const func = kvars.funcs.get(trigger.initialFunc);
        func
          ? func({ trigger, attributes: this, sections })
          : error(
              `No function named ${trigger.initialFunc} found. Initial function not called for ${trigger.name}`
            );
      }
    },
    alwaysFunctions(trigger, sections, casc) {
      // Define allHandlers!
      for (const handler of kvars.allHandlers.values()) {
        handler({ trigger, attributes: this, sections, casc });
      }
    },
    processChange({ event, trigger, sections, casc }) {
      debug(`processing ${trigger?.name}`, { trigger, event, sections, casc });
      if (event && !trigger) {
        debug(`${event.sourceAttribute} change detected. No trigger found`);
        return;
      }
      if (!sections || !casc) {
        error(
          `!!! Insufficient arguments || sections > ${!!sections} | casc > ${!!casc} !!!`
        );
        return;
      }
      if (event) {
        debug('checking for initial functions');
        this.alwaysFunctions(trigger, sections, casc); //Functions that should be run for all events.
        this.initialFunction(trigger, sections, casc); //functions that should only be run if the attribute was the thing changed by the user
      }
      if (trigger) {
        this.triggerFunctions(trigger, sections, casc);
        if (
          !event &&
          trigger.calculation &&
          kvars.funcs.has(trigger.calculation)
        ) {
          this[trigger.name] = kvars.funcs.get(trigger.calculation)!({
            trigger,
            attributes: this,
            sections,
            casc,
          }) as string | number;
        } else if (
          trigger.calculation &&
          !kvars.funcs.has(trigger.calculation)
        ) {
          error(`Calculation: No function named ${trigger.calculation} found`);
        }
        if (Array.isArray(trigger.affects)) {
          this.queue.push(...trigger.affects);
        }
      }
      this.set({ sections, casc });
    },
  };
  return new Proxy(attrTarget as unknown as AttributesProxy, {
    get(target, prop, receiver) {
      if (target.hasOwnProperty(prop)) {
        return Reflect.get(target, prop, receiver);
      }
      if (typeof prop === 'symbol') {
        return;
      }
      let retValue;
      switch (true) {
        case target.repOrders.hasOwnProperty(prop):
          retValue = target.repOrders[prop as string];
          break;
        case target.updates.hasOwnProperty(prop):
          retValue = target.updates[prop as string];
          break;
        default:
          retValue = target.attributes[prop as string];
          break;
      }
      let cascRef = `attr_${prop.replace(/(repeating_[^_]+_)[^_]+/, '$1$X')}`;
      let numRetVal = +retValue;
      if (!Number.isNaN(numRetVal) && retValue !== '') {
        retValue = numRetVal;
      } else if (
        cascades[cascRef] &&
        (typeof cascades[cascRef].defaultValue === 'number' ||
          cascades[cascRef].type === 'number')
      ) {
        retValue = cascades[cascRef].defaultValue;
      }
      return retValue;
    },
    set(target, prop, value) {
      if (typeof prop === 'symbol') {
        return false;
      }
      //Sets the value. Also verifies that the value is a valid attribute value
      //e.g. not undefined, null, or NaN
      if (value || value === 0 || value === '') {
        if (/reporder|^repeating_[^_]+$/.test(prop)) {
          let section = prop.replace(/_reporder_/, '');
          target.repOrders[section] = value;
        } else if (
          `${target.attributes}` !== `${value}` ||
          (target.updates[prop] && `${target.updates}` !== `${value}`)
        ) {
          target.updates[prop] = value;
        }
      } else {
        error(
          `Attempted to set ${prop} to an invalid value:${value}; value not stored!!!`
        );
        return false;
      }
      return true;
    },
    deleteProperty(target, p) {
      if (typeof p === 'symbol') {
        return false;
      }
      let hadValue = false;
      for (const path of ['updates', 'attributes', 'repOrders'] as const) {
        if (target[path].hasOwnProperty(p.toLowerCase())) {
          hadValue = true;
          delete target[path][p.toLowerCase()];
        }
      }
      return hadValue;
    },
  });
}

/**
 * Function that registers a function for being called via the funcs object. Returns true if the function was successfully registered, and false if it could not be registered for any reason.
 * @param funcObj - Object with keys that are names to register functions under and values that are functions.
 * @param optionsObj - Object that contains options to use for this registration.
 * @param optionsObj.type - Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed.
 * @returns - True if the registration succeeded, false if it failed.
 * @example
 * //Basic Registration
 * const myFunc = function({trigger,attributes,sections,casc}){};
 * k.registerFuncs({myFunc});
 *
 * //Register a function to run on sheet open
 * const openFunc = function({trigger,attributes,sections,casc}){};
 * k.registerFuncs({openFunc},{type:['opener']})
 *
 * //Register a function to run on all events
 * const allFunc = function({trigger,attributes,sections,casc}){};
 * k.registerFuncs({allFunc},{type:['all']})
 */
export function registerFuncs(
  funcObj: Record<string, HandlerFunc>,
  optionsObj: {
    /** Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed. */
    type?: ('opener' | 'updater' | 'new' | 'all')[];
  }
): boolean;
/**
 * Function that registers a listener function for being called via the funcs object. Returns true if the function was successfully registered, and false if it could not be registered for any reason.
 * @param funcObj - Object with keys that are names to register functions under and values that are functions.
 * @param optionsObj - Object that contains options to use for this registration.
 * @returns - True if the registration succeeded, false if it failed.
 * @example
 * //Basic Registration
 * const myFunc = function(event){};
 * k.registerFuncs({myFunc},{type:'listener'});
 */
export function registerFuncs(
  funcObj: Record<string, ListenerFunc>,
  optionsObj: {
    /** To register a listener, must be 'listener' */
    type: 'listener';
  }
): boolean;
export function registerFuncs(
  funcObj: Record<string, HandlerFunc> | Record<string, ListenerFunc>,
  optionsObj: {
    type?: ('opener' | 'updater' | 'new' | 'all')[] | 'listener';
  } = {}
) {
  if (typeof funcObj !== 'object' || typeof optionsObj !== 'object') {
    error(`Improper arguments to register functions!`);
    return false;
  }
  const typeArr =
    optionsObj.type === 'listener'
      ? ['listener' as const]
      : optionsObj.type
      ? ['default' as const, ...optionsObj.type]
      : ['default' as const];
  const typeSwitch = {
    opener: kvars.openHandlers,
    updater: kvars.updateHandlers,
    new: kvars.initialSetups,
    all: kvars.allHandlers,
    default: kvars.funcs,
    listener: kvars.listenerFuncs,
  };
  let setState: boolean = false;
  Object.entries(funcObj).map(([prop, value]) => {
    typeArr.forEach((type) => {
      if (typeSwitch[type].has(prop)) {
        debug(`!!! Duplicate function name for ${prop} as ${type}!!!`);
        setState = false;
      } else if (typeof value === 'function') {
        typeSwitch[type].set(prop, value);
        setState = setState !== false ? true : false;
      } else {
        error(
          `Function registration requires a function. Invalid value to register as ${type}!`
        );
        setState = false;
      }
    });
  });
  return setState;
}

/**
 * Function that registers a function for being called via the funcs object. Returns true if the function was successfully registered, and false if it could not be registered for any reason.
 * @param func - function to register, must be a named function
 * @param optionsObj - Object that contains options to use for this registration.
 * @param optionsObj.type - Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed.
 * @returns - True if the registration succeeded, false if it failed.
 * @example
 * //Basic Registration
 * registerFunc(function myFunc({trigger,attributes,sections,casc}){});
 *
 * //Register a function to run on sheet open
 * registerFunc(function openFunc({trigger,attributes,sections,casc}){},{type:['opener']})
 *
 * //Register a function to run on all events
 * registerFunc(function allFunc({trigger,attributes,sections,casc}){},{type:['all']})
 */
export function registerFunc(
  func: HandlerFunc,
  optionsObj?: {
    /** Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed. */
    type?: ('opener' | 'updater' | 'new' | 'all')[];
  }
): boolean;
/**
 * Function that registers a function for being called via the funcs object. Returns true if the function was successfully registered, and false if it could not be registered for any reason.
 * @param func - function to register, must be a named function
 * @param optionsObj - Object that contains options to use for this registration.
 * @returns - True if the registration succeeded, false if it failed.
 * @example
 * //Basic Registration
 * registerFunc(function myListener(event){});
 */
export function registerFunc(
  func: ListenerFunc,
  optionsObj: {
    /** Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed. */
    type: 'listener';
  }
): boolean;
export function registerFunc(
  func: HandlerFunc | ListenerFunc,
  optionsObj: {
    /** Array that contains the types of specialized functions that apply to the functions being registered. Valid types are `"opener"`, `"updater"`, and `"default"`. `"default"` is always used, and never needs to be passed. */
    type?: Array<'opener' | 'updater' | 'new' | 'all'> | 'listener'; // ('opener' | 'updater' | 'new' | 'all')[] | ('listener')[];
  } = {}
): boolean {
  if (typeof func !== 'function' || !func.name) {
    error(
      `registerFunc must be passed a Function with a name. No anonymous or arrow functions!`
    );
    return false;
  } else {
    return registerFuncs(
      { [func.name]: func as HandlerFunc },
      optionsObj as {}
    );
  }
}

export function registerListener(func: ListenerFunc): boolean {
  return registerFunc(func, { type: 'listener' });
}

export function setActionCalls({
  attributes,
  sections,
}: {
  attributes: AttributesProxy;
  sections: Record<string, string[]>;
}) {
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
}

/**
 * Function to call a function previously registered to the funcs object. May not be used that much. Either returns the function or null if no function exists.
 * @param funcName - The name of the function to invoke.
 * @param args - The arguments to call the function with.
 * @returns
 * @example
 * //Call myFunc with two arguments
 * k.callFunc('myFunc','an argument','another argument');
 */
export function callFunc(funcName: string, ...args: Parameters<HandlerFunc>) {
  if (kvars.funcs.has(funcName)) {
    debug(`calling ${funcName}`);
    return kvars.funcs.get(funcName)!(...args);
  } else {
    error(`Missing function registration for: ${funcName}`);
    return null;
  }
}
