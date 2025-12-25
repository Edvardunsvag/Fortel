export interface Employee {
  id: string;
  name: string;
  department: string;
  office: string;
  skills: string[];
  seniority: number; // Higher number = more senior
}

export interface EmployeesState {
  employees: Employee[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

