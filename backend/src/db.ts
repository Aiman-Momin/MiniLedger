import { Pool, types } from 'pg';
import { config } from './config';

const INT8_OID = 20;
const DATE_OID = 1082;

types.setTypeParser(INT8_OID, Number);
types.setTypeParser(DATE_OID, (value) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  options: `-c timezone=${config.timezone}`,
});
