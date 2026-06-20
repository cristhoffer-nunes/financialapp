/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  ShoppingCart, 
  Car, 
  Utensils, 
  Compass, 
  HeartPulse, 
  GraduationCap, 
  Layers, 
  Briefcase, 
  TrendingUp, 
  Laptop, 
  Gift, 
  HelpCircle,
  CreditCard,
  Coins,
  LucideProps
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  ShoppingCart,
  Car,
  Utensils,
  Compass,
  HeartPulse,
  GraduationCap,
  Layers,
  Briefcase,
  TrendingUp,
  Laptop,
  Gift,
  HelpCircle,
  CreditCard,
  Coins
};

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CategoryIcon({ name, className = 'w-4 h-4', style }: CategoryIconProps) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} style={style} />;
}
