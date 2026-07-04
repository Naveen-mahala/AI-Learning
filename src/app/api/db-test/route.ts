import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/db-test
 *
 * Returns the current Postgres time and server version.
 * Use this to confirm the Neon connection is working.
 * Remove or protect this route before deploying to production.
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT
        now()            AS server_time,
        version()        AS pg_version,
        current_database() AS database_name
    `;

    return NextResponse.json({
      status: "connected",
      server_time: result[0].server_time,
      pg_version: (result[0].pg_version as string).split(" ").slice(0, 2).join(" "),
      database_name: result[0].database_name,
    });
  } catch (err) {
    console.error("[db-test] Connection failed:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
