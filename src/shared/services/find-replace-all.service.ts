import { Injectable } from '@angular/core';
import { List, Map } from 'immutable';

@Injectable()
export class FindReplaceAllService {

  // TODO: fix compiler errors when type of immutable `List<any> | Map<string, any>`
  /**
   * Does deep replace when it finds the occurance in an immutable List and Map
   * uses schema to skip disabled properties
   *
   * @param {List<any> | Map<string, any} immutable
   * @param {Object} schema
   * @param {string} find
   * @param {replace} replace
   * @param {boolean} matchWhole - looks for whole match to a string property of immutable
   * @param {Array<any> | Object} diffHtml - TODO: describe
   */
  findReplaceInImmutable(immutable: any, schema: Object, find: string, replace: string, matchWhole = false, diffHtml?: Array<any> | Object):
    { replaced: any, diffHtml: Array<any> | Object } {
    let immutableAsMutable = immutable.asMutable();
    let isList = List.isList(immutable);
    // create empty array or object for the immutable to store diff
    diffHtml = isList ? [] : {};
    immutableAsMutable.forEach((value, key) => {
      let innerSchema = isList ? schema['items'] : schema['properties'][key];
      // ignore disabled and ref fields
      if (innerSchema['disabled'] || innerSchema['hidden'] || key === '$ref') {
        return;
        // TODO: is `schema['type'] === 'string'` better?
      } else if (typeof value === 'string') {
        // assign value to diff as initial, if nothing has changed it will remain same
        let diff = value;
        // create html diff for each possible change
        let singleDiffHtml = `<strong style='color: green;'>${replace}</strong><del><em style='color: red;'>${find}</em></del>`;
        if (!matchWhole) {
          let regExp = new RegExp(find, 'g');
          let replaced = value.replace(regExp, replace);
          immutableAsMutable.set(key, replaced);
          // create diff for multiple changes in value
          diff = diff.replace(regExp, singleDiffHtml);
        } else if (value === find) {
          immutableAsMutable.set(key, replace);
          diff = singleDiffHtml;
        }
        diffHtml[key] = diff;
      // TODO: is `schema['type'] === 'object' || schema['type'] === 'array'` better?
      } else if (List.isList(value) || Map.isMap(value)) {
        // create empty array or object for the value in diffHtml
        let result = this.
          findReplaceInImmutable(immutableAsMutable.get(key), innerSchema, find, replace, matchWhole, diffHtml[key]);
        diffHtml[key] = result.diffHtml;
        immutableAsMutable.set(key, result.replaced);
      }
    });
    return { replaced: immutableAsMutable.asImmutable(), diffHtml };
  }

}
