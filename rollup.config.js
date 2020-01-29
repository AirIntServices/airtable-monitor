import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: 'src/AirtableMonitor.ts',
    output: {
      file: 'build/umd/airtable-monitor.js',
      format: 'umd',
      name: 'airtable-monitor',
    },
    // eslint-disable-next-line global-require
    plugins: [typescript({ typescript: require('typescript') }), commonjs()],
  },
  // This builds a CJS module for utils in order to test it with mocha
  {
    input: 'src/utils.ts',
    output: {
      file: 'build/cjs/utils.js',
      format: 'cjs',
      name: 'utils',
    },
    // eslint-disable-next-line global-require
    plugins: [typescript({ typescript: require('typescript') }), commonjs()],
  },
];
