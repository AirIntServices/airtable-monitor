const AirtablePlus = require('airtable-plus');

/**
 * Comparison function used to handle fields that are linked to multiple records (arrays)
 * Behaves as a simple === for non-arrays
 * @param {*} a left comparison operand
 * @param {*} b right comparison operand
 */
const valuesAreEqual = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every(e => b.includes(e));
  }
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
    // First time we fetch the values, all the previous values will be undefined
    // We don't want to fire events in that case
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
        const previousValue = this.previousValues[tableName][index][fieldName];
        if (!previousValue) {
          this.previousValues[tableName][index][fieldName] = newValue;
        } else if (
          previousValue &&
          !valuesAreEqual(newValue, previousValue) &&
          !firstPass
        ) {
          // There was a change in value and this isn't the first pass, so fire the event handler
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
