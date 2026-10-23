#!/usr/bin/env node
/**
 * Creates pfmp / pfmp_test databases on a reachable SQL Server.
 * Uses the `mssql` package (no sqlcmd required).
 */
import sql from "mssql";

const password = process.env.MSSQL_SA_PASSWORD ?? "Your_strong_Password123";
const server = process.env.MSSQL_HOST ?? "localhost";
const port = Number(process.env.MSSQL_PORT ?? "1433");

const config = {
  server,
  port,
  user: "sa",
  password,
  database: "master",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 30_000,
};

async function waitAndCreate() {
  let lastErr;
  for (let i = 0; i < 40; i++) {
    try {
      const pool = await sql.connect(config);
      for (const db of ["pfmp", "pfmp_test"]) {
        await pool
          .request()
          .query(
            `IF DB_ID(N'${db}') IS NULL CREATE DATABASE [${db}];`,
          );
        console.info(`database ready: ${db}`);
      }
      await pool.close();
      return;
    } catch (err) {
      lastErr = err;
      console.info(`waiting for SQL Server (${i + 1}/40)…`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error(lastErr);
  process.exit(1);
}

await waitAndCreate();
