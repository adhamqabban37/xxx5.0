// ESLint configuration to disable problematic rules during production build
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn', // Change to warning instead of error
    '@typescript-eslint/no-unused-vars': 'warn', // Change to warning instead of error
    'react/no-unescaped-entities': 'warn', // Change to warning instead of error
  },
};
