/**
 * Date utility functions
 */

/**
 * Formats a date string as a relative time (e.g., "5m ago", "2h ago")
 * @param dateString - ISO 8601 date string
 * @param now - Current timestamp in milliseconds (defaults to Date.now() for testing)
 * @returns Formatted relative date string
 */
export function formatRelativeDate(
  dateString: string,
  now: number = Date.now(),
): string {
  const date = new Date(dateString);
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Safely formats a date string, returning a fallback if the date is invalid
 * @param dateString - Date string or null
 * @param fallback - Fallback string to return if date is invalid (default: "N/A")
 * @returns Formatted date string or fallback
 */
export function formatSafeDate(
  dateString: string | null | undefined,
  fallback: string = "N/A",
): string {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString();
}

/**
 * Safely formats a date-time string, returning a fallback if the date is invalid
 * @param dateString - Date string or null
 * @param fallback - Fallback string to return if date is invalid (default: "N/A")
 * @returns Formatted date-time string or fallback
 */
export function formatSafeDateTime(
  dateString: string | null | undefined,
  fallback: string = "N/A",
): string {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString();
}
