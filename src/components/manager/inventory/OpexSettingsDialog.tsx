import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGetOpexConfig, useUpdateOpexConfig } from "@/hooks/useOpexSettings";
import { Settings, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface OpexSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpexSettingsDialog({ open, onOpenChange }: OpexSettingsDialogProps) {
  const { data: config, isLoading } = useGetOpexConfig();
  const updateMutation = useUpdateOpexConfig();

  const [localValues, setLocalValues] = useState({
    marketing_pct: 0,
    staff_pct: 0,
    storage_pct: 0,
    risk_pct: 0,
    tax_pct: 0,
  });

  useEffect(() => {
    if (config) {
      setLocalValues({
        marketing_pct: Number(config.marketing_pct),
        staff_pct: Number(config.staff_pct),
        storage_pct: Number(config.storage_pct),
        risk_pct: Number(config.risk_pct),
        tax_pct: Number(config.tax_pct),
      });
    }
  }, [config]);

  const total = localValues.marketing_pct + 
                localValues.staff_pct + 
                localValues.storage_pct + 
                localValues.risk_pct + 
                localValues.tax_pct;

  const isOverLimit = total > 100;

  const handleSave = () => {
    if (isOverLimit) return;
    updateMutation.mutate(localValues, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const renderSlider = (label: string, field: keyof typeof localValues, color: string) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-neutral-700">{label}</Label>
        <span className={`text-sm font-bold ${color}`}>{localValues[field]}%</span>
      </div>
      <Slider
        value={[localValues[field]]}
        max={100}
        step={1}
        onValueChange={([val]) => setLocalValues(prev => ({ ...prev, [field]: val }))}
        className="cursor-pointer"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-neutral-50 -mx-6 -mt-6 p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Pricing Logic Settings</DialogTitle>
              <DialogDescription>
                Configure Operational Expenditure (OPEX) to adjust AI break-even calculations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Total OPEX Indicator */}
          <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-3 shadow-lg relative overflow-hidden group">
             <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Total OPEX Burden</p>
                  <h2 className={`text-3xl font-black ${isOverLimit ? 'text-red-400' : 'text-purple-400'}`}>
                    {total}%
                  </h2>
                </div>
                {isOverLimit ? (
                   <Badge variant="destructive" className="gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Exceeds 100%
                   </Badge>
                ) : (
                   <Badge className="bg-green-500/20 text-green-400 border-none gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid Config
                   </Badge>
                )}
             </div>
             
             <Progress 
                value={total} 
                className={`h-2 bg-neutral-800 border border-neutral-700 transition-all ${isOverLimit ? 'text-red-500' : 'text-purple-500'}`} 
                indicatorClassName={`${isOverLimit ? 'bg-red-500' : 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'}`}
             />

             {/* Background Decoration */}
             <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                <Settings className="w-24 h-24" />
             </div>
          </div>

          <div className="space-y-6">
            {renderSlider("Marketing Expenditure", "marketing_pct", "text-blue-600")}
            {renderSlider("Staffing & Payroll", "staff_pct", "text-indigo-600")}
            {renderSlider("Storage & Logistics", "storage_pct", "text-pink-600")}
            {renderSlider("Risk & Insurance", "risk_pct", "text-orange-600")}
            {renderSlider("General Tax", "tax_pct", "text-green-600")}
          </div>

          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex gap-3 text-blue-800">
             <Info className="w-5 h-5 shrink-0" />
             <p className="text-[11px] leading-relaxed">
                <span className="font-bold">AI Insight:</span> These settings directly influence the "Break-even Floor". 
                Higher OPEX will force AI to recommend smaller discounts to protect your margins.
             </p>
          </div>
        </div>

        <DialogFooter className="bg-neutral-50 -mx-6 -mb-6 p-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isOverLimit || updateMutation.isPending || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md min-w-[120px]"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
