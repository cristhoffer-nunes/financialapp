/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'receita' | 'despesa';

export type AccountType = 'corrente' | 'poupanca' | 'investimento' | 'carteira';

export type PaymentMethod = 'debito' | 'credito' | 'dinheiro' | 'outro';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name, e.g. "Home", "Wine", etc.
  color: string; // Tailwind tint or custom hex
  type: TransactionType;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string; // e.g. "Nubank", "Itaú", etc.
  type: AccountType;
  initialBalance: number;
  color: string; // Custom color identifier, e.g. "#4F46E5"
}

export interface CreditCard {
  id: string;
  name: string;
  bankName: string;
  limit: number;
  closingDay: number; // Statement closing day (1-30)
  dueDay: number; // Statement due day (1-30)
  color: string; // Hex color for card UI
}

export interface Loan {
  id: string;
  name: string;
  lender: string; // Institution or person
  totalAmount: number;
  interestRate?: number; // annual or monthly percentage %
  startDate: string; // YYYY-MM-DD
  installmentsTotal: number;
  installmentsPaid: number;
  monthlyPayment: number;
  bankAccountId: string; // ID of the account linked for auto/manual payments
  notes?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD (allows reprogramming dates)
  categoryId: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string; // Target account for receipts, cash debit, or loan withdrawals
  creditCardId?: string; // Selected card for credit card transactions
  loanId?: string; // ID of the loan, if this transaction represents an installment payment
  status: 'pago' | 'pendente'; // Pago means instantly deducted from account. Pendente is planned/future.
  notes?: string;
  isInstallmentPayment?: boolean; // True if this transaction was spawned from an installment payment
}

export interface MonthlyGoal {
  month: string; // YYYY-MM
  targetAmount: number; // General saving rate goal
  incomeTarget?: number;
}

export interface CategoryBudget {
  categoryId: string;
  limitAmount: number;
}

export interface UserProfile {
  name: string;
  currency: string;
}

export interface MonthlyTotals {
  incomesPaid: number; // Paid income
  expensesPaid: number; // Paid expenses (cash + debit + settled card)
  incomesPending: number; // Scheduled upcoming incomes
  expensesPending: number; // Scheduled/pending upcoming expenses
  cardExpensesPaid: number; // Settled card expenses
  cardExpensesPending: number; // Unbilled card expenses
  loanOwedTotal: number; // Total outstanding debt of all loans
  savings: number; // paid incomes - paid expenses
}

export interface CategoryDistribution {
  categoryId: string;
  amount: number;
  percentage: number;
}
