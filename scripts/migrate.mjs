import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = readFileSync(new URL("../db/app_schema.sql", import.meta.url), "utf8");

const client = new Client({ connectionString: url, ssl: url.includes("railway") ? { rejectUnauthorized: false } : undefined });
await client.connect();
await client.query(sql);
await client.end();
console.log("migration applied");
