import type { Employee } from './types';

/**
 * Mock employee data for development/testing
 * Replace this with actual API data in production
 */
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    department: 'Engineering',
    office: 'Oslo',
    skills: ['React', 'TypeScript', 'Node.js', 'Docker'],
    seniority: 5,
  },
  {
    id: '2',
    name: 'Bob Smith',
    department: 'Design',
    office: 'Stockholm',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    seniority: 4,
  },
  {
    id: '3',
    name: 'Charlie Brown',
    department: 'Engineering',
    office: 'Oslo',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
    seniority: 6,
  },
  {
    id: '4',
    name: 'Diana Prince',
    department: 'Product',
    office: 'Copenhagen',
    skills: ['Product Strategy', 'Analytics', 'User Research'],
    seniority: 5,
  },
  {
    id: '5',
    name: 'Erik Hansen',
    department: 'Engineering',
    office: 'Stockholm',
    skills: ['React', 'TypeScript', 'GraphQL', 'Jest'],
    seniority: 3,
  },
  {
    id: '6',
    name: 'Frida Andersson',
    department: 'Design',
    office: 'Oslo',
    skills: ['Figma', 'Illustration', 'Brand Design'],
    seniority: 4,
  },
  {
    id: '7',
    name: 'Gunnar Olsen',
    department: 'Engineering',
    office: 'Copenhagen',
    skills: ['Go', 'Kubernetes', 'Microservices', 'gRPC'],
    seniority: 7,
  },
  {
    id: '8',
    name: 'Hanna Lindberg',
    department: 'Product',
    office: 'Stockholm',
    skills: ['Product Management', 'Data Analysis', 'Agile'],
    seniority: 5,
  },
];

