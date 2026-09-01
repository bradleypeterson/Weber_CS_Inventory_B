import { config } from "dotenv";
import { createPool } from "mysql2/promise";
import path from "path";
config({ path: path.resolve(__dirname, "../../.env") });

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const port = Number(process.env.DB_PORT);
const db_name = process.env.DB_NAME;

if (host === undefined) throw Error("DB_HOST is not defined in the api .env");
if (user === undefined) throw Error("DB_USER is not defined in the api .env");
if (password === undefined) throw Error("DB_PASSWORD is not defined in the api .env");
if (isNaN(port)) throw Error("DB_PORT is not defined in the api .env");
if (db_name === undefined) throw Error("DB_NAME is not defined in the api .env");
if (!/^[A-Za-z0-9_]+$/.test(db_name)) {
  throw Error("DB_NAME must contain only letters, numbers, and underscores");
}

export const DB_NAME = db_name;

export const DB_CONNECTION_CONFIG = {
  host,
  user,
  password,
  port
} as const;

export const pool = createPool({
  ...DB_CONNECTION_CONFIG,
  waitForConnections: true,
  multipleStatements: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  database: DB_NAME
});
