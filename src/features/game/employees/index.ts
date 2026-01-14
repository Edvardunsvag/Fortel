// Employees are now managed via TanStack Query
// See src/features/employees/queries.ts for the new implementation
export type { Employee } from "./types";
export { useEmployees, useSyncEmployees } from "./queries";
