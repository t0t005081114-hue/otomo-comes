# tests/integration

DB境界・migration後の制約・transactionのテスト（DEVELOPMENT_STANDARDS §6）。

Phase 0時点ではDB業務スキーマ未実装のためテストなし（`vitest.config.ts` の
`passWithNoTests` により空でも `npm run test:integration` は失敗しない）。
