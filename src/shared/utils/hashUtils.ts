/**
 * Creates a deterministic hash from an employee ID and date string
 * This ensures the same employee ID + date combination always produces the same hash
 */
export const hashEmployeeId = (employeeId: string, dateString: string): string => {
  const combined = `${employeeId}:${dateString}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
};

/**
 * Finds an employee by comparing hashed IDs
 */
export const findEmployeeByHash = <T extends { id: string }>(
  employees: T[],
  hashedId: string,
  dateString: string
): T | undefined => {
  return employees.find((emp) => hashEmployeeId(emp.id, dateString) === hashedId);
};
