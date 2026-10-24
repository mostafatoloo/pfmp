#!/usr/bin/env node
/**
 * Stage 5 backup/restore drill against local Docker SQL Server.
 * Requires: docker container `pfmp-sqlserver`, mssql npm package.
 *
 * Steps: count rows → BACKUP → wipe table → RESTORE → recount.
 */
import sql from "mssql";

const password = process.env.MSSQL_SA_PASSWORD ?? "Your_strong_Password123";
const server = process.env.MSSQL_HOST ?? "localhost";
const port = Number(process.env.MSSQL_PORT ?? "1433");
const database = process.env.PFMP_BACKUP_DB ?? "pfmp";
// Prefer dedicated backup dir; fall back to mssql data dir (writable in GHA service images).
const backupDir =
  process.env.PFMP_BACKUP_DIR ??
  (process.env.CI ? "/var/opt/mssql/data" : "/var/opt/mssql/backup");
const backupFile = `${backupDir}/pfmp_stage5_drill.bak`;

const config = {
  server,
  port,
  user: "sa",
  password,
  database: "master",
  options: { encrypt: true, trustServerCertificate: true },
  connectionTimeout: 30_000,
};

async function q(pool, text) {
  return pool.request().query(text);
}

async function main() {
  const pool = await sql.connect(config);

  // Ensure backup directory inside container (best-effort via host docker exec note)
  console.info("backup-restore drill starting…");

  await q(
    pool,
    `IF DB_ID(N'${database}') IS NULL CREATE DATABASE [${database}];`,
  );

  // Ensure a marker table/row exists for count check
  await q(
    pool,
    `USE [${database}];
     IF OBJECT_ID(N'dbo.DrillMarker', N'U') IS NULL
       CREATE TABLE dbo.DrillMarker (id int NOT NULL PRIMARY KEY, note nvarchar(100) NOT NULL);
     MERGE dbo.DrillMarker AS t
     USING (SELECT 1 AS id, N'stage5' AS note) AS s ON t.id = s.id
     WHEN NOT MATCHED THEN INSERT (id, note) VALUES (s.id, s.note);`,
  );

  const before = await q(pool, `USE [${database}]; SELECT COUNT(*) AS c FROM dbo.DrillMarker;`);
  const beforeCount = before.recordset[0].c;
  console.info(`before count=${beforeCount}`);

  // BACKUP — may fail if container path not writable; document outcome
  try {
    await q(
      pool,
      `BACKUP DATABASE [${database}] TO DISK = N'${backupFile}' WITH INIT, COPY_ONLY, STATS = 5;`,
    );
    console.info(`backup ok → ${backupFile}`);
  } catch (err) {
    console.error("BACKUP failed (ensure container has writable backup dir):", err.message);
    console.info(
      "Hint: docker exec pfmp-sqlserver mkdir -p /var/opt/mssql/backup && chown mssql /var/opt/mssql/backup",
    );
    await pool.close();
    process.exit(2);
  }

  await q(pool, `USE [${database}]; DELETE FROM dbo.DrillMarker;`);
  const mid = await q(pool, `USE [${database}]; SELECT COUNT(*) AS c FROM dbo.DrillMarker;`);
  console.info(`after wipe count=${mid.recordset[0].c}`);

  await q(pool, `USE master; ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;`);
  await q(
    pool,
    `RESTORE DATABASE [${database}] FROM DISK = N'${backupFile}' WITH REPLACE, STATS = 5;`,
  );
  await q(pool, `ALTER DATABASE [${database}] SET MULTI_USER;`);

  const after = await q(pool, `USE [${database}]; SELECT COUNT(*) AS c FROM dbo.DrillMarker;`);
  const afterCount = after.recordset[0].c;
  console.info(`after restore count=${afterCount}`);

  await pool.close();

  if (afterCount !== beforeCount) {
    console.error(`FAIL: expected ${beforeCount}, got ${afterCount}`);
    process.exit(1);
  }
  console.info("PASS: backup/restore row counts match");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
