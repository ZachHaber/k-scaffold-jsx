/*jshint esversion: 11, laxcomma:true, eqeqeq:true*/
/*jshint -W014,-W084,-W030,-W033*/
/*
Cascade Expansion functions
*/

import { Cascade } from './attributesProxy.js';
import { Trigger } from '../utility.js';

type CascadeMemo = Record<string, Trigger>;
//Expands the repeating section templates in cascades to reflect the rows actually available
export function expandCascade(
  cascade: Cascade,
  sections: Record<string, string[]>
) {
  return _.keys(cascade).reduce<CascadeMemo>((memo, key) => {
    //iterate through cascades and replace references to repeating attributes with correct row ids.
    if (/^(?:act|attr)_repeating_/.test(key)) {
      //If the attribute is a repeating attribute, do special logic
      expandRepeating(memo, key, cascade, sections);
    } else if (key) {
      //for non repeating attributes do this logic
      expandNormal(memo, key, cascade, sections);
    }
    return memo;
  }, {});
}

export function expandRepeating(
  memo: CascadeMemo,
  key: string,
  cascade: Cascade,
  sections: Record<string, string[]>
) {
  key.replace(
    /((?:attr|act)_)(repeating_[^_]+)_[^_]+?_(.+)/,
    (match, type, section, field) => {
      (sections[section] || []).forEach((id) => {
        memo[`${type}${section}_${id}_${field}`] = _.clone(cascade[key]); //clone the details so that each row's attributes have correct ids
        memo[
          `${type}${section}_${id}_${field}`
        ].name = `${section}_${id}_${field}`;
        if (key.startsWith('attr_')) {
          memo[`${type}${section}_${id}_${field}`].affects =
            memo[`${type}${section}_${id}_${field}`].affects?.reduce<string[]>(
              (m, affected) => {
                if (section === affected) {
                  //otherwise if the affected attribute is in the same section, simply set the affected attribute to have the same row id.
                  m.push(applyID(affected, id));
                } else if (/repeating/.test(affected)) {
                  //If the affected attribute isn't in the same repeating section but is still a repeating attribute, add all the rows of that section
                  addAllRows(affected, m, sections);
                } else {
                  //otherwise the affected attribute is a non repeating attribute. Simply add it to the computed affected array
                  m.push(affected);
                }
                return m;
              },
              []
            ) ?? [];
        }
      });
      return '';
    }
  );
}

export function applyID(affected: string, id: string) {
  return affected.replace(/(repeating_[^_]+_)[^_]+(.+)/, `$1${id}$2`);
}

export function expandNormal(
  memo: CascadeMemo,
  key: string,
  cascade: Cascade,
  sections: Record<string, string[]>
) {
  memo[key] = _.clone(cascade[key]);
  if (key.startsWith('attr_')) {
    memo[key].affects =
      memo[key].affects?.reduce<string[]>((m, a) => {
        if (/^repeating/.test(a)) {
          addAllRows(a, m, sections);
        } else {
          m.push(a);
        }
        return m;
      }, []) ?? [];
  }
}

export function addAllRows(
  affected: string,
  memo: string[],
  sections: Record<string, string[]>
) {
  affected.replace(
    /(repeating_[^_]+?)_[^_]+?_(.+)/,
    (match, section, field) => {
      sections[section].forEach((id) => memo.push(`${section}_${id}_${field}`));
      return '';
    }
  );
}
