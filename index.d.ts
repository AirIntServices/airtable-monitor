// Type definitions for airtable-monitor
// Project: airtable-monitor
// Definitions by: Damien Lajarretie

// Note that ES6 modules cannot directly export class objects.
// This file should be imported using the CommonJS-style:
//   import x = require('[~THE MODULE~]');
//
// Alternatively, if --allowSyntheticDefaultImports or
// --esModuleInterop is turned on, this file can also be
// imported as a default import:
//   import x from '[~THE MODULE~]';
//
// Refer to the TypeScript documentation at
// https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require
// to understand common workarounds for this limitation of ES6 modules.

/*~ If this module is a UMD module that exposes a global variable 'myClassLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
export as namespace AirtableMonitor;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = AirtableMonitor;

/*~ Write your module's methods and properties in this class */
declare class AirtableMonitor {
  constructor(
    options: AirtableMonitor.Options,
    onUpdate?: (event: AirtableMonitor.LegacyEvent) => void,
  );
  start(intervalSeconds: number): void;
  stop(): void;
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 *~
 *~ Note that if you decide to include this namespace, the module can be
 *~ incorrectly imported as a namespace object, unless
 *~ --esModuleInterop is turned on:
 *~   import * as x from '[~THE MODULE~]'; // WRONG! DO NOT DO THIS!
 */
declare namespace AirtableMonitor {
  export interface Options {
    tables: Array<string>;
    baseID: string;
    apiKey: string;
    tableInterval?: number;
    onEvent: (event: Event) => void;
  }

  export interface Record {
    id: string;
    fields: { [fieldName: string]: any };
  }

  export enum EventType {
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
  }

  export interface Event {
    date: string; // ISO string
    type: EventType;
    tableName: string;
  }

  export interface FieldEvent extends Event {
    recordId: string;
    fieldName: string;
    previousValue: any;
    newValue: any;
  }

  export interface RecordEvent extends Event {
    records: Array<Record>;
  }

  // DEPRECATED
  // Please use AirtableMonitorEvent sub-interfaces.
  export interface LegacyEvent {
    date: string; // ISO string
    tableName: string;
    fieldName: string;
    previousValue: any;
    newValue: any;
    recordId: string;
  }
}
