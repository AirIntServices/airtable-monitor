(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('airtable-plus'), require('fast-deep-equal')) :
  typeof define === 'function' && define.amd ? define(['airtable-plus', 'fast-deep-equal'], factory) :
  (global = global || self, global['airtable-monitor'] = factory(global.AirtablePlus, global.deepEqual));
}(this, (function (AirtablePlus, deepEqual) { 'use strict';

  AirtablePlus = AirtablePlus && AirtablePlus.hasOwnProperty('default') ? AirtablePlus['default'] : AirtablePlus;
  deepEqual = deepEqual && deepEqual.hasOwnProperty('default') ? deepEqual['default'] : deepEqual;

  /**
   * Comparison function, handling the following Airtable field types :
   * - link to multiple records
   * - link to single record
   * - lookup
   * - single select
   * - multiple select
   * - date
   * - duration
   * - phone
   * - email
   * - url
   * - number
   * - currency
   * - percent
   * - count
   * - rating
   * - single line text
   * - long text
   * - created time
   * - last modified time
   * - checkbox
   * - barcode
   * - attachments
   * - collaborator
   * - formula
   * - rollup
   * @param {*} a - Left comparison operand.
   * @param {*} b - Right comparison operand.
   */
  const airtableFieldValuesAreEqual = (a, b) => {
    // If one of the values is falsy and not the other, they're not equal
    if ((!a && b) || (!b && a)) return false;
    // If they are not of the same type, they're not equal
    // This can happen if a field type changed since the last check
    if (typeof a !== typeof b) return false;
    // Array type fields : link to other records, lookup, multiple select, attachments
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      if (a.length + b.length === 0) return true; // Both arrays are empty (length can't be negative)
      // Comparison for arrays of objects (i.e. attachments)
      if (typeof a[0] === 'object') {
        return a.every((e, index) => deepEqual(e, b[index]));
      }
      // For all other types, check if both arrays contain the same items
      return a.every(e => b.includes(e));
    }
    // Object type fields : barcode, collaborator
    if (a && b && typeof a === 'object') {
      return deepEqual(a, b);
    }
    // Behaves as a simple === for non-arrays
    return a === b;
  };

  /**
   * Sequentially performs an async function on every item of an array.
   * @param {Array} inputArray - The input array.
   * @param {function} func - Async function that will be executed for each element in the input array.
   */
  const chainPromises = (inputArray, func) =>
    inputArray.reduce(
      (promise, item) => promise.then(() => func(item)),
      Promise.resolve(),
    );

  /**
   * Returns a promise that will resolve after the given delay.
   * @param {number} delay - The number of milliseconds to wait for.
   */
  const waitFor = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

  class AirTableMonitor {
    /**
     * Creates a monitor for one or more table(s) of a given base.
     * You still need to call start() in order to start watching for changes.
     * @param {Object} options - Config of the monitor. See the README for possible options.
     * @param {function} onUpdate - The event handler that will be called upon change.
     */
    constructor(options = {}, onUpdate = () => {}) {
      if (!options.tables || options.tables.length === 0) {
        throw new Error('Please specify at least one table to monitor.');
      }
      if (!options.baseID || !options.apiKey) {
        throw new Error(
          'Please specify an Airtable Base ID and an Airtable API key.',
        );
      }
      this.options = options;
      if (!onUpdate || typeof onUpdate !== 'function') {
        throw new Error('The onUpdate event handler should be a function.');
      }
      this.airtable = new AirtablePlus({
        baseID: options.baseID,
        apiKey: options.apiKey,
      });
      this.previousValues = {};
      this.onUpdate = onUpdate;

      this.checkForUpdates = this.checkForUpdates.bind(this);
      this.checkUpdatesForTable = this.checkUpdatesForTable.bind(this);
      this.start = this.start.bind(this);
      this.stop = this.stop.bind(this);
    }

    /**
     * Starts watching the airtable tables for changes.
     * @param {integer} intervalSeconds - Polling interval between each tick in seconds.
     */
    start(intervalSeconds = 60) {
      this.interval = setInterval(this.checkForUpdates, intervalSeconds * 1000);
      this.checkForUpdates();
    }

    /**
     * Stops watching the airtable tables for changes.
     */
    stop() {
      clearInterval(this.interval);
    }

    /**
     * Triggers a check for changes on every registered table.
     * Called automatically at a fixed interval when start() has been called.
     */
    async checkForUpdates() {
      return chainPromises(this.options.tables, tableName => {
        return this.checkUpdatesForTable(tableName).then(() => {
          // If set in the options, wait before proceeding to the next table
          if (this.options.tableInterval) {
            return waitFor(this.options.tableInterval * 1000);
          }
          return null;
        });
      });
    }

    /**
     * Checks for changes on every record of the given table.
     * Called automatically by checkForUpdates() at a fixed interval when start() has been called.
     * @param {string} tableName - The name of the table to check for changes.
     */
    async checkUpdatesForTable(tableName) {
      // Boolean telling if we are checking this table for the first time
      let firstPass = false;
      if (!this.previousValues[tableName]) {
        this.previousValues[tableName] = {};
        firstPass = true;
      }
      // Fetch all the records from the table
      const records = await this.airtable.read(tableName);
      records.forEach(record => {
        const index = record.id;
        if (!this.previousValues[tableName][index]) {
          this.previousValues[tableName][index] = {};
        }
        // For each record, build the list of fields to be checked for change
        // We need to watch both the previous values and the current record
        // This is due to Airtable API design only returning non-blank fields
        // If a field became blank, it won't appear in the record but we still need to fire the event
        const fields = [];
        if (this.previousValues[tableName][index]) {
          Object.keys(this.previousValues[tableName][index]).forEach(field => {
            if (!fields.includes(field)) fields.push(field);
          });
        }
        Object.keys(record.fields).forEach(field => {
          if (!fields.includes(field)) fields.push(field);
        });

        // For each field of each record, compare the current value to the previous value
        fields.forEach(fieldName => {
          const newValue = record.fields[fieldName];

          if (firstPass) {
            // First time we fetch the values, all the previous values will be undefined
            // We don't want to fire events in that case, so just store the current values
            this.previousValues[tableName][index][fieldName] = newValue;
            return;
          }
          const previousValue = this.previousValues[tableName][index][fieldName];
          if (!airtableFieldValuesAreEqual(newValue, previousValue)) {
            // There was a change in value, so fire the event handler
            this.onUpdate({
              date: new Date().toISOString(),
              tableName,
              fieldName,
              previousValue,
              newValue,
              recordId: record.id,
            });
            // And store the updated value
            this.previousValues[tableName][index][fieldName] = newValue;
          }
        });
      });
    }
  }

  return AirTableMonitor;

})));
