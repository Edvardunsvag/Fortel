/**
 * Admin configuration
 */
export const ADMIN_ACCOUNTS = ["edvard.unsvag@fortedigital.com", "jorgen.borgersen@fortedigital.com"] as const;

/**
 * Check if an email is an admin account
 */
export const isAdminAccount = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return (ADMIN_ACCOUNTS as readonly string[]).includes(email);
};
