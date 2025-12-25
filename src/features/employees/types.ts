export interface Employee {
  id: string;
  name: string;
  firstName: string;
  surname: string;
  avatarImageUrl?: string;
  department: string;
  office: string;
  skills: string[];
  age: number | string; // Age or '-' if unknown
  supervisor?: string; // Supervisor name or '-' if unknown
}

export interface EmployeesState {
  employees: Employee[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

