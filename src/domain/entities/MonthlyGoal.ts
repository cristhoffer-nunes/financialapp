/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonthlyGoal, CategoryBudget } from '../../types';

export const DEFAULT_GOAL: MonthlyGoal = {
  month: '2026-06',
  targetAmount: 1500.00,
  incomeTarget: 5000.00
};

export const DEFAULT_BUDGETS: CategoryBudget[] = [
  { categoryId: 'moradia', limitAmount: 1800 },
  { categoryId: 'supermercado', limitAmount: 1000 },
  { categoryId: 'alimentacao', limitAmount: 600 },
  { categoryId: 'transporte', limitAmount: 500 },
  { categoryId: 'lazer', limitAmount: 400 },
  { categoryId: 'saude', limitAmount: 300 },
  { categoryId: 'educacao', limitAmount: 400 }
];
