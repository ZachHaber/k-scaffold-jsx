export interface Trigger {
  /**
   * The name of the attribute without the `act_` or `attr_` prefix.
   */
  name: string;
  /**
   * the type of the attribute. Autopopulated from the `type` property from the attribute definition in the HTML
   */
  type?: string;
  /**
   * attribute names that this value will affect, continues the cascade
   */
  affects?: string[];
  /**
   * The listener text to be used in a [roll20 event listener](https://wiki.roll20.net/Sheet_Worker_Scripts#Event_listener)
   */
  listener?: string;
  /**
   * Name of the function to call from the [roll20 event listener](https://wiki.roll20.net/Sheet_Worker_Scripts#Event_listener). It's used as a string to call the function from the {@link kvars.funcs} map.
   */
  listenerFunc?: string;
  /**
   * Array of function names that should be called any time this attribute is changed or affected.
   */
  triggeredFuncs?: string[];
  /**
   * Array of function names that should be called any time the `addItem` listenerFunc is called.
   *
   * Which should be used when a new item is added to a Repeater
   */
  addFuncs?: string[];
  /**
   *  Name of function to call only when the attribute is the change event that triggered the listener.
   */
  initialFunc?: string;
  /**
   * The default value of the attribute. Not used for buttons. Autopopulated from the `value` property of the HTML definition of the attribute.
   */
  defaultValue?: string | number;
  /**
   * Name of function to call to calculate the value of this attribute.
   */
  calculation?: string;
}

/**
 * Replaces problem characters to use a string as a regex
 * @param text - The text to replace characters in
 * @example
 * const textForRegex = sanitizeForRegex('.some thing[with characters]');
 * console.log(textForRegex);// => "\.some thing\[with characters\]"
 */
export function sanitizeForRegex(text: string): string {
  return text.replace(/\.|\||\(|\)|\[|\]|\-|\+|\?|\/|\{|\}|\^|\$|\*/g, '\\$&');
}

/**
 * Converts a value to a number, it\'s default value, or `0` if no default value passed.
 * @param val - Value to convert to a number
 * @param def - The default value, uses 0 if not passed
 * @example
 * const num = toNumber('100');
 * console.log(num);// => 100
 */
export function toNumber(
  val: string | number,
  def?: number
): number | undefined {
  return +val || def || 0;
}

export type RepeaterBaseName = `repeating_${string}`;

export function toRepeaterBaseName(section: string): RepeaterBaseName {
  if (isRepeaterGenericName(section)) {
    return section.slice(0, -4) as RepeaterBaseName;
  }
  return `repeating_${section}`;
}
export function isRepeaterBaseName(string: string): string is RepeaterBaseName {
  return string.startsWith('repeating_') && !string.endsWith('_$X_');
}
export type RepeaterGenericName = `${RepeaterBaseName}_$X_`;
export function isRepeaterGenericName(
  string: string
): string is RepeaterGenericName {
  return string.startsWith('repeating_') && string.endsWith('_$X_');
}
export function toRepeaterGenericName(
  section: string | RepeaterBaseName
): RepeaterGenericName {
  if (isRepeaterBaseName(section)) {
    return `${section}_$X_`;
  }
  return `repeating_${section}_$X_`;
}

/**
 * Extracts the section (e.g. `repeating_equipment`), rowID (e.g `-;lkj098J:LKj`), and field name (e.g. `bulk`) from a repeating attribute name.
 * @param string - The string to parse
 * @returns - Array of matches. (without the overall match) Index 0: the section name, e.g. repeating_equipment | Index 1:the row ID | index 2: The name of the attribute
 * @example
 * //Extract info from a full repeating name
 * const [section,rowID,attrName] = k.parseRepeatName('repeating_equipment_-8908asdflkjZlkj23_name');
 * console.log(section);// => "repeating_equipment"
 * console.log(rowID);// => "-8908asdflkjZlkj23"
 * console.log(attrName);// => "name"
 *
 * //Extract info from just a row name
 * const [section,rowID,attrName] = k.parseRepeatName('repeating_equipment_-8908asdflkjZlkj23');
 * console.log(section);// => "repeating_equipment"
 * console.log(rowID);// => "-8908asdflkjZlkj23"
 * console.log(attrName);// => undefined
 */
export function parseRepeatName(
  string: string
): [section: string, rowId: string, fieldName: string | undefined] | null {
  let match = string.match(/(repeating_[^_]+)_([^_]+)(?:_(.+))?/);
  match?.shift();
  return match as [string, string, string | undefined] | null;
}

export function parseTriggerName(
  string: `repeating_${string}_${string}`
): [section: string, rowId: string, fieldName: string];
export function parseTriggerName(
  string: string
):
  | [section: undefined, rowId: undefined, fieldName: string]
  | [section: string, rowId: string, fieldName: string];
