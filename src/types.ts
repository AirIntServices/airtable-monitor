// Types

export interface Options {
  tables: Array<string>;
  baseID: string;
  apiKey: string;
  tableInterval: number;
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

export interface ValueStore {
  [tableName: string]: {
    [recordId: string]: {
      [fieldName: string]: any;
    };
  };
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
