const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const pool = require("./db.js");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const AUTH_TABLE = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(
  process.env.AUTH_TABLE || "students"
)
  ? process.env.AUTH_TABLE || "students"
  : "students";
let AUTH_NAME_COLUMN = "username";

app.use(cors());
app.use(express.json()); // ✅ IMPORTANT

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
  });
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${AUTH_TABLE} (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${AUTH_TABLE}'`
  );
  const columnSet = new Set(columns.rows.map((r) => r.column_name));

  if (columnSet.has("username")) {
    AUTH_NAME_COLUMN = "username";
  } else if (columnSet.has("name")) {
    AUTH_NAME_COLUMN = "name";
  } else {
    AUTH_NAME_COLUMN = "username";
  }
}

// LOGIN API
app.post("/login", async (req, res) => {
  console.log("Request Body:", req.body); // 🔍 DEBUG

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const nameSelect =
      AUTH_NAME_COLUMN === "name" ? "name AS username" : "username";

    const result = await pool.query(
      `SELECT id, ${nameSelect}, email, password, created_at FROM ${AUTH_TABLE} WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    const trimmedPassword = String(password).trim();
    const storedPasswordValue = String(user.password || "");
    const isHashedPassword = storedPasswordValue.startsWith("$2");
    const passwordMatches = isHashedPassword
      ? await bcrypt.compare(trimmedPassword, storedPasswordValue)
      : trimmedPassword === storedPasswordValue.trim();

    if (!passwordMatches) {
      return res.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { password: storedPassword, ...safeUser } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

initializeDatabase()
  .then(() => {
    console.log("Database is ready");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
