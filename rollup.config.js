import typescript from '@rollup/plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
export default [
  {
    input: 'src/AirtableMonitor.ts',
    output: {
      file: 'build/umd/airtable-monitor.js',
      format: 'umd',
      name: 'airtable-monitor',
    },
    plugins: [typescript(), commonjs()],
  },
  // This builds a CJS module for utils in order to test it with mocha
  {
    input: 'src/utils.ts',
    output: {
      file: 'build/cjs/utils.js',
      format: 'cjs',
      name: 'utils',
    },
    plugins: [typescript(), commonjs()],
  },
];
