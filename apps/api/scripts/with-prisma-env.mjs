import { spawnSync } from "node:child_process";

const fallbackDatabaseUrl =
  "postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public";

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("Usage: node scripts/with-prisma-env.mjs <prisma-command> [...args]");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || fallbackDatabaseUrl,
};

const result = spawnSync("prisma", prismaArgs, {
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
