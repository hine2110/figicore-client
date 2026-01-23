export const ADMIN_STATS = [
    { label: 'Total Revenue', value: '$654,200', change: '+15%', trend: 'up' },
    { label: 'Total Users', value: '12,540', change: '+8%', trend: 'up' },
    { label: 'Active Disorders', value: '3', change: '-1', trend: 'down' },
    { label: 'System Health', value: '99.9%', change: 'Stable', trend: 'neutral' },
];

export const EMPLOYEE_LIST = [
    { id: 'E1', name: 'John Manager', role: 'Manager', email: 'john@figi.com', status: 'Active', joined: '2025-01-10' },
    { id: 'E2', name: 'Sarah Staff', role: 'Staff', email: 'sarah@figi.com', status: 'Active', joined: '2025-03-15' },
    { id: 'E3', name: 'Mike Security', role: 'Staff', email: 'mike@figi.com', status: 'Disabled', joined: '2025-02-20' },
];

export const CUSTOMER_LIST = [
    { id: 'C1', name: 'Alice Wonderland', email: 'alice@example.com', orders: 15, status: 'Active', spent: '$1,200' },
    { id: 'C2', name: 'Bob Builder', email: 'bob@example.com', orders: 2, status: 'Suspended', spent: '$150' },
];

export const PROFILE_APPROVAL_QUEUE = [
    { id: 'PA1', user: 'Charlie Brown', type: 'Avatar Update', date: '2026-05-21', status: 'Pending' },
    { id: 'PA2', user: 'Diana Prince', type: 'Name Change', date: '2026-05-20', status: 'Pending' },
];

export const ADMIN_PRODUCTS = [
    { id: 'P1', name: 'Pro Gaming Headset', category: 'Electronics', price: 199.99, stock: 45, status: 'Active' },
    { id: 'P2', name: 'Ergo Chair Ultra', category: 'Furniture', price: 450.00, stock: 12, status: 'Hidden' },
];

export const ADMIN_AUCTIONS = [
    { id: 'A1', item: 'Vintage Watch 1950', currentBid: '$5,400', bids: 12, status: 'Live', endsIn: '2h 15m' },
    { id: 'A2', item: 'Signed Guitar', currentBid: '$1,200', bids: 5, status: 'Scheduled', endsIn: '2d' },
];

export const REFUND_REQUESTS = [
    { id: 'RF1', order: '#FC-1011', customer: 'Eve Polastri', amount: 89.99, reason: 'Damaged Item', status: 'Pending' },
];

export const SYSTEM_LOGS = [
    { id: 'L1', action: 'User Login', user: 'admin@figi.com', time: '10:05 AM', ip: '192.168.1.1' },
    { id: 'L2', action: 'Update Product', user: 'manager@figi.com', time: '09:45 AM', ip: '192.168.1.25' },
    { id: 'L3', action: 'System Backup', user: 'SYSTEM', time: '02:00 AM', ip: 'localhost' },
];
