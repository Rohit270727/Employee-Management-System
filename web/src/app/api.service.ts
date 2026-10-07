import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API } from './config';
import { AuditEntry, Dashboard, Department, Employee, EmployeeInput, Paged, Query } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private params(q: Query) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q))
      if (v !== null && v !== undefined && v !== '' && v !== false) p = p.set(k, String(v));
    return p;
  }

  employees(q: Query) { return this.http.get<Paged<Employee>>(`${API}/api/employees`, { params: this.params(q) }); }
  exportCsv(q: Query) { return this.http.get(`${API}/api/employees/export`, { params: this.params(q), responseType: 'blob' }); }
  employee(id: number) { return this.http.get<Employee>(`${API}/api/employees/${id}`); }
  createEmployee(m: EmployeeInput) { return this.http.post<Employee>(`${API}/api/employees`, m); }
  updateEmployee(id: number, m: EmployeeInput) { return this.http.put<Employee>(`${API}/api/employees/${id}`, m); }
  deleteEmployee(id: number) { return this.http.delete<void>(`${API}/api/employees/${id}`); }
  restoreEmployee(id: number) { return this.http.post<void>(`${API}/api/employees/${id}/restore`, {}); }
  uploadPhoto(id: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<{ photoUrl: string }>(`${API}/api/employees/${id}/photo`, fd);
  }

  departments() { return this.http.get<Department[]>(`${API}/api/departments`); }
  createDepartment(d: Department) { return this.http.post<Department>(`${API}/api/departments`, d); }
  updateDepartment(d: Department) { return this.http.put<Department>(`${API}/api/departments/${d.id}`, d); }
  deleteDepartment(id: number) { return this.http.delete<void>(`${API}/api/departments/${id}`); }

  dashboard() { return this.http.get<Dashboard>(`${API}/api/dashboard`); }
  audit(page: number, pageSize: number) {
    return this.http.get<Paged<AuditEntry>>(`${API}/api/audit`, { params: this.params({ page, pageSize }) });
  }
}
