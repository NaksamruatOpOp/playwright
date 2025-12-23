import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';

export default [
  // Global ignore
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'dist/**',
      'coverage/**',
    ],
  },

  // JavaScript files
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript + Playwright
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      playwright,
    },
    // rules: {
    //   ...js.configs.recommended.rules,
    //   ...tsPlugin.configs.recommended.rules,
    //   ...playwright.configs.recommended.rules,

    //   // Custom rules
    //   'no-unused-vars': 'off',
    //   '@typescript-eslint/no-unused-vars': 'error',
    //   'no-undef': 'off',
    // },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...playwright.configs.recommended.rules,
    
      // ✅ ต้องเป็น error (bug จริง)
      'playwright/missing-playwright-await': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    
      // ⚠️ downgrade เป็น warning
      '@typescript-eslint/no-explicit-any': 'warn',
      'playwright/no-wait-for-selector': 'warn',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-nested-step': 'warn',
      'playwright/expect-expect': 'warn',
      'playwright/no-useless-not': 'warn',
    
      // ❌ ปิด rule JS ซ้ำกับ TS
      'playwright/no-networkidle': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
    }
  },
];
