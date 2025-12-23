# Playwright Execution Guide

Follow these steps to execute your Playwright tests:

## Prerequisites
1. Open a terminal in the project directory.

## Commands to Run Tests

| Test File                  | Command              |
|----------------------------|----------------------|
| `homepage.spec.ts`         | `npm run homepage`  |
| `productDetail.spec.ts`    | `npm run product`   |

### Steps to Execute
1. Open the terminal in the project directory.
2. Use the corresponding command for the desired test file:
   - For `homepage.spec.ts`: Run `npm run homepage`.
   - For `productDetail.spec.ts`: Run `npm run product`.



## About this Setup

This project is configured for Node.js and Playwright with a focus on automated code quality using pre-commit hooks (Husky), ESLint v9, and Prettier.

### Highlights
- **Prettier**: Automatically formats code.
- **ESLint (v9)**: Ensures code quality and catches problems.
- **Pre-commit blocking**: Commits are blocked if any lint or format errors exist.
- **Performance**: Only staged files are checked for speed.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Git

Verify installation:
```sh
node -v
npm -v
git --version
```

### 1. Install Dev Dependencies

```sh
npm install --save-dev husky lint-staged eslint @eslint/js prettier
```

### 2. Initialize Git (if you haven't already)

```sh
git init
```

### 3. Set Up Husky Pre-commit Hook

- Set the Git hooks path:
  ```sh
  git config core.hooksPath .husky
  ```
  Verify:
  ```sh
  git config core.hooksPath   # Output should be: .husky
  ```
- Create the hook file:
  ```sh
  mkdir -p .husky
  echo '#!/bin/sh' > .husky/pre-commit
  echo 'npx lint-staged' >> .husky/pre-commit
  chmod +x .husky/pre-commit
  ```

### 4. Configure lint-staged

Add this to your `package.json`:
```json
"lint-staged": {
  "**/*.{js,ts,json,md}": [
    "prettier --write"
  ],
  "**/*.{js,ts}": [
    "eslint --max-warnings=0"
  ]
}
```
- **Prettier**: Formats staged files before commit.
- **ESLint**: Lint errors block the commit.

### 5. Configure ESLint v9

- ESLint v9 requires `eslint.config.js` (not `.eslintrc.*`).

**`eslint.config.js`:**
```js
import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'dist/**',
    ],
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'error',
      'no-console': 'warn',
    },
  },
];
```

### 6. Configure Prettier

**`.prettierrc.json`:**
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

**`.prettierignore`:**
```
node_modules
playwright-report
test-results
dist
*.min.js
```

### 7. Configure .gitignore

**`.gitignore`:**
```
node_modules
playwright-report
test-results
dist
.env
.DS_Store
```

---

## 8. Verifying the Setup

- **Test ESLint**
  ```sh
  npx eslint .
  ```
- **Test Prettier**
  ```sh
  npx prettier . --check
  ```
- **Test Pre-commit Hook:**
  1. _Fail Case:_
     - Create a file (`bad.js`):
       ```js
       const unused = 123
       ```
     - Add and commit:
       ```sh
       git add bad.js
       git commit -m "this must fail"
       ```
     - **Result:** Commit is blocked.
  2. _Pass Case:_
     - Create a file (`good.js`):
       ```js
       const used = 123;
       console.log(used);
       ```
     - Add and commit:
       ```sh
       git add good.js
       git commit -m "this should pass"
       ```
     - **Result:** Commit succeeds.

---

## Suggested Project Structure

```
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

## Key Notes

- Husky v9: No `husky install`; no `husky.sh`.
- ESLint v9: Requires `eslint.config.js`.
- Formatting (Prettier) and linting (ESLint) are enforced before commits.
- CI/CD pipelines should still run full lint/format checks.

---

## Optional Enhancements

- Add the Playwright ESLint plugin.
- Extend ESLint config for TypeScript.
- Add commit message linting.
- Run lint/format checks in CI.

---

## Troubleshooting

- **Husky not running?**  
  Ensure `.husky` is set:  
  `git config core.hooksPath .husky`
- **Permission errors?**  
  Run: `chmod +x .husky/pre-commit`
- **ESLint config not found?**  
  Ensure `eslint.config.js` is present (required by ESLint v9).

---

## Conclusion

This workflow keeps your codebase consistent and safe by ensuring that every commit is formatted and linted before entering your repository.
