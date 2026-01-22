import 'dotenv/config';   // 👈 this loads .env

import pkg from "pg";
const { Client } = pkg;

console.log("DATABASE_URL =", process.env.DATABASE_URL ? "FOUND" : "MISSING");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  try {
    await client.connect();
    const res = await client.query("SELECT version()");
    console.log("✅ Database connected successfully!");
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("❌ Database connection failed:");
    console.error(err);
  }
}

test();
