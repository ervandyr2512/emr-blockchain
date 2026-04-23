/**
 * dateUtils.ts
 * ------------
 * Safe date formatting helpers.
 * Prevents crashes when Firebase data has missing / null / invalid timestamps.
 */

import { format, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";

/**
 * Safely format a date string.
 * Returns `fallback` (default "—") if the value is missing, null, or not a valid date.
 */
export function safeFormat(
  value: string | number | Date | undefined | null,
  fmt: string,
  fallback = "—"
): string {
  if (value === undefined || value === null || value === "") return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return fallback;
  return format(d, fmt, { locale: localeId });
}
