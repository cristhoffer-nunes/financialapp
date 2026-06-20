/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, TransactionType } from '../../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses (Despesas) - Slate, Emerald, Rose or Indigo colors for visual flair
  { id: 'moradia', name: 'Moradia & Contas', icon: 'Home', color: '#6366f1', type: 'despesa' }, // indigo
  { id: 'supermercado', name: 'Supermercado', icon: 'ShoppingCart', color: '#f59e0b', type: 'despesa' }, // amber
  { id: 'transporte', name: 'Aluguel & Transporte', icon: 'Car', color: '#3b82f6', type: 'despesa' }, // blue
  { id: 'alimentacao', name: 'Alimentação & Delivery', icon: 'Utensils', color: '#ef4444', type: 'despesa' }, // red
  { id: 'lazer', name: 'Lazer & Viagens', icon: 'Compass', color: '#ec4899', type: 'despesa' }, // pink
  { id: 'saude', name: 'Saúde & Bem-estar', icon: 'HeartPulse', color: '#10b981', type: 'despesa' }, // emerald
  { id: 'educacao', name: 'Educação & Cursos', icon: 'GraduationCap', color: '#8b5cf6', type: 'despesa' }, // violet
  { id: 'cartao_pagamento', name: 'Fatura de Cartão', icon: 'CreditCard', color: '#111827', type: 'despesa' }, // black
  { id: 'emprestimo_pagamento', name: 'Parcela de Empréstimo', icon: 'Coins', color: '#6b7280', type: 'despesa' }, // gray
  { id: 'outros_despesa', name: 'Outros Gastos', icon: 'Layers', color: '#14b8a6', type: 'despesa' }, // teal

  // Incomes (Receitas) - Styled in emerald or teal shades for positive inflow
  { id: 'salario', name: 'Salário & Prolabore', icon: 'Briefcase', color: '#059669', type: 'receita' },
  { id: 'investimentos', name: 'Rendimentos & Invest.', icon: 'TrendingUp', color: '#0d9488', type: 'receita' },
  { id: 'freelancer', name: 'Freelance & Extra', icon: 'Laptop', color: '#0284c7', type: 'receita' },
  { id: 'outros_receita', name: 'Outras Entradas', icon: 'Gift', color: '#0891b2', type: 'receita' },
];

export const getCategoryById = (id: string, categories: Category[] = DEFAULT_CATEGORIES): Category => {
  return categories.find(c => c.id === id) || {
    id: id || 'unknown',
    name: 'Outros',
    icon: 'Layers',
    color: '#6b7280',
    type: 'despesa'
  };
};
