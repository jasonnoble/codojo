/**
 * ts-jest in pure-ESM mode. The project is `"type": "module"` with NodeNext
 * resolution, so local imports carry `.js` extensions that don't exist on disk
 * — `moduleNameMapper` strips them back to the source path for resolution.
 *
 * Config is `.cjs` so it loads as CommonJS regardless of the package's ESM type.
 * Run via `node --experimental-vm-modules` (see the `test` script).
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
