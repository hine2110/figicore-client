import api from './api';
import { AxiosError } from 'axios';

export interface CreateEmployeeData {
  email: string;
  phone: string;
  full_name: string;
  role_code: 'MANAGER' | 'STAFF_POS' | 'STAFF_INVENTORY';
  employee_code?: string;
  job_title_code: string;
  base_salary: number;
  start_date?: Date;
}


export interface Employee {
  user_id: number;
  employee_code: string;
  job_title_code: string;
  base_salary: string;
  start_date: string;
  users: {
    full_name: string;
    email: string;
    phone: string;
    status_code: string;
    avatar_url: string | null;
    role_code: string;
  };
}

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const employeesService = {
  getEmployees: async (params: GetEmployeesParams): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  createEmployee: async (data: CreateEmployeeData) => {
    try {
      const response = await api.post('/employees', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          // You might want to format this error to be easily consumable by the UI
          // For now, rethrowing with a specific message or structure
          throw new Error('Employee with this code or email already exists.');
        }
        throw new Error(error.response?.data?.message || 'Failed to create employee');
      }
      throw error;
    }
  },

  getEmployeeById: async (id: number): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
};
