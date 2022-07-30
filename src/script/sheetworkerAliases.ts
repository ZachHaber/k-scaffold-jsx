/*jshint esversion: 11, laxcomma:true, eqeqeq:true*/
/*jshint -W014,-W084,-W030,-W033*/

import {
  AttributesProxy,
  Cascade,
  createAttrProxy,
} from './attributesProxy.js';
import { kvars } from './kvariables.js';
import { expandCascade } from './parseCascade.js';
import { debug, orderSections } from './utility.js';
import { cascades, repeatingSectionDetails } from './_generated.js';

/**
 * Alias for [setSectionOrder()](https://wiki.roll20.net/Sheet_Worker_Scripts#setSectionOrder.28.3CRepeating_Section_Name.3E.2C_.3CSection_Array.3E.2C_.3CCallback.3E.29) that allows you to use the section name in either `repeating_section` or `section` formats. Note that the Roll20 sheetworker [setSectionOrder](https://wiki.roll20.net/Sheet_Worker_Scripts#setSectionOrder.28.3CRepeating_Section_Name.3E.2C_.3CSection_Array.3E.2C_.3CCallback.3E.29) currently causes some display issues on sheets.
 * @param {string} section
 * @param {string[]} order
 * @returns {void}
 * @example
 * //Set the order of a repeating_weapon section
 * k.setSectionOrder('repeating_equipment',['id1','id2','id3']);
 * //Can also specify the section name without the repeating_ prefix
 * k.setSectionOrder('equipment',['id1','id2','id3']);
 */
export function kSetSectionOrder(section: string, order: string[]): void {
  let trueSection = section.replace(/repeating_/, '');
  setSectionOrder(trueSection, order);
}

/**
 * Alias for [removeRepeatingRow](https://wiki.roll20.net/Sheet_Worker_Scripts#removeRepeatingRow.28_RowID_.29) that also removes the row from the current object of attribute values and array of section IDs to ensure that erroneous updates are not issued.
 * @param {string} row - The row id to be removed
 * @param {attributesProxy} attributes - The attribute values currently in memory
 * @param {object} sections - Object that contains arrays of all the IDs in sections on the sheet indexed by repeating name.
 * @returns {void}
 * @example
 * //Remove a repeating Row
 * k.getAllAttrs({
 *  callback:(attributes,sections)=>{
 *    const rowID = sections.repeating_equipment[0];
 *    k.removeRepeatingRow(`repeating_equipment_${rowID}`,attributes,sections);
 *    console.log(sections.repeating_equipment); // => rowID no longer exists in the array.
 *    console.log(attributes[`repeating_equipment_${rowID}_name`]); // => undefined
 *  }
 * })
 */
export function kRemoveRepeatingRow(
  row: string,
  attributes: AttributesProxy,
  sections: { [section: string]: string[] }
): void {
  const match = row.match(/(repeating_[^_]+)_(.+)/);
  if (!match) {
    // Fail if the input is invalid to prevent accidental loss
    return;
  }
  debug(`removing ${row}`);
  Object.keys(attributes.attributes).forEach((key) => {
    if (key.startsWith(row)) {
      delete attributes[key];
    }
  });
  const [, section, rowID] = match;
  sections[section] = sections[section].filter((id) => id !== rowID);
  removeRepeatingRow(row);
}

/**
 * Alias for [getAttrs()](https://wiki.roll20.net/Sheet_Worker_Scripts#getAttrs.28attributeNameArray.2C_callback.29) that converts the default object of attribute values into an {@link attributesProxy} and passes that back to the callback function.
 * @param {Object} args
 * @param {string[]} [args.props=baseGet] - Array of attribute names to get the value of. Defaults to {@link baseGet} if not passed.
 * @param {function(attributesProxy)} args.callback - The function to call after the attribute values have been gotten. An {@link attributesProxy} is passed to the callback.
 * @example
 * //Gets the attributes named in props.
 * k.getAttrs({
 *  props:['attribute_1','attribute_2'],
 *  callback:(attributes)=>{
 *    //Work with the attributes as you would in a normal getAttrs, or use the superpowers of the K-scaffold attributes object like so:
 *    attributes.attribute_1 = 'new value';
 *    attributes.set();
 *  }
 * })
 */
export function kGetAttrs({
  props = kvars.baseGet,
  callback,
}: {
  props?: string[];
  callback: (attrProxy: AttributesProxy) => void;
}) {
  getAttrs(props, (values) => {
    callback(createAttrProxy(values));
  });
}

/**
 * Alias for [getAttrs()](https://wiki.roll20.net/Sheet_Worker_Scripts#getAttrs.28attributeNameArray.2C_callback.29) and [getSectionIDs](https://wiki.roll20.net/Sheet_Worker_Scripts#getSectionIDs.28section_name.2Ccallback.29) that combines the actions of both sheetworker functions and converts the default object of attribute values into an {@link attributesProxy}. Also gets the details on how to handle all attributes from the master {@link cascades} object and.
 * @param {Object} param0
 * @param {string[]} [args.props=baseGet] - Array of attribute names to get the value of. Defaults to {@link baseGet} if not passed.
 * @param {repeatingSectionDetails} sectionDetails - Array of details about a section to get the IDs for and attributes that need to be gotten.
 * @param {(attributesProxy,sectionObj,expandedCascade)=>void} args.callback - The function to call after the attribute values have been gotten. An {@link attributesProxy} is passed to the callback along with a {@link sectionObj} and {@link expandedCascade}.
 * @example
 * //Get every K-scaffold linked attribute on the sheet
 * k.getAllAttrs({
 *  callback:(attributes,sections,casc)=>{
 *    //Work with the attributes as you please.
 *    attributes.some_attribute = 'a value';
 *    attributes.set();//Apply our change
 *  }
 * })
 */
