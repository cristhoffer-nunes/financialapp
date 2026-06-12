/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'receita' | 'despesa';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date YYYY-MM-DD
  notes?: string;
}

export interface MonthlyGoal {
  month: string; // Format YYYY-MM
  targetAmount: number; // Target amount to save
  incomeTarget?: number; // Target income
}

export interface CategoryBudget {
  categoryId: string;
  limitAmount: number;
}

export interface UserProfile {
  name: string;
  currency: string; // BRL (R$), USD ($), EUR (€), etc.
}
