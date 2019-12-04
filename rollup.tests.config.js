// This builds a CJS module for utils in order to test it with mocha
import typescript from '@rollup/plugin-typescript';
export default {
  input: 'src/utils.ts',
  output: {
    file: 'build/cjs/utils.js',
    format: 'cjs',
    name: 'utils',
  },
  plugins: [typescript()],
};
