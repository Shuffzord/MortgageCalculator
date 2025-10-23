/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: { browser: true, es2023: true, node: true },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'testing-library'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist', 'build', 'node_modules', 'client/public', 'attached_assets', 'archive'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  overrides: [
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**/*.{ts,tsx}',
        'client/e2e-tests/**/*.{ts,tsx}',
      ],
      env: { jest: true, node: true, browser: true },
      extends: ['plugin:testing-library/react'],
      rules: {
        'no-console': 'off',
        'no-var': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['scripts/**/*.{js,ts}'],
      env: { node: true },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'no-var': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['tailwind.config.ts', 'vite.config.ts', 'jest.config.cjs'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      files: ['client/src/App.tsx', 'client/src/lib/tutorial/**/*.ts'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prefer-const': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/interactive-supports-focus': 'warn',
    'react/prop-types': 'off',
  },
};