export function parseTriggerName(string: ''): null;
/**
 * Parses out the components of a trigger name similar to {@link parseRepeatName}. Aliases: {@link parseClickTrigger}.
 *
 * Aliases: `parseClickTrigger`
 * @param  string The triggerName property of the
 * @returns - For a repeating button named `repeating_equipment_-LKJhpoi98;lj_roll`, the array will be `['repeating_equipment','-LKJhpoi98;lj','roll']`. For a non repeating button named `roll`, the array will be `[undefined,undefined,'roll']`
 * @example
 * //Parse a non repeating trigger
 * const [section,rowID,attrName] = k.parseTriggerName('clicked:some-button');
 * console.log(section);// => undefined
 * console.log(rowID);// => undefined
 * console.log(attrName);// => "some-button"
 *
 * //Parse a repeating trigger
 * const [section,rowID,attrName] = k.parseTriggerName('clicked:repeating_attack_-234lkjpd8fu8usadf_some-button');
 * console.log(section);// => "repeating_attack"
 * console.log(rowID);// => "-234lkjpd8fu8usadf"
 * console.log(attrName);// => "some-button"
 *
 * //Parse a repeating name
 * const [section,rowID,attrName] = k.parseTriggerName('repeating_attack_-234lkjpd8fu8usadf_some-button');
 * console.log(section);// => "repeating_attack"
 * console.log(rowID);// => "-234lkjpd8fu8usadf"
 * console.log(attrName);// => "some-button"
 */
export function parseTriggerName(
  string: string
):
  | [section: string, rowId: string, fieldName: string]
  | [section: undefined, rowId: undefined, fieldName: string]
  | null {
  let match = string
    .replace(/^clicked:/, '')
    .match(/(?:(repeating_[^_]+)_([^_]+)_)?(.+)/);
  match?.shift();
  return match as
    | [string, string, string]
    | [undefined, undefined, string]
    | null;
}

/**
 * @see {@link parseTriggerName}
 */
export const parseClickTrigger = parseTriggerName;

/**
 * Parses out the attribute name from the htmlattribute name.
 * @param string - The triggerName property of the [event](https://wiki.roll20.net/Sheet_Worker_Scripts#eventInfo_Object).
 * @example
 * //Parse a name
 * const attrName = k.parseHtmlName('attr_attribute_1');
 * console.log(attrName);// => "attribute_1"
 */
export function parseHTMLName<T extends string>(
  string: T
): T extends `${'attr' | 'act' | 'roll'}_${infer R}`
  ? R
  : T extends Uppercase<T> & Lowercase<T>
  ? string | undefined
  : undefined {
  let match = string.match(/(?:attr|act|roll)_(.+)/);
  return match?.[1] as ReturnType<typeof parseHTMLName<T>>;
}

/**
 * Capitalize each word in a string
 * @param string - The string to capitalize
 * @example
 * const capitalized = k.capitalize('a word');
 * console.log(capitalized);// => "A Word"
 */
export function capitalize(string: string): string {
  return string.replace(/(?:^|\s+|\/)[a-z]/gi, (letter) =>
    letter.toUpperCase()
  );
}

/**
 * Splits a comma delimited string into an array
 * @param string - The string to split.
 * @returns - The string segments of the comma delimited list.
 */
export function commaArray(string: string = ''): string[] {
  return string.toLowerCase().split(/\s*,\s*/);
}

export function serialize(value: any) {
  return JSON.stringify(
    value,
    (_key, value) => {
      if (value instanceof Set) {
        return { '@@prototype': 'Set', value: Array.from(value) };
      }
      if (value instanceof Map) {
        return { '@@prototype': 'Map', value: Array.from(value) };
      }
      return value;
    },
    2
  );
}

export function deserialize(value: any) {
  return JSON.parse(value, (_key, value) => {
    if (!value) {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value['@@prototype'] === 'Set') {
        return new Set(value.value);
      }
      if (value['@@prototype'] === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  });
}

/**
 * https://github.com/jashkenas/underscore/blob/master/modules/range.js
 * @param start
 * @param stop
 * @param step
 */
export function range(start: number, stop?: number, step?: number): number[];
export function range(stop: number): number[];
export function range(
  startOrStop: number,
  stop?: number,
  step?: number
): number[] {
  if (stop == null) {
    stop = startOrStop || 0;
    startOrStop = 0;
  }
  if (!step) {
    step = stop < startOrStop ? -1 : 1;
  }
  const length = Math.max(Math.ceil(stop - startOrStop) / step, 0);
  const range = Array(length);
  for (var idx = 0; idx < length; idx++, startOrStop += step) {
    range[idx] = startOrStop;
  }
  return range;
}
