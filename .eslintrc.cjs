module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none' }], 'no-redeclare': 'error', 'no-import-assign': 'error', 'no-const-assign': 'error' }
};
