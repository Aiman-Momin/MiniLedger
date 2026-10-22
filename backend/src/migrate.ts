import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db';

const migrationsDir = path.resolve(__dirname, '..', 'migrations');

export async function runMigrations(): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      newlyApplied.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
    } finally {
      client.release();
    }
  }

  return newlyApplied;
}

if (require.main === module) {
  runMigrations()
    .then((files) => {
      process.stdout.write(
        files.length ? `Applied ${files.join(', ')}\n` : 'Database is up to date\n',
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
