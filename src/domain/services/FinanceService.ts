/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Transaction,
  BankAccount,
  CreditCard,
  Loan,
  MonthlyTotals,
  CategoryDistribution
} from '../../types';

export class FinanceService {
  /**
   * Calculates the current balance for each bank account.
   * Account Balance = Initial Balance + (Sum of PAID Incomes linked to this account)
   *                  - (Sum of PAID Expenses linked to this account on Debit/Other/Cash)
   */
  static calculateAccountBalances(
    accounts: BankAccount[],
    transactions: Transaction[]
  ): Record<string, number> {
    const balances: Record<string, number> = {};

    accounts.forEach(acc => {
      balances[acc.id] = acc.initialBalance;
    });

    transactions.forEach(tx => {
      if (tx.status !== 'pago') return;

      if (tx.type === 'receita' && tx.bankAccountId && balances[tx.bankAccountId] !== undefined) {
        balances[tx.bankAccountId] += tx.amount;
      } else if (tx.type === 'despesa') {
        // Only deduct from a bank account if paid by debit or cash/other linked to this account
        if (tx.paymentMethod !== 'credito' && tx.bankAccountId && balances[tx.bankAccountId] !== undefined) {
          balances[tx.bankAccountId] -= tx.amount;
        }
      }
    });

    return balances;
  }

  /**
   * Calculates the current dynamic limit usage / current outstanding statements per credit card.
   * Outstanding debt = Sum of all despesa transactions paid via 'credito' for this specific card,
   *                      excluding those that have been paid off (or just total active card expenses).
   */
  static calculateCreditCardUsages(
    cards: CreditCard[],
    transactions: Transaction[]
  ): Record<string, number> {
    const cardDebts: Record<string, number> = {};

    cards.forEach(card => {
      cardDebts[card.id] = 0;
    });

    transactions.forEach(tx => {
      if (tx.type === 'despesa' && tx.paymentMethod === 'credito' && tx.creditCardId && cardDebts[tx.creditCardId] !== undefined) {
        // For credit cards, pending and paid both consume limit, but they represent card charges
        cardDebts[tx.creditCardId] += tx.amount;
      }
    });

    return cardDebts;
  }

  /**
   * Calculates current remaining principal balance for each loan.
   * Outstanding Loan = Total Amount - (Sum of transactions paid towards this loan)
   */
  static calculateLoanBalances(
    loans: Loan[],
    transactions: Transaction[]
  ): Record<string, number> {
    const loanBal: Record<string, number> = {};

    loans.forEach(loan => {
      // Base calculated as outstanding based on installment count paid officially in model
      // plus dynamic payments logged in transactions to prevent discrepancies
      const linkedPaidAmount = transactions
        .filter(tx => tx.type === 'despesa' && tx.loanId === loan.id && tx.status === 'pago')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // We calculate outstanding balance: total amount - what has been dynamically paid
      // Or we can base it on number of installmentsPaid * installment value if transaction logs don't exist
      const computedOwed = Math.max(0, loan.totalAmount - (loan.installmentsPaid * loan.monthlyPayment));
      loanBal[loan.id] = computedOwed;
    });

    return loanBal;
  }

  /**
   * Calculates the summary finances for a particular month (YYYY-MM).
   */
  static calculateMonthlyTotals(
    transactions: Transaction[],
    loans: Loan[],
    selectedMonth: string
  ): MonthlyTotals {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth));

    const incomesPaid = monthTx
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesPaid = monthTx
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomesPending = monthTx
      .filter(t => t.type === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesPending = monthTx
      .filter(t => t.type === 'despesa' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0);

    const cardExpensesPaid = monthTx
      .filter(t => t.type === 'despesa' && t.paymentMethod === 'credito' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    const cardExpensesPending = monthTx
      .filter(t => t.type === 'despesa' && t.paymentMethod === 'credito' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0);

    // Sum overall outstanding of active loans
    const loanOwedTotal = loans.reduce((sum, l) => {
      const computedOwed = Math.max(0, l.totalAmount - (l.installmentsPaid * l.monthlyPayment));
      return sum + computedOwed;
    }, 0);

    return {
      incomesPaid,
      expensesPaid,
      incomesPending,
      expensesPending,
      cardExpensesPaid,
      cardExpensesPending,
      loanOwedTotal,
      savings: incomesPaid - expensesPaid
    };
  }

  /**
   * Groups paid expenses by category for a specific month.
   */
  static groupExpensesByCategory(
    transactions: Transaction[],
    selectedMonth: string
  ): CategoryDistribution[] {
    const monthExpenses = transactions.filter(
      t => t.date.startsWith(selectedMonth) && t.type === 'despesa' && t.status === 'pago'
    );
    const totalExpenses = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

    const grouped = monthExpenses.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([categoryId, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return {
          categoryId,
          amount,
          percentage
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Generates calendar month ranges dynamically from transactions list, sorted descending.
   */
  static getAvailableMonths(transactions: Transaction[]): string[] {
    const defaultMonth = new Date().toISOString().substring(0, 7);
    const months = transactions.map(t => t.date.substring(0, 7));
    months.push(defaultMonth);

    const uniqueMonths = Array.from(new Set(months));
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }
}
