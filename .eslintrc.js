module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:jsx-a11y/recommended',
  ],
  rules: {
    'jsx-a11y/heading-has-content': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        'react-hooks/exhaustive-deps': 'warn',
        'no-unused-vars': 'warn',
      },
    },
  ],
};
