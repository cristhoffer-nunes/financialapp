/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BankAccount, CreditCard, Loan, Transaction, MonthlyGoal, CategoryBudget, UserProfile } from '../../types';

export class LocalStorageService {
  private static KEY_ACCOUNTS = 'org_accounts';
  private static KEY_CARDS = 'org_cards';
  private static KEY_LOANS = 'org_loans';
  private static KEY_TRANSACTIONS = 'org_transactions';
  private static KEY_GOAL = 'org_goal';
  private static KEY_BUDGETS = 'org_budgets';
  private static KEY_PROFILE = 'org_profile';
  private static KEY_LOGGED = 'org_logged';

  static getIsLoggedIn(): boolean {
    return localStorage.getItem(this.KEY_LOGGED) === 'true';
  }

  static setIsLoggedIn(val: boolean): void {
    if (val) {
      localStorage.setItem(this.KEY_LOGGED, 'true');
    } else {
      localStorage.removeItem(this.KEY_LOGGED);
    }
  }

  // BANK ACCOUNTS
  static getAccounts(): BankAccount[] | null {
    const data = localStorage.getItem(this.KEY_ACCOUNTS);
    return data ? JSON.parse(data) : null;
  }

  static saveAccounts(accounts: BankAccount[]): void {
    localStorage.setItem(this.KEY_ACCOUNTS, JSON.stringify(accounts));
  }

  // CREDIT CARDS
  static getCreditCards(): CreditCard[] | null {
    const data = localStorage.getItem(this.KEY_CARDS);
    return data ? JSON.parse(data) : null;
  }

  static saveCreditCards(cards: CreditCard[]): void {
    localStorage.setItem(this.KEY_CARDS, JSON.stringify(cards));
  }

  // LOANS
  static getLoans(): Loan[] | null {
    const data = localStorage.getItem(this.KEY_LOANS);
    return data ? JSON.parse(data) : null;
  }

  static saveLoans(loans: Loan[]): void {
    localStorage.setItem(this.KEY_LOANS, JSON.stringify(loans));
  }

  // TRANSACTIONS
  static getTransactions(): Transaction[] | null {
    const data = localStorage.getItem(this.KEY_TRANSACTIONS);
    return data ? JSON.parse(data) : null;
  }

  static saveTransactions(txs: Transaction[]): void {
    localStorage.setItem(this.KEY_TRANSACTIONS, JSON.stringify(txs));
  }

  // METRICS & BUDGETS
  static getGoal(): MonthlyGoal | null {
    const data = localStorage.getItem(this.KEY_GOAL);
    return data ? JSON.parse(data) : null;
  }

  static saveGoal(goal: MonthlyGoal): void {
    localStorage.setItem(this.KEY_GOAL, JSON.stringify(goal));
  }

  static getBudgets(): CategoryBudget[] | null {
    const data = localStorage.getItem(this.KEY_BUDGETS);
    return data ? JSON.parse(data) : null;
  }

  static saveBudgets(budgets: CategoryBudget[]): void {
    localStorage.setItem(this.KEY_BUDGETS, JSON.stringify(budgets));
  }

  // PROFILE
  static getProfile(): UserProfile | null {
    const data = localStorage.getItem(this.KEY_PROFILE);
    return data ? JSON.parse(data) : null;
  }

  static saveProfile(profile: UserProfile): void {
    localStorage.setItem(this.KEY_PROFILE, JSON.stringify(profile));
  }

