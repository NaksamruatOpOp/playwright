# 🎭 Playwright Execution & Code Quality Guide

This repository is configured for **Playwright end-to-end testing** with automated **code quality enforcement** using:

- ESLint v9 (Flat Config)
- Prettier
- Husky (pre-commit hooks)
- lint-staged

All checks run automatically **before every commit** to ensure clean, consistent, and reliable code.

---

## 🚀 Playwright Test Execution

### Prerequisites
- Open a terminal in the project root directory
- Install dependencies using `npm install`

### Available Test Commands

| Test File               | Command            |
|-------------------------|--------------------|
| `homepage.spec.ts`      | `npm run homepage` |
| `productDetail.spec.ts` | `npm run product`  |

### Run Tests
```sh
npm run homepage
npm run product
```

---

## 🧩 About This Setup

This project enforces **automated linting and formatting** before code is committed.

### Highlights
- **Prettier**: Automatically formats code
- **ESLint v9**: Detects bugs and enforces best practices
- **Husky**: Blocks bad commits
- **lint-staged**: Runs checks only on staged files for speed

---

## ⚡ Quick Start

### System Requirements
- Node.js ≥ 18
- npm ≥ 9
- Git

Verify installation:
```sh
node -v
npm -v
git --version
```

---

## 📦 Install Dev Dependencies

```sh
npm install --save-dev   husky   lint-staged   eslint   @eslint/js   prettier   @typescript-eslint/parser   @typescript-eslint/eslint-plugin   eslint-plugin-playwright
```

---

## 🗂 Initialize Git (If Needed)

```sh
git init
```

---

## 🪝 Husky Pre-commit Setup

### Set Git Hooks Path
```sh
git config core.hooksPath .husky
```

Verify:
```sh
git config core.hooksPath
# Expected: .husky
```

### Create Pre-commit Hook
```sh
mkdir -p .husky
echo '#!/bin/sh' > .husky/pre-commit
echo 'npx lint-staged' >> .husky/pre-commit
chmod +x .husky/pre-commit
```

---

## 🧪 lint-staged Configuration

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,ts,tsx,jsx,json,md}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

### Behavior
- Prettier runs first (formatting)
- ESLint runs second (logic and rules)
- ❌ ESLint errors block commits
- ⚠️ Warnings do NOT block commits

---

## 🔍 ESLint v9 Configuration (Flat Config)

> ESLint v9 **requires** `eslint.config.js`  
> `.eslintrc.*` is NOT supported

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'dist/**',
    ],
  },

  ...tseslint.configs.recommended,
  playwright.configs['flat/recommended'],

  {
    rules: {
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'playwright/no-networkidle': 'off',
    },
  },
];
```

---

## 🎨 Prettier Configuration

### `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.prettierignore`
```txt
node_modules
playwright-report
test-results
dist
*.min.js
```

---

## 🚫 Git Ignore

```txt
node_modules
playwright-report
test-results
dist
.env
.DS_Store
```

---

## 🧠 ESLint vs Prettier

| Tool     | Responsibility                        |
|----------|----------------------------------------|
| ESLint   | Logic, bugs, Playwright best practices |
| Prettier | Code formatting only                   |
| Husky    | Enforces checks before commit          |
| lint-staged | Runs checks on staged files only   |

---

## 🧪 Pre-commit Validation

### ❌ Fail Case
```js
const unused = 123
```

```sh
git add bad.js
git commit -m "this must fail"
```

### ✅ Pass Case
```js
const used = 123;
console.log(used);
```

```sh
git add good.js
git commit -m "this should pass"
```

---

## 🗂 Recommended Project Structure

```txt
.
├── .husky/
│   └── pre-commit
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
├── .gitignore
├── package.json
└── playwright-e2e/
```

---

## 📝 Notes

- Husky v9 does NOT use `husky install`
- ESLint v9 uses Flat Config only
- Prettier runs via lint-staged
- CI should still run full lint checks

---

## 🎯 Conclusion

This setup ensures:
- Clean commits
- Consistent formatting
- Fast feedback
- Enforced Playwright best practices

Happy testing 🚀
