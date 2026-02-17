import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; 

interface PriceDisplayProps {
  price: number | string;
  final_price?: number | string;
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, final_price, className }) => {
  const originalPrice = Number(price);
  const finalPrice = final_price ? Number(final_price) : originalPrice;
  const isDiscounted = finalPrice < originalPrice;

  // Format currency
  const format = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  if (!isDiscounted) {
    return <span className={cn("font-semibold", className)}>{format(originalPrice)}</span>;
  }

  const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-bold text-red-600">{format(finalPrice)}</span>
      <span className="text-muted-foreground text-sm line-through decoration-slate-400">
        {format(originalPrice)}
      </span>
      {discountPercent > 0 && (
        <Badge variant="destructive" className="text-xs px-1 py-0 h-5">
          -{discountPercent}%
        </Badge>
      )}
    </div>
  );
};

export default PriceDisplay;
