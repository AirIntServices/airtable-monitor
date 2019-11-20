export default [
  {
    input: 'src/AirtableMonitor.js',
    output: {
      file: 'build/umd/airtable-monitor.js',
      format: 'umd',
      name: 'airtable-monitor',
    },
  },
  // This builds a CJS module for utils in order to test it with mocha
  {
    input: 'src/utils.js',
    output: {
      file: 'build/cjs/utils.js',
      format: 'cjs',
      name: 'utils',
    },
  },
];
