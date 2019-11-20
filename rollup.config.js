export default [
  {
    input: 'src/AirtableMonitor.js',
    output: {
      file: 'umd/airtable-monitor.js',
      format: 'umd',
      name: 'airtable-monitor',
    },
  },
  {
    input: 'src/utils.js',
    output: {
      file: 'cjs/utils.js',
      format: 'cjs',
      name: 'utils',
    },
  },
];
