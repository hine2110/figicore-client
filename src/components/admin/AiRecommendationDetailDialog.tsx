import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart3, 
  Target, 
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { SystemRecommendation } from '@/services/ai-assistant.service';

interface Props {
  recommendation: SystemRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (id: number) => Promise<void>;
  isApplying: boolean;
}

export const AiRecommendationDetailDialog: React.FC<Props> = ({ 
  recommendation, 
  isOpen, 
  onClose, 
  onApply,
  isApplying
}) => {
  if (!recommendation) return null;

  const action = recommendation.suggested_action || {};
  const metrics = action.original_metrics || {};

  const MetricCard = ({ icon: Icon, label, value, subValue, hint, color }: any) => (
    <div className="bg-muted/30 border border-border/50 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${color} bg-white shadow-sm`}>
          <Icon size={20} className="text-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
          <div className="text-lg font-bold">{value}</div>
          {subValue && <div className="text-[10px] text-muted-foreground uppercase font-semibold">{subValue}</div>}
        </div>
      </div>
      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground leading-tight italic">
        {hint}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
            <BarChart3 size={16} />
            <span>AI Strategy Detail</span>
          </div>
          <DialogTitle className="text-2xl font-bold leading-tight">
            {recommendation.title}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {recommendation.reasoning}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Metrics Grid */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard 
                icon={BarChart3} 
                label="Sức mua (Velocity)" 
                value={`${metrics.ads_30d || 0} sản phẩm / ngày` }
                subValue="Trung bình 30 ngày"
                hint="Cho biết trung bình mỗi ngày khách hàng chốt bao nhiêu đơn cho mẫu này."
                color="text-blue-600"
              />
              <MetricCard 
                icon={metrics.momentum >= 1.1 ? TrendingUp : (metrics.momentum >= 0.9 ? BarChart3 : TrendingDown)} 
                label="Xu hướng (Trend)" 
                value={metrics.momentum ? `${(metrics.momentum * 100).toFixed(0)}%` : 'N/A'}
                subValue={
                  metrics.momentum >= 1.1 ? "Đang tăng (Heating Up)" : 
                  metrics.momentum >= 0.9 ? "Ổn định (Stable)" : 
                  "Đang giảm (Cooling Down)"
                }
                hint="So sánh sức mua 7 ngày gần đây với cả tháng để biết hàng đang 'hot' hay đang 'nguội'."
                color={
                  metrics.momentum >= 1.1 ? "text-emerald-600" : 
                  metrics.momentum >= 0.9 ? "text-blue-600" : 
                  "text-orange-600"
                }
              />
              <MetricCard 
                icon={Clock} 
                label="Thời gian hết hàng" 
                value={metrics.days_of_health === 999 ? '∞' : `${metrics.days_of_health || 0} ngày`}
                subValue="Dự kiến cháy hàng"
                hint="Dựa vào tốc độ bán, AI dự đoán bạn còn đủ hàng để bán trong bao nhiêu ngày nữa."
                color="text-purple-600"
              />
            </div>
          </div>

          {/* Expected Outcome */}
          <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-primary/5 opacity-50">
              <Target size={120} />
            </div>
            <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <ArrowUpRight size={18} />
              Strategic Goal & Outcome
            </h4>
            <p className="text-foreground/80 font-medium text-lg leading-snug">
              {action.expected_outcome || "Optimizing inventory turnover and maximizing market capturing based on current velocity."}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm">
               <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 italic">
                  <ShieldCheck size={14} />
                  Safe Application
               </div>
               <div className="text-muted-foreground">
                  Target: <span className="font-semibold text-foreground">{action.variant_name}</span> 
                  <span className="mx-2 text-border">|</span>
                  SKU: <span className="font-mono text-xs">{action.sku}</span>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => onApply(recommendation.recommendation_id)} 
            disabled={isApplying}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {isApplying ? 'Processing...' : 'Apply Strategy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
