
const bcrypt = require("bcrypt");
const pool = require("./db");

async function seedDatabase() {
  const demoName = process.env.DEMO_USER_NAME || "Demo User";
  const demoEmail = process.env.DEMO_USER_EMAIL || "demo@sweety.com";
  const demoPassword = process.env.DEMO_USER_PASSWORD || "Demo@123";

  if (demoPassword.length < 6 || demoPassword.length > 72) {
    throw new Error("Demo password must be between 6 and 72 characters.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create the demo user or update the existing demo account.
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      [demoName, demoEmail.toLowerCase(), passwordHash]
    );

    const demoUser = userResult.rows[0];

    // Remove only this demo user's previous seeded readings.
    await client.query(
      "DELETE FROM readings WHERE user_id = $1",
      [demoUser.id]
    );

    // Insert sample readings for the demo account.
    await client.query(
      `INSERT INTO readings
        (user_id, reading_date, slot, glucose_value)
       VALUES
        ($1, CURRENT_DATE,     'Morning (fasting)', 110),
        ($1, CURRENT_DATE,     'After breakfast',   145),
        ($1, CURRENT_DATE - 1, 'Morning (fasting)', 105),
        ($1, CURRENT_DATE - 1, 'After lunch',       132),
        ($1, CURRENT_DATE - 2, 'Morning (fasting)',  99),
        ($1, CURRENT_DATE - 2, 'After dinner',      128)`,
      [demoUser.id]
    );

    await client.query("COMMIT");

    console.log("\nDemo data created successfully!");
    console.log("--------------------------------");
    console.log("Demo name:", demoUser.name);
    console.log("Demo email:", demoUser.email);
    console.log("Demo password:", demoPassword);
    console.log("Sample readings: 6");
    console.log("--------------------------------\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating demo data:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