  /**
   * Generates premium styled mock seed data for the demo account
   */
  static getInitialSeedData() {
    const todayStr = new Date().toISOString().substring(0, 10);
    const thisMonth = todayStr.substring(0, 7);

    // Dynamic dates inside current month
    const d = (day: number) => {
      const dayPad = String(day).padStart(2, '0');
      return `${thisMonth}-${dayPad}`;
    };

    const initialAccounts: BankAccount[] = [
      { id: 'acc-1', name: 'Nubank Principal', bankName: 'Nubank', type: 'corrente', initialBalance: 3200.50, color: '#9333ea' }, // purple-600
      { id: 'acc-2', name: 'Itaú Cartão e Débito', bankName: 'Itaú Unibanco', type: 'corrente', initialBalance: 1850.00, color: '#f97316' }, // orange-500
      { id: 'acc-3', name: 'Caixa Poupança', bankName: 'Caixa Econômica', type: 'poupanca', initialBalance: 12500.00, color: '#0284c7' }, // sky-600
      { id: 'acc-4', name: 'Dinheiro em Mão', bankName: 'Carteira Física', type: 'carteira', initialBalance: 350.00, color: '#10b981' } // emerald-500
    ];

    const initialCards: CreditCard[] = [
      { id: 'card-1', name: 'Nubank Roxinho', bankName: 'Nubank Mastercard', limit: 8000, closingDay: 10, dueDay: 17, color: '#7e22ce' }, // purple-700
      { id: 'card-2', name: 'Itaú Personalité Visa', bankName: 'Itaú Unibanco', limit: 25000, closingDay: 5, dueDay: 12, color: '#ea580c' } // orange-600
    ];

    const initialLoans: Loan[] = [
      { id: 'loan-1', name: 'Financiamento Hatch', lender: 'BV Financeira', totalAmount: 48000, interestRate: 1.5, startDate: '2025-01-10', installmentsTotal: 48, installmentsPaid: 15, monthlyPayment: 1350, bankAccountId: 'acc-2', notes: 'Financiamento do primeiro automóvel hatch' },
      { id: 'loan-2', name: 'Reforma do Apartamento', lender: 'Caixa Construção', totalAmount: 15000, interestRate: 0.9, startDate: '2026-03-05', installmentsTotal: 10, installmentsPaid: 3, monthlyPayment: 1580, bankAccountId: 'acc-3', notes: 'Revestimentos e móveis planejados ambientados' }
    ];

    const initialTransactions: Transaction[] = [
      // Receipts
      { id: 'tx-1', description: 'Salário Clt Mensal', amount: 5500.00, type: 'receita', date: d(5), categoryId: 'salario', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pago' },
      { id: 'tx-2', description: 'Rendimento CDI Poupança', amount: 105.40, type: 'receita', date: d(18), categoryId: 'investimentos', paymentMethod: 'debito', bankAccountId: 'acc-3', status: 'pago' },
      { id: 'tx-3', description: 'Consultoria Dev Freela', amount: 1800.00, type: 'receita', date: d(12), categoryId: 'freelancer', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pago' },
      { id: 'tx-4', description: 'Venda de Game Antigo', amount: 250.00, type: 'receita', date: d(22), categoryId: 'outros_receita', paymentMethod: 'dinheiro', bankAccountId: 'acc-4', status: 'pago' },

      // Expenses
      { id: 'tx-5', description: 'Aluguel do Apartamento', amount: 1500.00, type: 'despesa', date: d(10), categoryId: 'moradia', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pago', notes: 'Pago via pix no Nubank' },
      { id: 'tx-6', description: 'Energia Enel', amount: 185.30, type: 'despesa', date: d(12), categoryId: 'moradia', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pago' },
      { id: 'tx-7', description: 'Internet Banda Larga Fibra', amount: 119.90, type: 'despesa', date: d(15), categoryId: 'moradia', paymentMethod: 'debito', bankAccountId: 'acc-2', status: 'pago' },
      
      // Card Expenses
      { id: 'tx-8', description: 'Supermercado Compre Bem', amount: 489.50, type: 'despesa', date: d(4), categoryId: 'supermercado', paymentMethod: 'credito', creditCardId: 'card-1', status: 'pago' },
      { id: 'tx-9', description: 'Abastecimento de Combustível', amount: 120.00, type: 'despesa', date: d(14), categoryId: 'transporte', paymentMethod: 'credito', creditCardId: 'card-1', status: 'pago' },
      { id: 'tx-10', description: 'Jantar Restaurante Japonês', amount: 235.00, type: 'despesa', date: d(8), categoryId: 'alimentacao', paymentMethod: 'credito', creditCardId: 'card-1', status: 'pago' },
      { id: 'tx-11', description: 'Ingressos de Cinema & Pipoca', amount: 75.00, type: 'despesa', date: d(11), categoryId: 'lazer', paymentMethod: 'credito', creditCardId: 'card-2', status: 'pago' },
      { id: 'tx-12', description: 'Consulta Odonto Convênio', amount: 180.00, type: 'despesa', date: d(16), categoryId: 'saude', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pago' },

      // Planned
      { id: 'tx-13', description: 'Assinatura Spotify & Netflix', amount: 79.80, type: 'despesa', date: d(28), categoryId: 'lazer', paymentMethod: 'credito', creditCardId: 'card-1', status: 'pendente' },
      { id: 'tx-14', description: 'Extra Planejado Freelance Web', amount: 1200.00, type: 'receita', date: d(29), categoryId: 'freelancer', paymentMethod: 'debito', bankAccountId: 'acc-1', status: 'pendente' }
    ];

    return {
      accounts: initialAccounts,
      cards: initialCards,
      loans: initialLoans,
      transactions: initialTransactions
    };
  }

  static clearAll(): void {
    localStorage.removeItem(this.KEY_LOGGED);
    localStorage.removeItem(this.KEY_ACCOUNTS);
    localStorage.removeItem(this.KEY_CARDS);
    localStorage.removeItem(this.KEY_LOANS);
    localStorage.removeItem(this.KEY_TRANSACTIONS);
    localStorage.removeItem(this.KEY_GOAL);
    localStorage.removeItem(this.KEY_BUDGETS);
    localStorage.removeItem(this.KEY_PROFILE);
  }
}
