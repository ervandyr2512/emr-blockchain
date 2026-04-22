/**
 * hash.ts
 * -------
 * Browser-side SHA-256 hashing via the Web Crypto API.
 * Produces the same deterministic hex string as the Node.js crypto module,
 * which is used by the API route for server-side verification.
 */

/**
 * Canonically serialize `data` (sorted keys, recursive) then SHA-256 hash it.
 * @returns Lowercase hex string (64 characters)
 */
export async function sha256(data: unknown): Promise<string> {
  const canonical = JSON.stringify(sortKeys(data));
  const encoded   = new TextEncoder().encode(canonical);
  const hashBuf   = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Recursively sort object keys for deterministic serialization. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}
