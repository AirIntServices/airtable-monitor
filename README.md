# airtable-monitor
[![Build Status](https://travis-ci.com/AirIntServices/airtable-monitor.svg?branch=master)](https://travis-ci.com/AirIntServices/airtable-monitor) ![npm](https://img.shields.io/npm/v/airtable-monitor) ![npm](https://img.shields.io/npm/dm/airtable-monitor)

This library polls your Airtable tables to monitor changes, calling a simple event handler when a change is detected.

## Install

`yarn add airtable-monitor`

## Usage

```js
const AirtableMonitor = require('airtable-monitor');

const monitor = new AirtableMonitor(
  {
    baseID: xxx, // Airtable base ID
    apiKey: xxx, // Airtable API token
    tables: ['table_to_monitor'],
    tableInterval: 1, // Optional (default = 0) : an interval in seconds between calls to Airtable API for each table of a tick to avoid rate limiting.
  },
  event => {
    // event structure :
    // {
    //   date,
    //   tableName,
    //   fieldName,
    //   previousValue,
    //   newValue,
    //   recordId,
    // }
  },
);

monitor.start(30); // Poll every 30 seconds. Default : 60 seconds
```

## Caveats

- Changes that occur between polling intervals will not be detected
- Be careful when monitoring text fields, as the Airtable API returns the exact text at the moment we request it : If someone is changing `foo` to `lorem ipsum` and the check interval occurs in the middle, an first event could be fired for `foo` -> `lorem`, then the next check would fire an event for `lorem` -> `lorem ipsum`.
- We don't recommend polling too often to avoid exceeding Airtable API rate limits.

## Running tests

`yarn install && yarn test`
