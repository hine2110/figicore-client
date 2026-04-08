import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateFinalPrice = (originalPrice: number, promo: any) => {
  // 1. Check if promo exists, is active, AND within valid date range
  if (!promo || !promo.is_active) return originalPrice;

  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) return originalPrice;
  if (promo.end_date && new Date(promo.end_date) < now) return originalPrice;

  // 2. Check Price Range Rules
  // Use Number() to ensure we handle potentially string/decimal values from API
  const minRule = promo.min_apply_price ? Number(promo.min_apply_price) : 0;
  const maxRule = promo.max_apply_price ? Number(promo.max_apply_price) : Infinity;

  // If the specific variant price is OUTSIDE the range, return original price
  if (originalPrice < minRule || originalPrice > maxRule) {
    return originalPrice;
  }

  // 3. Apply Discount
  const discountValue = Number(promo.value);
  if (promo.type_code === 'PERCENTAGE') {
    return originalPrice * (1 - discountValue / 100);
  } else {
    return originalPrice - discountValue;
  }
};
