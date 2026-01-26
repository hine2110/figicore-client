// File: src/services/options.service.ts
import { axiosInstance } from '@/lib/axiosInstance';

export const optionsService = {
    // --- BRANDS ---
    getBrands: async () => {
        const response = await axiosInstance.get('/brands');
        return response.data;
    },
    createBrand: async (name: string) => {
        const response = await axiosInstance.post('/brands/quick-create', { name });
        return response.data;
    },

    // --- CATEGORIES ---
    getCategories: async () => {
        const response = await axiosInstance.get('/categories');
        return response.data;
    },
    createCategory: async (name: string) => {
        const response = await axiosInstance.post('/categories/quick-create', { name });
        return response.data;
    },

    // --- SERIES ---
    getSeries: async () => {
        const response = await axiosInstance.get('/series');
        return response.data;
    },
    createSeries: async (name: string) => {
        const response = await axiosInstance.post('/series/quick-create', { name });
        return response.data;
    }
};