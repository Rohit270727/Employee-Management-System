import { API } from './config';

export interface Employee {
  id: number; fullName: string; email: string;
  departmentId: number; departmentName: string;
  salary: number; hireDate: string; photoUrl: string | null; isDeleted: boolean;
}
export interface EmployeeInput {
  fullName: string; email: string; departmentId: number; salary: number; hireDate: string;
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface Department { id: number; name: string; description: string | null; employeeCount?: number; }
export interface Dashboard {
  totalEmployees: number; totalDepartments: number; deletedCount: number;
  averageSalary: number; minSalary: number; maxSalary: number; payroll: number;
  byDepartment: { name: string; count: number; averageSalary: number }[];
  recentHires: { id: number; fullName: string; departmentName: string; hireDate: string }[];
}
export interface AuditEntry {
  id: number; timestamp: string; userName: string; action: string;
  entityName: string; entityId: number; details: string;
}
export type Query = Record<string, string | number | boolean | null | undefined>;

export const photoUrl = (u: string | null) => (u ? API + u : null);
export const initials = (n: string) =>
  n.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
