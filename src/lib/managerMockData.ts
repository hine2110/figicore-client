export const MANAGER_KPIS = [
    { label: 'Total Revenue', value: '$124,500', change: '+12%', trend: 'up' },
    { label: 'Active Orders', value: '45', change: '+5%', trend: 'up' },
    { label: 'Avg Order Value', value: '$320', change: '-2%', trend: 'down' },
    { label: 'Team Efficiency', value: '94%', change: '+1%', trend: 'up' },
];

export const TEAM_MEMBERS = [
    { id: 'S1', name: 'Sarah Connor', role: 'Staff', status: 'Active', performance: 'High', shift: 'Morning' },
    { id: 'S2', name: 'Kyle Reese', role: 'Staff', status: 'Active', performance: 'Medium', shift: 'Afternoon' },
    { id: 'S3', name: 'T-800', role: 'Security', status: 'Inactive', performance: 'Low', shift: 'Night' },
];

export const SALES_REPORTS = [
    { id: 'R1', date: '2026-05-20', orders: 150, revenue: 45000, topCategory: 'Electronics' },
    { id: 'R2', date: '2026-05-19', orders: 120, revenue: 38000, topCategory: 'Wearables' },
    { id: 'R3', date: '2026-05-18', orders: 135, revenue: 41500, topCategory: 'Electronics' },
];

export const CAMPAIGNS = [
    { id: 'C1', name: 'Summer Sale', status: 'Active', reach: '15k', type: 'Email' },
    { id: 'C2', name: 'New Arrivals', status: 'Paused', reach: '5k', type: 'Social Media' },
    { id: 'C3', name: 'Loyalty Bonus', status: 'Draft', reach: '-', type: 'App Notification' },
];

export const PENDING_RETURNS = [
    { id: 'RT1', order: '#FC-888', customer: 'Alice', daysOpen: 2, amount: 250, status: 'Pending Approval' },
    { id: 'RT2', order: '#FC-890', customer: 'Bob', daysOpen: 1, amount: 90, status: 'Pending Inspection' },
];

export const FEEDBACK_ITEMS = [
    { id: 'F1', user: 'Customer #123', rating: 5, comment: 'Great service!', date: '2026-05-20' },
    { id: 'F2', user: 'Customer #456', rating: 2, comment: 'Delivery was late.', date: '2026-05-19' },
];
