import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // research inputs, not application code
    "reference/**",
    "web-forge/**",
    // Bản sao cây làm việc do Claude Code tạo ra. Nằm ngoài git
    // (.git/info/exclude) nên trước giờ không ai thấy, nhưng eslint vẫn quét và
    // nó là nguồn của toàn bộ lỗi lint hiện có.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
