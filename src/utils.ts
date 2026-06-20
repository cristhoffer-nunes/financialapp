/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Transaction, MonthlyGoal, CategoryBudget } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses (Despesas)
  { id: 'moradia', name: 'Moradia', icon: '🏠', color: '#6366f1', type: 'despesa' }, // Indigo
  { id: 'supermercado', name: 'Mercado', icon: '🛒', color: '#22c55e', type: 'despesa' }, // Green
  { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#0ea5e9', type: 'despesa' }, // Sky Blue
  { id: 'alimentacao', name: 'Alimentação', icon: '🍔', color: '#f59e0b', type: 'despesa' }, // Amber
  { id: 'lazer', name: 'Lazer & Viagem', icon: '🏖', color: '#f43f5e', type: 'despesa' }, // Rose
  { id: 'saude', name: 'Saúde', icon: '🏥', color: '#ef4444', type: 'despesa' }, // Red
  { id: 'educacao', name: 'Educação', icon: '🎓', color: '#8b5cf6', type: 'despesa' }, // Violet
  { id: 'outros_despesa', name: 'Outros (Desp.)', icon: '📦', color: '#6b7280', type: 'despesa' }, // Gray

  // Incomes (Receitas)
  { id: 'salario', name: 'Salário', icon: '💼', color: '#14b8a6', type: 'receita' }, // Teal
  { id: 'investimentos', name: 'Investimentos', icon: '📈', color: '#84cc16', type: 'receita' }, // Lime
  { id: 'freelancer', name: 'Freelance', icon: '🚀', color: '#a855f7', type: 'receita' }, // Purple
  { id: 'outros_receita', name: 'Outros (Rec.)', icon: '🎁', color: '#06b6d4', type: 'receita' }, // Cyan
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    description: 'Hamburguer Gourmet & Suco',
    amount: 56.00,
    type: 'despesa',
    categoryId: 'alimentacao',
    date: '2026-06-12',
    notes: 'Jantar de sexta com amigos',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't2',
    description: 'Salário Principal',
    amount: 4200.00,
    type: 'receita',
    categoryId: 'salario',
    date: '2026-06-10',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't3',
    description: 'Combustível Carro',
    amount: 180.00,
    type: 'despesa',
    categoryId: 'transporte',
    date: '2026-06-08',
    notes: 'Tanque cheio',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't4',
    description: 'Supermercado Mensal',
    amount: 412.50,
    type: 'despesa',
    categoryId: 'supermercado',
    date: '2026-06-05',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't5',
    description: 'Reembolso Despesas Uber',
    amount: 150.00,
    type: 'receita',
    categoryId: 'outros_receita',
    date: '2026-06-02',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't6',
    description: 'Aluguel do Apartamento',
    amount: 1200.00,
    type: 'despesa',
    categoryId: 'moradia',
    date: '2026-06-01',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't7',
    description: 'Curso UI/UX Design',
    amount: 199.00,
    type: 'despesa',
    categoryId: 'educacao',
    date: '2026-06-01',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't8',
    description: 'Desenvolvimento Landing Page',
    amount: 950.00,
    type: 'receita',
    categoryId: 'freelancer',
    date: '2026-05-28',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't9',
    description: 'Farmácia - Medicamentos',
    amount: 85.00,
    type: 'despesa',
    categoryId: 'saude',
    date: '2026-05-25',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't10',
    description: 'Cinema + Pipoca',
    amount: 62.00,
    type: 'despesa',
    categoryId: 'lazer',
    date: '2026-05-22',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't11',
    description: 'Supermercado Semanal',
    amount: 215.30,
    type: 'despesa',
    categoryId: 'supermercado',
    date: '2026-05-18',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't12',
    description: 'Salário Principal (Maio)',
    amount: 4200.00,
    type: 'receita',
    categoryId: 'salario',
    date: '2026-05-10',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't13',
    description: 'Conta de Energia + Internet',
    amount: 245.00,
    type: 'despesa',
    categoryId: 'moradia',
    date: '2026-05-05',
    paymentMethod: 'debito',
    status: 'pago'
  },
  {
    id: 't14',
    description: 'Rendimento Dividendos FIIs',
    amount: 112.40,
    type: 'receita',
    categoryId: 'investimentos',
    date: '2026-05-03',
    paymentMethod: 'debito',
    status: 'pago'
  }
];

export const DEFAULT_GOAL: MonthlyGoal = {
  month: '2026-06',
  targetAmount: 1200.00, // Budget 1200 to save
  incomeTarget: 4500.00
};

export const DEFAULT_BUDGETS: CategoryBudget[] = [
  { categoryId: 'moradia', limitAmount: 1300 },
  { categoryId: 'supermercado', limitAmount: 700 },
  { categoryId: 'alimentacao', limitAmount: 500 },
  { categoryId: 'transporte', limitAmount: 400 },
  { categoryId: 'lazer', limitAmount: 400 },
  { categoryId: 'saude', limitAmount: 200 },
  { categoryId: 'educacao', limitAmount: 300 }
];

// Helper formatters
export const formatCurrency = (amount: number, locale = 'pt-BR', currency = 'BRL'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Returns date string in browser format: "12 de jun." or "12/06/2026"
export const formatDateFriendly = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

// Gets category object from list
export const getCategoryById = (id: string, categories: Category[] = DEFAULT_CATEGORIES): Category => {
  return categories.find(c => c.id === id) || {
    id: 'unknown',
    name: 'Não Identificado',
    icon: '❓',
    color: '#9ca3af',
    type: 'despesa'
  };
};

// Extract YYYY-MM from a YYYY-MM-DD date string
export const getYearMonth = (dateStr: string): string => {
  return dateStr.substring(0, 7);
};

// Generate list of distinct months (YYYY-MM) in transactions list
export const getAvailableMonths = (transactions: Transaction[]): string[] => {
  const months = transactions.map(t => getYearMonth(t.date));
  const uniqueMonths = Array.from(new Set(months));
  // Sort in descending order (newest first)
  return uniqueMonths.sort((a, b) => b.localeCompare(a));
};

// Portuguese month names mapping
export const getMonthName = (yearMonthStr: string): string => {
  if (!yearMonthStr) return '';
  const [year, month] = yearMonthStr.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  const name = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1) + ' de ' + year;
};

// Serialize and Deserialize helpers for due dates inside the notes field to enable database-less synchronization
export interface NotesWithMetadata {
  notesText: string;
  dueDate?: string;
}

export const parseNotesWithMetadata = (serializedNotes: string | undefined): NotesWithMetadata => {
  if (!serializedNotes) return { notesText: '' };
  if (serializedNotes.startsWith('{"notesText":') || serializedNotes.startsWith('{"text":')) {
    try {
      const parsed = JSON.parse(serializedNotes);
      return {
        notesText: parsed.notesText || parsed.text || '',
        dueDate: parsed.dueDate
      };
    } catch {
      // fallback
    }
  }
  // Try pattern matching [VENCIMENTO:YYYY-MM-DD]
  const match = serializedNotes.match(/\[VENCIMENTO:([\d\-]+)\]/);
  if (match) {
    const dueDate = match[1];
    const notesText = serializedNotes.replace(/\[VENCIMENTO:([\d\-]+)\]/, '').trim();
    return { notesText, dueDate };
  }
  return { notesText: serializedNotes };
};

export const serializeNotesWithMetadata = (notesText: string, dueDate?: string): string => {
  if (!dueDate) return notesText;
  return JSON.stringify({ notesText, dueDate });
};
