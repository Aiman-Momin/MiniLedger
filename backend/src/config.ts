import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required(isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  timezone: 'Asia/Kolkata',
};
