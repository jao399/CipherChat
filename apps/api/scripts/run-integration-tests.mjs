import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "../../..");

const fallbackDatabaseUrl =
  "postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || fallbackDatabaseUrl,
  INTERNAL_JOB_TOKEN: process.env.INTERNAL_JOB_TOKEN || "test-internal-token",
  NODE_ENV: "test",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  RUN_API_INTEGRATION_TESTS: "true",
};

for (const args of [
  [resolve(workspaceRoot, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
  [resolve(workspaceRoot, "node_modules/tsx/dist/cli.mjs"), "--test", "src/**/*.integration.test.ts"],
]) {
  const result = spawnSync(process.execPath, args, {
    env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
