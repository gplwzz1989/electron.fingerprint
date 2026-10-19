// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'], // eslint:recommended
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    // 不符合prettier要求的按错误处理
    'prettier/prettier': ['warn', { endOfLine: 'auto' }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    // 缩进2个空格
    indent: [
      'off',
      2,
      {
        SwitchCase: 1, // （默认：0）指定 switch-case 语句的缩进级别
      },
    ],

    // 换行符使用unix
    //'linebreak-style': ['error', 'unix'],

    // 单引号
    //quotes: ['error', 'single'],

    // 语句强制分号结尾
    semi: ['error', 'always'],

    // 要求或禁止对象文本的方法和属性速记语法
    'object-shorthand': 'off',

    // 要求使用点号 (dot-notation)
    // '@typescript-eslint/dot-notation': 'error',

    // 限制可以被抛出的异常 (no-throw-literal)
    // '@typescript-eslint/no-throw-literal': 'error',

    //
    '@typescript-eslint/no-loss-of-precision': 'off',
  },

  // root: true,
  // env: {
  //   node: true,
  // },
  // plugins: ['@typescript-eslint', 'prettier'],
  // extends: [
  //   'eslint:recommended',
  //   'plugin:prettier/recommended',
  //   'prettier',
  // ],
  // rules: {
  //   // // 不符合prettier要求的按错误处理
  //   // 'prettier/prettier': 'error',
  //   // // 要求或禁止对象文本的方法和属性速记语法
  //   // 'object-shorthand': 'off',
  //   // // 要求使用点号 (dot-notation)
  //   // '@typescript-eslint/dot-notation': 'error',
  //   // // 限制可以被抛出的异常 (no-throw-literal)
  //   // '@typescript-eslint/no-throw-literal': 'error',
  // },
};
