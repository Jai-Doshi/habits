/**
 * Returns today's date as a YYYY-MM-DD string in the user's LOCAL timezone.
 * Using toISOString() would give UTC which is wrong for users with UTC offset ≠ 0.
 *
 * @param {Date} [date=new Date()] - the date to format (defaults to now)
 * @returns {string} e.g. "2026-04-18"
 */
export function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's local date string (shorthand for localDateStr()).
 * @returns {string} e.g. "2026-04-18"
 */
export const todayLocal = () => localDateStr(new Date());

/**
 * Adds `deltaDays` to a date and returns a local date string.
 * @param {Date|string} base - base date (Date object or YYYY-MM-DD string)
 * @param {number} deltaDays - number of days to add (negative = subtract)
 * @returns {string} e.g. "2026-04-15"
 */
export function addDays(base, deltaDays) {
  const d = typeof base === 'string' ? new Date(`${base}T00:00:00`) : new Date(base);
  d.setDate(d.getDate() + deltaDays);
  return localDateStr(d);
}
