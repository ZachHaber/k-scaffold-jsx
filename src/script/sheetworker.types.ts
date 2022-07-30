import underscore from 'underscore';

declare global {
  const _: typeof underscore;

  interface EventInfo {
    /**
     * 	The original attribute that triggered the event. It is the full name (including RowID if in a repeating section) of the attribute that originally triggered this event.
     *
     * Note: The entire string will have been translated into lowercase and thus might not be suitable for being fed directly into getAttrs().
     */
    sourceAttribute: string;
    /**
     * The agent that triggered the event, either `player` or `sheetworker`
     */
    sourceType: 'player' | 'sheetworker';
    /**
     * The original value of the attribute in an `on:change` event, before the attribute was changed.
     */
    previousValue: string;
    /**
     * The value to which the attribute in an on:change event has changed.
     */
    newValue: string;
    /**
     * 	An object containing the values of all the attributes removed in a remove:repeating_groupname event.
     */
    removedInfo: Object;
    /**
     * 	When changing a value it is equal to the `sourceAttribute`, being the full name (including RowID if in a repeating section)
     *
     * When removing a repeating row it contains the bound trigger name for the repeating section, including the `remove` keyword, i.e. `remove:repeating_section`
     */
    triggerName: string;
  }

  type AttributeContent = string | number | boolean | string;

  function getAttrs<T extends string>(
    attributeNameArray: T[],
    cb: (values: Record<T, string>) => void
  ): void;
  //  function getAttrs(
  //   attributes: string[],
  //   callback?: (values: { [key: string]: string }) => void
  // ): void;

  /**
   *
   * @param values This is an object whose properties are the names of attributes (without the attr_ prefix) and whose values are what you want to set that attribute to.
   * @param options (Optional) This is an object that specifies optional behavior for the function. Currently the only option is "silent", which prevents propagation of change events from setting the supplied attributes.
   * @param callback (Optional) This is a callback function which will be executed when the set attributes have been updated.
   *
   * The setAttrs function allows you to set the attributes of the character sheet. Use the `_max`-suffix to set the max value of an attribute. For example `Strength_max`.
   * @example
   * ```
   * on("change:strength", function() {
   *    getAttrs(["Strength", "Level"], function(values) {
   *       setAttrs({
   *           StrengthMod: Math.floor(values.Strength / 2)
   *       });
   *    });
   * });
   * ```
   * Note: If you are trying to update a disabled input field with this method you may run into trouble. One option is to use this setAttrs method to set a hidden input, then set the disabled input to the hidden element. In this example we have an attribute named will, and we want to calculate judgement based off 1/2 of the will stat, but not to allow it to exceed 90. See below.
   * @example
   * ```html
   * <label>Judgment</label>
   * <input type="hidden" name="attr_foo_judgment" value="0" />
   * <input type="number" name="attr_judgment" value="@{foo_judgment}" disabled="true" title="1/2 of will rounded down, 90 max" />
   * ```
   * js
   * ```js
   * on("change:will", function() {
   *   getAttrs(["will"], function(values) {
   *     setAttrs({ foo_judgment: Math.min(90, (values.will/2)) });
   *   });
   * });
   * ```
   * Although setAttrs is an asynchronous function and there is no guarantee to which order the actual attributes will be set for multiple setAttrs() calls.
   *
   * For repeating sections, you have the option of using the simple variable name if the original event is in a repeating section, or you can specify the full repeating section variable name including ID in any event.
   * @example
   * on("change:repeating_spells:spelllevel", function() {
   *    getAttrs(["repeating_spells_SpellLevel", "repeating_spells_SpellName"], function(values) {
   *       setAttrs({
   *          repeating_spells_SpellDamage: Math.floor(values.repeating_spells_SpellLevel / 2) + 10
   *       });
   *    });
   * });
   */
  function setAttrs(
    values: { [key: string]: AttributeContent },
    options?: { silent?: boolean },
    callback?: (values: { [key: string]: string }) => void
  ): void;

  function getSectionIDs(
    section_name: string,
    callback: (values: string[]) => void
  ): void;

  /**
   * A synchronous function which immediately returns a new random ID which you can use to create a new repeating section row. If you use setAttrs() and pass in the ID of a repeating section row that doesn't exist, one will be created with that ID.
   *
   * Here's an example you can use to create a new row in a repeating section:
   * @example
   * var newrowid = generateRowID();
   * var newrowattrs = {};
   * newrowattrs["repeating_inventory_" + newrowid + "_weight"] = "testnewrow";
   * setAttrs(newrowattrs);
   */
  function generateRowID(): string;

  /**
   * A synchronous function which will immediately remove all the attributes associated with a given RowID and then remove the row from the character sheet. The RowID should be of the format repeating_<sectionname>_<rowid>. For example, repeating_skills_-KbjuRmBRiJNeAJBJeh2.
   *
   * Here is an example of clearing out a summary list when the original list changes:
   * @example
   * on("change:repeating_inventory", function() {
   *    getSectionIDs("repeating_inventorysummary", function(idarray) {
   *       for(var i=0; i < idarray.length; i++) {
   *         removeRepeatingRow("repeating_inventorysummary_" + idarray[i]);
   *       }
   *    });
   * });
   * @param RowID
   */
  function removeRepeatingRow(RowID: string): void;

  function setSectionOrder(
    repeatingSectionName: string,
    sectionArray: string[],
    callback?: () => {}
  ): void;

  /**
   * A synchronous function which immediately returns the translation string related to the given key. If no key exists, false will be returned and a message in the console will be thrown which list the specific key that was not found in the translation JSON.
   *
   * Here's an example you can use to fetch a translation string from the translation JSON: With the following translation JSON
   * @example
   * json
   * ```
   * {
   *     "str": "Strength",
   *     "dex": "Dexterity"
   * }
   * ```
   * js
   * ```js
   * var strTranslation = getTranslationByKey('str'); // "Strength"
   * var dexTranslation = getTranslationByKey('dex'); // "Dexterity"
   * var intTranslation = getTranslationByKey('int'); // false
   * ```
   * @param key
   */
  function getTranslationByKey(key: string): string | false;
  /**
   * A synchronous function which immediately returns the 2-character language code for the user's selected language.
   *
   * Here's an example you can use to fetch the translation language:
   * @example
   * var translationLang = getTranslationLanguage(); // "en" , for an account using English
   */
  function getTranslationLanguage(): string;

  /**
   * A function that allows the sheet author to determine what attributes are set on character dropped from the compendium. When setting the default token after a compendium drop, this function can set any attributes on the default token to tie in important attributes specific to that character sheet, such as attr_hit_points.
   *
   * The list of token attributes that can be set by setDefaultToken are:
   * ```
   * ["bar1_value","bar1_max","bar2_value","bar2_max","bar3_value","bar3_max","aura1_square","aura1_radius","aura1_color","aura2_square","aura2_radius","aura2_color",
   * "tint_color","showname","showplayers_name","playersedit_name","showplayers_bar1","playersedit_bar1","showplayers_bar2","playersedit_bar2","showplayers_bar3",
   * "playersedit_bar3","showplayers_aura1","playersedit_aura1","showplayers_aura2","playersedit_aura2","light_radius","light_dimradius","light_angle","light_otherplayers",
   * "light_hassight","light_losangle","light_multiplier"]
   * ```
   * @example
   *
   * on("sheet:compendium-drop", function() {
   *     var default_attr = {};
   *     default_attr["width"] = 70;
   *     default_attr["height"] = 70;
   *     default_attr["bar1_value"] = 10;
   *     default_attr["bar1_max"] = 15;
   *     setDefaultToken(default_attr);
   * });
   * @param values
   */
  function setDefaultToken(values: { [key: string]: string }): void;

  /**
   * Undocumented roll20 function
   *
   * Gets the currently active character sheet id.
   */
  function getActiveCharacterId(): string;

  //  EventTypesWithNames = `change`

  //  type EventTypes = `change:${string}`|`removed:${string}`|'sheet:opened'|''

  function on(event: string, callback: (eventInfo: EventInfo) => void): void;

  interface RollResult {
    result: number;
    dice: number[];
    expression: string;
    rolls: { dice: number; sides: number; results: number[] }[];
  }
  /**
   * @example
   * results: {
   *   roll1: {
   *       // The result of the roll, as calculated by the roll server
   *       result: 48,
   *       // An ordered array of the results of all dice in this roll
   *       dice: [9,9,20,4,4,1],
   *       // The original expression for this roll
   *       expression: ‘4d20+2d4’,
   *       // A breakdown of each “sub-roll” (each part of an expression is rolled separately)
   *       rolls: [
   *           {
   *               // The ‘4’ in ‘4d20’
   *               dice: 4,
   *               // The ‘20’ in ‘4d20’
   *               sides: 20,
   *               // Array of the results of each die
   *               results: [9,9,20,4]
   *           },
   *           …
   *       ]
   *   },
   *   …
   * }
   */
  interface RollResults {
    rollId: string;
    results: {
      [rollname: string]: RollResult;
    };
  }

  /**
   * This function accepts a roll as a string (generally a roll template string). The function will initiate a roll to the roll server, the results for which will be returned to the callback. The roll will wait for a corresponding finishRoll function call before posting the results to chat, however if the finishRoll call is not made within 5 seconds, the roll will be posted automatically. The results from the roll server will be an object containing the following properties
   * @param roll
   */
  function startRoll(roll: string): Promise<RollResults>;
  function startRoll(
    roll: string,
    callback: (results: RollResults) => void
  ): void;

  function finishRoll(
    rollId: string,
    computedResults?: { [rollName: string]: string | number }
  ): void;

  type JEvent = 'change' | 'click' | 'hover' | 'mouseenter' | 'mouseleave';

  interface JEventInfo {
    htmlAttributes: {
      class?: string;
      id?: string;
      tagName?: string;
      [key: string]: string | undefined;
    };
    altKey?: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    pageX?: number;
    pageY?: number;
  }

  interface JElement {
    on(event: JEvent, callback: JEventInfo): this;
    addClass(className: string): this;
    removeClass(className: string): this;
    toggleClass(className: string): this;
  }

  function $20(selector: string): JElement;
}
