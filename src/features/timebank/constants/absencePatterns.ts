/**
 * Patterns for detecting absence-related time entries
 * Using regex with word boundaries to avoid false positives
 * (e.g., "seasick" should not match "sick")
 */

/** Project name patterns that indicate absence */
export const ABSENCE_PROJECT_PATTERNS: RegExp[] = [
  /\babsence\b/i,
  /\binternal\s+absence\b/i,
];

/** Task name patterns that indicate absence */
export const ABSENCE_TASK_PATTERNS: RegExp[] = [
  /\babsence\b/i,
  /\bavspasering\b/i, // Norwegian: time off in lieu
  /\bvacation\b/i,
  /\bferie\b/i, // Norwegian: vacation
  /\bsykdom\b/i, // Norwegian: sick leave
  /\bsick\s*(leave|day)?\b/i, // Won't match "seasick"
];

/**
 * Check if a string matches any pattern in an array
 */
export const matchesAnyPattern = (value: string, patterns: RegExp[]): boolean => {
  return patterns.some((pattern) => pattern.test(value));
};
