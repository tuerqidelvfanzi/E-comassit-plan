// ESLint 配置 V3.0
// 防错式：禁止硬编码颜色（强制使用 CSS 变量）
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      // 禁止硬编码颜色
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/i]",
          message: '❌ 硬编码颜色禁止！请使用 CSS 变量 var(--color-*)'
        },
        {
          selector: "Literal[value=/^rgba?\(/]",
          message: '❌ 硬编码 rgba() 禁止！请使用 CSS 变量 var(--color-*)'
        }
      ],
      // TS 严格
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'e2e/**',
      'playwright-report/**',
      'test-results/**',
    ]
  }
);
