import { compareTwoStrings } from "string-similarity";
import { Employee } from "@/features/game/employees";

/**
 * Normalize a name for comparison
 */
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
};

interface MatchResult {
  employee: Employee;
  score: number;
  matchType: string;
}

/**
 * Find the best matching employee for a given user name
 * @param userName - The logged-in user's name
 * @param employees - List of employees to search
 * @returns The matching employee with the highest score or null if no good match found
 */
export const findMatchingEmployee = (userName: string | undefined, employees: Employee[]): Employee | null => {
  if (!userName || employees.length === 0) {
    return null;
  }

  const normalizedUserName = normalizeName(userName);
  const matches: MatchResult[] = [];
  const threshold = 0.5; // Minimum similarity threshold (50%)

  for (const employee of employees) {
    const normalizedEmployeeName = normalizeName(employee.name);
    const fullName = normalizeName(`${employee.firstName} ${employee.surname}`);
    const normalizedFirstName = normalizeName(employee.firstName);
    const normalizedSurname = normalizeName(employee.surname);

    // Try exact match first
    if (normalizedEmployeeName === normalizedUserName) {
      return employee;
    }
    if (fullName === normalizedUserName) {
      return employee;
    }

    // Calculate similarity scores for different name combinations
    const nameScore = compareTwoStrings(normalizedUserName, normalizedEmployeeName);
    const fullNameScore = compareTwoStrings(normalizedUserName, fullName);
    const firstNameScore = compareTwoStrings(normalizedUserName, normalizedFirstName);
    const surnameScore = compareTwoStrings(normalizedUserName, normalizedSurname);

    // Store all matches above threshold
    if (nameScore >= threshold) {
      matches.push({ employee, score: nameScore, matchType: "name" });
    }
    if (fullNameScore >= threshold) {
      matches.push({ employee, score: fullNameScore, matchType: "fullName" });
    }
    if (firstNameScore >= threshold) {
      matches.push({ employee, score: firstNameScore, matchType: "firstName" });
    }
    if (surnameScore >= threshold) {
      matches.push({ employee, score: surnameScore, matchType: "surname" });
    }
  }

  // Return the employee with the highest match score
  if (matches.length === 0) {
    return null;
  }

  // Sort by score descending and return the best match
  matches.sort((a, b) => b.score - a.score);
  const bestMatch = matches[0];

  return bestMatch.employee;
};
