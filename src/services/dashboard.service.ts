import api from './api';

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  counts: {
    retail: number;
    livestream: number;
    preorder: number;
    blindbox: number;
    auction: number;
    giveaway: number;
  };
  revenue: {
    retail: number;
    livestream: number;
    preorder: number;
    blindbox: number;
    auction: number;
    giveaway: number;
  };
}

export interface ManagerStats {
  online: AnalyticsData;
  offline: AnalyticsData;
  totalRevenue: number;
  totalOrders: number;
  prevTotalRevenue: number;
  activeStaff: number;
  lowStockAlerts: number;
  revenueTrend: any[];
}

export interface WarehouseStats {
  readyToPack: number;
  packedCount: number;
  shippingCount: number;
  deliveredCount: number;
  lowStockAlerts: number;
  inventoryTrend: any[];
  analytics: {
    current: any;
    previous: any;
    growth: any;
    activePreorderContracts: number;
  };
}

export const dashboardService = {
  getManagerStats: async (range: string = 'week', startDate?: string, endDate?: string): Promise<ManagerStats> => {
    let url = `/dashboard/manager-stats?range=${range}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await api.get(url);
    return response.data;
  },

  getWarehouseStats: async (range: string = 'week', startDate?: string, endDate?: string): Promise<WarehouseStats> => {
    let url = `/dashboard/warehouse-stats?range=${range}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await api.get(url);
    return response.data;
  }
};
