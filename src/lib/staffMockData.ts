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

export const STAFF_TASKS: StaffTask[] = [
    { id: 'T1', description: 'Pack Order #FC-1024', priority: 'High', status: 'Pending', dueTime: '10:00 AM' },
    { id: 'T2', description: 'Restock Shelf A2', priority: 'Medium', status: 'In Progress', dueTime: '11:30 AM' },
    { id: 'T3', description: 'Verify Return #R-998', priority: 'High', status: 'Pending', dueTime: '01:00 PM' },
    { id: 'T4', description: 'Inventory Check: Electronics', priority: 'Low', status: 'Pending', dueTime: '04:00 PM' },
];

export const STAFF_INVENTORY: InventoryItem[] = [
    { id: 'P1', name: 'Wireless Headphones', sku: 'WH-001', category: 'Electronics', currentStock: 15, minStock: 20, location: 'A-12', status: 'Low Stock', price: 129.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
    { id: 'P2', name: 'Smart Watch X', sku: 'SW-002', category: 'Wearables', currentStock: 45, minStock: 10, location: 'B-04', status: 'In Stock', price: 199.50, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' },
    { id: 'P3', name: 'Gaming Keyboard', sku: 'GK-003', category: 'Electronics', currentStock: 0, minStock: 5, location: 'A-15', status: 'Out of Stock', price: 89.99, image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=500&auto=format&fit=crop&q=60' },
    { id: 'P4', name: 'Laptop Stand', sku: 'LS-004', category: 'Accessories', currentStock: 22, minStock: 15, location: 'C-01', status: 'In Stock', price: 45.00, image: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=500&auto=format&fit=crop&q=60' },
];

export const STAFF_RETURNS: ReturnRequest[] = [
    { id: 'R1', orderId: '#FC-1002', customerName: 'Alice Smith', item: 'Wireless Headphones', reason: 'Defective audio', condition: 'Opened', status: 'Pending', date: '2026-05-18' },
    { id: 'R2', orderId: '#FC-0988', customerName: 'Bob Jones', item: 'Smart Watch X', reason: 'Changed mind', condition: 'Good', status: 'Approved', date: '2026-05-17' },
];

export const STAFF_SCHEDULE: StaffSchedule[] = [
    { id: 'S1', day: 'Monday', date: 'May 20', shift: '08:00 AM - 04:00 PM', role: 'Floor Manager', status: 'Scheduled' },
    { id: 'S2', day: 'Tuesday', date: 'May 21', shift: '08:00 AM - 04:00 PM', role: 'Floor Manager', status: 'Scheduled' },
    { id: 'S3', day: 'Wednesday', date: 'May 22', shift: '-', role: '-', status: 'Day Off' },
    { id: 'S4', day: 'Thursday', date: 'May 23', shift: '12:00 PM - 08:00 PM', role: 'Assistance', status: 'Scheduled' },
    { id: 'S5', day: 'Friday', date: 'May 24', shift: '12:00 PM - 08:00 PM', role: 'Assistance', status: 'Scheduled' },
];
