const { Pool } = require("pg");

require("dotenv").config();

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim()
);
const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";

if (
  isProduction &&
  !hasDatabaseUrl &&
  (!process.env.DB_HOST || /^(localhost|127\.0\.0\.1|::1)$/i.test(process.env.DB_HOST))
) {
  throw new Error(
    "Invalid database config in production: set DATABASE_URL or set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT to your managed Postgres values (not localhost)."
  );
}

const useSsl =
  (process.env.DB_SSL || "").toLowerCase() === "true" ||
  /render\.com$/i.test(process.env.DB_HOST || "");

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "docterdb",
      password: process.env.DB_PASSWORD || "postsql@123",
      port: Number(process.env.DB_PORT) || 5432,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };

const pool = new Pool(poolConfig);

module.exports = pool;
