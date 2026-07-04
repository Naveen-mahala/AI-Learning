import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/**
 * Neon serverless SQL client.
 *
 * Usage in any API route:
 *
 *   import { sql } from "@/lib/db";
 *
 *   const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
 *
 * The tagged-template syntax automatically parameterises values,
 * so you never need to sanitise inputs manually.
 */
export const sql = neon(process.env.DATABASE_URL);

/**
 * Helper for running a quick connectivity check.
 * Call this from an API route during development to confirm the
 * connection is working before building out real queries.
 *
 *   const ok = await testConnection();
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (err) {
    console.error("[db] Connection test failed:", err);
    return false;
  }
}
