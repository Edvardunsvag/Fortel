/**
 * Obfuscates an employee ID by rearranging characters
 * This provides a simple obfuscation without relying on dates
 */
export const hashEmployeeId = (employeeId: string): string => {
  // Simple obfuscation: split in half, reverse each half, then swap them
  const mid = Math.floor(employeeId.length / 2);
  const firstHalf = employeeId.slice(0, mid);
  const secondHalf = employeeId.slice(mid);

  // Reverse each half and swap them
  const reversedFirst = firstHalf.split("").reverse().join("");
  const reversedSecond = secondHalf.split("").reverse().join("");

  return reversedSecond + reversedFirst;
};

/**
 * Finds an employee by comparing obfuscated IDs
 * The hashedId should be the obfuscated version (from hashEmployeeId)
 * Also checks direct match for backward compatibility with old data
 */
export const findEmployeeByHash = <T extends { id: string }>(employees: T[], hashedId: string): T | undefined => {
  // Primary check: find employee whose obfuscated ID matches
  const foundByObfuscation = employees.find((emp) => hashEmployeeId(emp.id) === hashedId);
  if (foundByObfuscation) {
    return foundByObfuscation;
  }
  // Fallback: check if hashedId is a direct match (for backward compatibility)
  return employees.find((emp) => emp.id === hashedId);
};
