import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { SystemRecommendation } from '@/services/ai-assistant.service';

interface Props {
  recommendation: SystemRecommendation;
  onApply: (id: number) => Promise<void>;
  onDismiss: (id: number) => Promise<void>;
  onViewDetail: (rec: SystemRecommendation) => void;
}

export const AiRecommendationCard: React.FC<Props> = ({ recommendation, onApply, onDismiss, onViewDetail }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApply(recommendation.recommendation_id);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setIsDismissing(true);
      await onDismiss(recommendation.recommendation_id);
    } finally {
      setIsDismissing(false);
    }
  };

  // Determine an elegant color based on type
  const getGradient = () => {
    if (recommendation.type === 'DISCOUNT') return 'from-purple-500/10 to-blue-500/10 border-purple-200';
    if (recommendation.type === 'RESTOCK') return 'from-orange-500/10 to-yellow-500/10 border-orange-200';
    return 'from-emerald-500/10 to-teal-500/10 border-emerald-200';
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br transition-all duration-300 hover:shadow-md ${getGradient()}`}>
      {/* Decorative Sparkle */}
      <div className="absolute top-4 right-4 text-primary/20">
        <Sparkles size={40} strokeWidth={1} />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
          <Sparkles size={16} />
          <span>AI Insight • {recommendation.type}</span>
        </div>
        <CardTitle className="text-xl leading-tight text-foreground pr-10">
          {recommendation.title}
        </CardTitle>
        {recommendation.suggested_action?.variant_name && (
          <div className="text-[10px] font-mono text-muted-foreground mt-1 px-1 bg-background/30 w-fit rounded border border-border/30">
            {recommendation.suggested_action.variant_name} • {recommendation.suggested_action.sku}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="text-muted-foreground text-sm z-10 relative">
        <p className="leading-relaxed">{recommendation.reasoning}</p>

        {recommendation.type === 'DISCOUNT' && recommendation.suggested_action && (
           <div className="mt-4 p-3 bg-background/50 rounded-md border border-border/50 backdrop-blur-sm">
             <div className="text-xs font-semibold text-foreground mb-1">Proposed Action:</div>
             <div className="flex justify-between items-center text-xs">
                <span>Discount: <span className="font-bold text-destructive">{recommendation.suggested_action.discount_percent}% OFF</span></span>
                <span>Duration: <span className="font-medium text-primary">{recommendation.suggested_action.duration_days} Days</span></span>
             </div>
           </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex gap-2 z-10 relative">
        <Button 
          variant="default" 
          onClick={handleApply} 
          disabled={isApplying || isDismissing}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 text-xs"
        >
          {isApplying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          Apply
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => onViewDetail(recommendation)}
          disabled={isApplying || isDismissing}
          className="flex-1 h-9 text-xs"
        >
          Details
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDismiss} 
          disabled={isApplying || isDismissing}
          className="bg-transparent hover:bg-background/80 h-9 w-9 p-0 aspect-square"
          title="Dismiss"
        >
          {isDismissing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};
