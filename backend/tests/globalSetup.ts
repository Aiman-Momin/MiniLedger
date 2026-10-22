import { pool } from '../src/db';
import { runMigrations } from '../src/migrate';

export default async function globalSetup() {
  await runMigrations();
  await pool.end();
}
