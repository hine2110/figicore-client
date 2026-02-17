import { axiosInstance } from '@/lib/axiosInstance';

const BASE = '/check-in';

export interface TimesheetLog {
    date: string;
    shift_name: string;
    start_time: string | null;
    end_time: string | null;
    check_in_at: string | null;
    check_out_at: string | null;
    real_hours: number;
    status: string;
    is_flagged: boolean;
    error_tags?: string[];
}

export interface MyHistoryResponse {
    summary: {
        month: string;
        total_shifts: number;
        total_hours: number;
        expected_salary: number;
        currency: string;
    };
    logs: TimesheetLog[];
}

export const timesheetService = {
    getMyHistory: async (month?: number, year?: number): Promise<MyHistoryResponse> => {
        const response = await axiosInstance.get(`${BASE}/my-history`, {
            params: { month, year }
        });
        return response.data;
    }
};
