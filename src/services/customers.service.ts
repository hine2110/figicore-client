import api from './api';

export interface Customer {
  user_id: number;
  loyalty_points: number;
  current_rank_code: string;
  total_spent: string;
  users: {
    full_name: string;
    email: string;
    phone: string;
    status_code: string;
    avatar_url: string | null;
    addresses?: any[];
  };
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
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

export const customersService = {
  getCustomers: async (params: GetCustomersParams): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
};
