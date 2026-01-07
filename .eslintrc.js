module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: ['prettier', 'node'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended', // включает eslint-plugin-prettier + eslint-config-prettier
  ],
  rules: {
    'prettier/prettier': 'error',
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: { jest: true },
    },
  ],
};
