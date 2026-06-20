/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { FinanceService } from '../domain/services/FinanceService';
import { Transaction, BankAccount, CreditCard, Loan } from '../types';

describe('FinanceService Domain Service', () => {
  const mockAccounts: BankAccount[] = [
    { id: 'acc-1', name: 'Nubank', bankName: 'Nubank', type: 'corrente', initialBalance: 1000.00, color: '#000000' }
  ];

  const mockCards: CreditCard[] = [
    { id: 'card-1', name: 'Mastercard', bankName: 'Nubank', limit: 5000.00, closingDay: 10, dueDay: 17, color: '#000000' }
  ];

  const mockLoans: Loan[] = [
    { id: 'loan-1', name: 'Carro', lender: 'Banco', totalAmount: 20000, installmentsTotal: 20, installmentsPaid: 5, monthlyPayment: 1000, bankAccountId: 'acc-1', startDate: '2026-01-01' }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Salário',
      amount: 4000.00,
      type: 'receita',
      categoryId: 'salario',
      date: '2026-06-01',
      paymentMethod: 'debito',
      bankAccountId: 'acc-1',
      status: 'pago'
    },
    {
      id: '2',
      description: 'Aluguel',
      amount: 1200.00,
      type: 'despesa',
      categoryId: 'moradia',
      date: '2026-06-02',
      paymentMethod: 'debito',
      bankAccountId: 'acc-1',
      status: 'pago'
    },
    {
      id: '3',
      description: 'Supermercado',
      amount: 400.00,
      type: 'despesa',
      categoryId: 'supermercado',
      date: '2026-06-05',
      paymentMethod: 'credito',
      creditCardId: 'card-1',
      status: 'pago'
    }
  ];

  it('correctly calculates the dynamic balance of bank accounts', () => {
    // Initial (1000) + Salário (4000) - Aluguel (1200) = 3800
    // Supermercado (400) is on Credit Card, so it does not affect bank account balance directly
    const balances = FinanceService.calculateAccountBalances(mockAccounts, mockTransactions);
    expect(balances['acc-1']).toBe(3800);
  });

  it('correctly calculates monthly totals for a specific month', () => {
    // For June 2026 (2026-06)
    const totals = FinanceService.calculateMonthlyTotals(mockTransactions, mockLoans, '2026-06');
    expect(totals.incomesPaid).toBe(4000);
    // Paid expenses = Aluguel (1200) + Supermercado (400) = 1600
    expect(totals.expensesPaid).toBe(1600);
    expect(totals.savings).toBe(2400);
  });

  it('correctly calculates category distribution and percentage for a month', () => {
    const juneExpenses = FinanceService.groupExpensesByCategory(mockTransactions, '2026-06');
    // Total paid expenses in june = 1600.
    // moradia (Aluguel) = 1200 / 1600 = 75%
    // supermercado (Supermercado) = 400 / 1605 = 25%
    expect(juneExpenses.length).toBe(2);
    expect(juneExpenses[0].categoryId).toBe('moradia');
    expect(juneExpenses[0].amount).toBe(1200);
    expect(juneExpenses[0].percentage).toBe(75);

    expect(juneExpenses[1].categoryId).toBe('supermercado');
    expect(juneExpenses[1].amount).toBe(400);
    expect(juneExpenses[1].percentage).toBe(25);
  });
});
