export interface StaffTask {
    id: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    dueTime: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minStock: number;
    location: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    price: number;
    image?: string;
}

export interface ReturnRequest {
    id: string;
    orderId: string;
    customerName: string;
    item: string;
    reason: string;
    condition: 'Good' | 'Damaged' | 'Opened';
    status: 'Pending' | 'Approved' | 'Rejected';
    date: string;
}

export interface StaffSchedule {
    id: string;
    day: string;
    date: string;
    shift: string;
    role: string;
    status: 'Scheduled' | 'Day Off';
}

export const STAFF_TASKS: StaffTask[] = [];

export const STAFF_INVENTORY: InventoryItem[] = [];

export const STAFF_RETURNS: ReturnRequest[] = [];

export const STAFF_SCHEDULE: StaffSchedule[] = [];
