const AirtablePlus = require('airtable-plus');
const deepEqual = require('fast-deep-equal');

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
 * @param {*} a left comparison operand
 * @param {*} b right comparison operand
 */
const valuesAreEqual = (a, b) => {
  // If one of the values is falsy and not the other, they're not equal
  if ((!a && b) || (!b && a)) return false;
  // If they are not of the same type, they're not equal
  // This can happen if a field type changed since the last check
  if (typeof a !== typeof b) return false;
  // Array type fields : link to other records, lookup, multiple select, attachments
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (a.length + b.length === 0) return true; // Both arrays are empty (length can't be negative)
    // Comparison for arrays of strings
    if (typeof a[0] === 'string') {
      return a.every(e => b.includes(e));
    }
    // Comparison for arrays of objects (i.e. attachments)
    if (typeof a[0] === 'object') {
      return a.every((e, index) => deepEqual(e, b[index]));
    }
    // Unknown type : return true to avoid endless notifications
    console.error(
      `Unsupported Airtable type : Array of ${typeof a[0]} ; Ignoring field.`,
    );
    return true;
  }
  // Object type fields : barcode, collaborator
  if (a && b && typeof a === 'object') {
    return deepEqual(a, b);
  }
  // Behaves as a simple === for non-arrays
  return a === b;
};

class AirTableMonitor {
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
   * Starts watching the airtable tables for changes
   * @param {integer} intervalSeconds polling interval in seconds
   */
  start(intervalSeconds = 60) {
    this.interval = setInterval(this.checkForUpdates, intervalSeconds * 1000);
    this.checkForUpdates();
  }

  /**
   * Stops watching the airtable tables for changes
   */
  stop() {
    clearInterval(this.interval);
  }

  /**
   * Triggers a check for changes on every registered table.
   * Called automatically at a fixed interval when start() has been called.
   */
  async checkForUpdates() {
    return Promise.all(
      this.options.tables.map(tableName =>
        this.checkUpdatesForTable(tableName),
      ),
    );
  }

  /**
   * Checks for changes on every record of the given table.
   * Called automatically by checkForUpdates() at a fixed interval when start() has been called.
   */
  async checkUpdatesForTable(tableName) {
    // Boolean telling if we are checking this table for the first time
    let firstPass = false;
    if (!this.previousValues[tableName]) {
      this.previousValues[tableName] = [];
      firstPass = true;
    }
    // Fetch all the records from the table
    const records = await this.airtable.read(tableName);
    records.forEach((record, index) => {
      // For each field of each record, compare the current value to the previous value
      Object.keys(record.fields).forEach(fieldName => {
        const newValue = record.fields[fieldName];
        if (!this.previousValues[tableName][index]) {
          this.previousValues[tableName][index] = {};
        }
        if (firstPass) {
          // First time we fetch the values, all the previous values will be undefined
          // We don't want to fire events in that case, so just store the current values
          this.previousValues[tableName][index][fieldName] = newValue;
          return;
        }
        const previousValue = this.previousValues[tableName][index][fieldName];
        if (!valuesAreEqual(newValue, previousValue)) {
          // There was a change in value, so fire the event handler
          this.onUpdate({
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

module.exports = AirTableMonitor;
