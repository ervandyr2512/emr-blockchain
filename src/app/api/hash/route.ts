/**
 * POST /api/hash
 * Server-side SHA-256 hashing (used when browser Crypto API is unavailable).
 * Body: { data: any }
 * Response: { hash: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const canonical = JSON.stringify(sortKeys(body.data));
    const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
    return NextResponse.json({ hash });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Hash failed" },
      { status: 400 }
    );
  }
}
