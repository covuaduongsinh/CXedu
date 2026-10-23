#!/usr/bin/env node
// Công cụ database của CX Platform: migrate | seed | reset | test.
// DATABASE_URL trỏ tới database ứng dụng; AUTHENTICATOR_PASSWORD là mật khẩu PostgREST dùng để kết nối.
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = new URL(
  process.env.DATABASE_URL ??
    "postgres://postgres:postgres@127.0.0.1:5432/cxedu",
);
const authenticatorPassword =
  process.env.AUTHENTICATOR_PASSWORD ?? "authenticator-dev";

const connect = async (url) => {
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  return client;
};

const migrate = async () => {
  const client = await connect(databaseUrl);
  try {
    await client.query("create schema if not exists cx_meta");
    await client.query(
      "create table if not exists cx_meta.migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const { rows } = await client.query("select name from cx_meta.migrations");
    const applied = new Set(rows.map((row) => row.name));
    const files = (await readdir(join(root, "migrations")))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(root, "migrations", file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into cx_meta.migrations (name) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log(`✓ ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`Migration ${file} lỗi: ${error.message}`, {
          cause: error,
        });
      }
    }
    await client.query(
      `alter role authenticator with password '${authenticatorPassword.replaceAll("'", "''")}'`,
    );
  } finally {
    await client.end();
  }
};

const seed = async () => {
  const client = await connect(databaseUrl);
  try {
    await client.query(await readFile(join(root, "seed.sql"), "utf8"));
    console.log("✓ seed.sql");
  } finally {
    await client.end();
  }
};

const reset = async () => {
  const name = databaseUrl.pathname.slice(1);
  if (!/^[a-z0-9_]+$/u.test(name))
    throw new Error(`Tên database không hợp lệ: ${name}`);
  const admin = new URL(databaseUrl);
  admin.pathname = "/postgres";
  const client = await connect(admin);
  try {
    await client.query(
      "select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()",
      [name],
    );
    await client.query(`drop database if exists ${name}`);
    await client.query(`create database ${name}`);
    console.log(`✓ tạo lại database ${name}`);
  } finally {
    await client.end();
  }
  await migrate();
  if (!process.argv.includes("--no-seed")) await seed();
};

const test = () => {
  const files = process.argv.slice(3).length
    ? process.argv.slice(3)
    : [join(root, "tests")];
  const result = spawnSync(
    "pg_prove",
    ["--recurse", "--ext", ".sql", ...files],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PGHOST: databaseUrl.hostname,
        PGPORT: databaseUrl.port || "5432",
        PGUSER: decodeURIComponent(databaseUrl.username),
        PGPASSWORD: decodeURIComponent(databaseUrl.password),
        PGDATABASE: databaseUrl.pathname.slice(1),
      },
    },
  );
  process.exit(result.status ?? 1);
};

const commands = { migrate, seed, reset, test };
const command = commands[process.argv[2]];
if (!command) {
  console.error(
    "Dùng: db.mjs migrate | seed | reset [--no-seed] | test [files…]",
  );
  process.exit(1);
}
await command();
