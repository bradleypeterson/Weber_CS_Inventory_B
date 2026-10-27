import { pool } from "./index";
import { createUserSessionTable } from "./sessionSchema";

// Add only the session table; existing tables and data are preserved.
async function addSessionTable() {
  try {
    await pool.query(createUserSessionTable);
    console.log("UserSession table is ready. Existing data was preserved.");
  } catch (error) {
    console.error("Failed to create UserSession table:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  void addSessionTable();
}
