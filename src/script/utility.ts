import { AttributesProxy } from './attributesProxy.js';
import { kvars } from './kvariables.js';
export * from '../utility.js';
/**
 * Extracts a roll query result for use in later functions. Must be awaited as per [startRoll documentation](https://wiki.roll20.net/Sheet_Worker_Scripts#Roll_Parsing.28NEW.29). Stolen from [Oosh\'s Adventures with Startroll thread](https://app.roll20.net/forum/post/10346883/adventures-with-startroll).
 * @param {string} query - The query should be just the text as the `?{` and `}` at the start/end of the query are added by the function.
 * @returns {Promise} - Resolves to the selected value from the roll query
 * @example
 * const rollFunction = async function(){
 *  //Get the result of a choose from list query
 *  const queryResult = await extractQueryResult('Prompt Text Here|Option 1|Option 2');
 *  console.log(queryResult);//=> "Option 1" or "Option 2" depending on what the user selects
 *
 *  //Get free from input from the user
 *  const freeResult = await extractQueryResult('Prompt Text Here');
 *  consoel.log(freeResult);// => Whatever the user entered
 * }
 */
export async function extractQueryResult(query: string): Promise<any> {
  debug('entering extractQueryResult');
  let queryRoll = await startRoll(`!{{query=[[0[response=?{${query}}]]]}}`);
  finishRoll(queryRoll.rollId);
  return queryRoll.results.query.expression.replace(/^.+?response=|\]$/g, '');
}

/**
 * Simulates a query for ensuring that async/await works correctly in the sheetworker environment when doing conditional startRolls. E.g. if you have an if/else and only one of the conditions results in `startRoll` being called (and thus an `await`), the sheetworker environment would normally crash. Awaiting this in the condition that does not actually need to call `startRoll` will keep the environment in sync.
 * @param {string|number} [value] - The value to return. Optional.
 * @returns {Promise} - Resolves to the value passed to the function
 * @example
 * const rollFunction = async function(){
 *  //Get the result of a choose from list query
 *  const queryResult = await pseudoQuery('a value');
 *  console.log(queryResult);//=> "a value"
 * }
 */
export async function pseudoQuery(value: string | number): Promise<any> {
  debug('entering pseudoQuery');
  let queryRoll = await startRoll(`!{{query=[[0[response=${value}]]]}}`);
  finishRoll(queryRoll.rollId);
  return queryRoll.results.query.expression.replace(/^.+?response=|\]$/g, '');
}

export function error(...msg: any[]): void {
  console.error(`${kvars.sheetName}|`, ...msg);
}

/**
 * An alias for console.log.
 * @param msg The message can be a straight string, an object, or an array. If it is an object or array, the object will be broken down so that each key is used as a label to output followed by the value of that key. If the value of the key is an object or array, it will be output via `console.table`.
 */
export function log(...msg: any[]): void {
  console.log(`${kvars.sheetName}|`, ...msg);
}

/**
 * Alias for console.log that only triggers when debug mode is enabled or when the sheet\'s version is `0`. Useful for entering test logs that will not pollute the console on the live sheet.
 * @param msg 'See {@link k.log}
 * @param force Pass as a truthy value to force the debug output to be output to the console regardless of debug mode.
 */
export function debug(...msg: any[]): void {
  if (!kvars.debugMode && kvars.version > 0) return;
  console.debug(`${kvars.sheetName}|`, ...msg);
}

/**
 * Orders the section id arrays for all sections in the `sections` object to match the repOrder attribute.
 * @param attributes The attributes object that must have a value for the reporder for each section.
 * @param sections Object containing the IDs for the repeating sections, indexed by repeating section name.
 */
export function orderSections(
  attributes: AttributesProxy,
  sections: {
    [section: string]: string[];
  }
) {
  Object.keys(sections).forEach((section) => {
    attributes.setRepOrder(
      section,
      orderSection(attributes.getRepOrder(section), sections[section])
    );
  });
}

/**
 * Orders a single ID array immutably.
 * @param {[string]} repOrder - Array of IDs in the order they are in on the sheet.
 * @param {[string]} IDs - Array of IDs to be ordered.
 */
export function orderSection(repOrder: string[], IDs: string[] = []) {
  IDs.slice().sort((a, b) => {
    return (
      repOrder.indexOf(a.toLowerCase()) - repOrder.indexOf(b.toLowerCase())
    );
  });
  return IDs;
}
