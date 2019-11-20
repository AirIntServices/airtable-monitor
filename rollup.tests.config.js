// This builds a CJS module for utils in order to test it with mocha
export default {
  input: 'src/utils.js',
  output: {
    file: 'build/cjs/utils.js',
    format: 'cjs',
    name: 'utils',
  },
};
