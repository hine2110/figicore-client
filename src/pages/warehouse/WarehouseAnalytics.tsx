import { useState, useEffect } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/order.service";
import { WarehouseAnalyticsContent } from "@/components/warehouse/WarehouseAnalyticsContent";

export default function WarehouseAnalytics() {
    const [kpi, setKpi] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const currentMonthLabel = format(now, "MMMM yyyy");
    const previousMonthLabel = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "MMMM yyyy");

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await orderService.getDashboardKPIs();
            setKpi(data);
        } catch (err) {
            console.error("Failed to fetch analytics KPIs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-neutral-400 text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!kpi) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-neutral-400">Failed to load analytics data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Business Analytics</h1>
                    <p className="text-neutral-500 mt-1">
                        Month-to-date performance · <span className="font-semibold text-orange-600">{currentMonthLabel}</span>
                        <span className="text-neutral-300 mx-2">vs</span>
                        <span className="text-neutral-400">{previousMonthLabel}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <WarehouseAnalyticsContent 
                kpi={kpi} 
                currentMonthLabel={currentMonthLabel} 
                previousMonthLabel={previousMonthLabel} 
            />
        </div>
    );
}
