/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals', // reglas recomendadas de Next.js
    'plugin:@typescript-eslint/recommended', // reglas TS
    'plugin:prettier/recommended', // integra Prettier con ESLint
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // reglas personalizadas, por ejemplo:
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
}
