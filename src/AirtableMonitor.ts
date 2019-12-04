import AirtablePlus from 'airtable-plus';
import { airtableFieldValuesAreEqual, chainPromises, waitFor } from './utils';

export interface AirtableMonitorOptions {
  tables: Array<string>;
  baseID: string;
  apiKey: string;
  tableInterval: number;
}

export interface AirtableMonitorEvent {
  date: Date;
  tableName: string;
  fieldName: string;
  previousValue: any;
  newValue: any;
  recordId: string;
}

export interface AirtableMonitorValueStore {
  [tableName: string]: {
    [recordId: string]: {
      [fieldName: string]: any;
    };
  };
}

export default class AirTableMonitor {
  private options: AirtableMonitorOptions;
  private airtable: any; // TODO : properly declare airtable-plus types
  private previousValues: AirtableMonitorValueStore;
  private onUpdate: (AirtableMonitorEvent) => void;
  private interval: any; // number in the browser, NodeJS.Timer in node.
  /**
   * Creates a monitor for one or more table(s) of a given base.
   * You still need to call start() in order to start watching for changes.
   * @param {Object} options - Config of the monitor. See the README for possible options.
   * @param {function} onUpdate - The event handler that will be called upon change.
   */
  constructor(
    options: AirtableMonitorOptions,
    onUpdate: (AirtableMonitorEvent) => void = () => {},
  ) {
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
  start(intervalSeconds: number = 60) {
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
  private async checkForUpdates() {
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
  private async checkUpdatesForTable(tableName: string) {
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