export function getAllAttrs({
  props = kvars.baseGet,
  sectionDetails = repeatingSectionDetails,
  callback,
}: {
  props?: string[];
  sectionDetails?: SectionDetail[];
  callback: (
    attributes: AttributesProxy,
    sections: Record<string, string[]>,
    expandedCascade: Cascade
  ) => void;
}) {
  getSections(sectionDetails, (repeats, sections) => {
    getAttrs([...props, ...repeats], (values) => {
      const attributes = createAttrProxy(values);
      orderSections(attributes, sections);
      const casc = expandCascade(cascades, sections);
      callback(attributes, sections, casc);
    });
  });
}

interface SectionDetail {
  section: string;
  fields: string[];
}

/**
 * Alias for [getSectionIDs()](https://wiki.roll20.net/Sheet_Worker_Scripts#getSectionIDs.28section_name.2Ccallback.29) that allows you to iterate through several functions at once. Also assembles an array of repeating attributes to get.
 * @param {object[]} sectionDetails - Array of details about a section to get the IDs for and attributes that need to be gotten.
 * @param {string} sectionDetails.section - The full name of the repeating section including the `repeating_` prefix.
 * @param {string[]} sectionDetails.fields - Array of field names that need to be gotten from the repeating section
 * @param {function(string[],sectionObj)} callback - The function to call once all IDs have been gotten and the array of repating attributes to get has been assembled. The callback is passed the array of repating attributes to get and a {@link sectionObj}.
 * @example
 * // Get some section details
 * const sectionDetails = {
 *  {section:'repeating_equipment',fields:['name','weight','cost']},
 *  {section:'repeating_weapon',fields:['name','attack','damage']}
 * };
 * k.getSections(sectionDetails,(attributeNames,sections)=>{
 *  console.log(attributeNames);// => Array containing all row specific attribute names
 *  console.log(sections);// => Object with arrays containing the row ids. Indexed by section name (e.g. repeating_eqiupment)
 * })
 */
export function getSections(
  sectionDetails: SectionDetail[],
  callback: (attrs: string[], sections: Record<string, string[]>) => void
) {
  let queueClone = _.clone(sectionDetails);
  const worker = (
    queue: SectionDetail[],
    repeatAttrs: string[] = [],
    sections: Record<string, string[]> = {}
  ) => {
    let detail = queue.shift();
    if (!detail) {
      return callback(repeatAttrs, sections);
    }
    // Will look nicer as async, instead of callbacks
    getSectionIDs(detail.section, (IDs) => {
      sections[detail!.section] = IDs;
      IDs.forEach((id) => {
        detail!.fields.forEach((f) => {
          repeatAttrs.push(`${detail!.section}_${id}_${f}`);
        });
      });
      repeatAttrs.push(`_reporder_${detail!.section}`);
      worker(queue, repeatAttrs, sections);
    });
  };
  if (!queueClone[0]) {
    callback([], {});
  } else {
    worker(queueClone);
  }
}

// Sets the attributes while always calling with {silent:true}
// Can be awaited to get the values returned from _setAttrs
/**
 * Alias for [setAttrs()](https://wiki.roll20.net/Sheet_Worker_Scripts#setAttrs.28values.2Coptions.2Ccallback.29) that sets silently by default.
 * @param  obj - The object containting attributes to set
 * @param  vocal - Whether to set silently (default value) or not.
 * @param callback - The callback function to invoke after the setting has been completed. No arguments are passed to the callback function.
 * @example
 * //Set some attributes silently
 * k.setAttrs({attribute_1:'new value'})
 * //Set some attributes and triggers listeners
 * k.setAttrs({attribute_1:'new value',true})
 * //Set some attributes and call a callback function
 * k.setAttrs({attribute_1:'new value'},null,()=>{
 *  //Do something after the attribute is set
 * })
 */
export function set(
  obj: Record<string, AttributeContent>,
  vocal = false,
  callback?: () => void
) {
  setAttrs(obj, { silent: !vocal }, callback);
}
export const kSetAttrs = set;

export function generateCustomID(string: string) {
  if (!string.startsWith('-')) {
    string = `-${string}`;
  }
  const rowID = generateRowID();
  let re = new RegExp(`^.{${string.length}}`);
  return `${string}${rowID.replace(re, '')}`;
}

/**
 * Alias for generateRowID that adds the new id to the {@link sectionObj}. Also allows for creation of custom IDs that conform to the section ID requirements.
 * @param  sections
 * @param  customText - Custom text to start the ID with. This text should not be longer than the standard repeating section ID format.
 * @returns  - The created ID
 * @example
 * k.getAllAttrs({
 *  callback:(attributes,sections,casc)=>{
 *    //Create a new row ID
 *    const rowID = k.generateRowID('repeating_equipment',sections);
 *    console.log(rowID);// => -p8rg908ug0suzz
 *    //Create a custom row ID
 *    const customID = k.generateRowID('repeating_equipment',sections,'custom');
 *    console.log(customID);// => -custom98uadj89kj
 *  }
 * });
 */
export function _generateRowID(
  section: string,
  sections: Record<string, String[]>,
  customText?: string
) {
  let rowID = customText ? generateCustomID(customText) : generateRowID();
  section = section.match(/^repeating_[^_]+$/)
    ? section
    : `repeating_${section}`;
  sections[section] = sections[section] || [];
  sections[section].push(rowID);
  return `${section}_${rowID}`;
}
