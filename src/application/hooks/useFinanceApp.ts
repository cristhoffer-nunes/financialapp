/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  BankAccount,
  CreditCard,
  Loan,
  Transaction,
  MonthlyGoal,
  CategoryBudget,
  UserProfile
} from '../../types';
import { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import { DEFAULT_GOAL, DEFAULT_BUDGETS } from '../../domain/entities/MonthlyGoal';

export function useFinanceApp() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return LocalStorageService.getIsLoggedIn();
  });

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Default to current YYYY-MM
  });

  const [goal, setGoal] = useState<MonthlyGoal>(DEFAULT_GOAL);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(DEFAULT_BUDGETS);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Marcelo Silva', currency: 'BRL' });

  // Load state from local storage initially (or populate seeds)
  useEffect(() => {
    try {
      const storedAccounts = LocalStorageService.getAccounts();
      const storedCards = LocalStorageService.getCreditCards();
      const storedLoans = LocalStorageService.getLoans();
      const storedTx = LocalStorageService.getTransactions();
      const storedGoal = LocalStorageService.getGoal();
      const storedBudgets = LocalStorageService.getBudgets();
      const storedProfile = LocalStorageService.getProfile();

      if (storedAccounts && storedCards && storedLoans && storedTx) {
        setAccounts(storedAccounts);
        setCreditCards(storedCards);
        setLoans(storedLoans);
        setTransactions(storedTx);
      } else {
        // Hydrate from Seed Data
        const seeds = LocalStorageService.getInitialSeedData();
        setAccounts(seeds.accounts);
        setCreditCards(seeds.cards);
        setLoans(seeds.loans);
        setTransactions(seeds.transactions);

        LocalStorageService.saveAccounts(seeds.accounts);
        LocalStorageService.saveCreditCards(seeds.cards);
        LocalStorageService.saveLoans(seeds.loans);
        LocalStorageService.saveTransactions(seeds.transactions);
      }

      if (storedGoal) setGoal(storedGoal);
      else LocalStorageService.saveGoal(DEFAULT_GOAL);

      if (storedBudgets) setBudgets(storedBudgets);
      else LocalStorageService.saveBudgets(DEFAULT_BUDGETS);

      if (storedProfile) {
        setProfile(storedProfile);
      } else {
        const defaultProfile = { name: 'Marcelo Silva', currency: 'BRL' };
        setProfile(defaultProfile);
        LocalStorageService.saveProfile(defaultProfile);
      }
    } catch (e) {
      console.error('Failed to restore financial state', e);
    }
  }, []);

  // Save state on any mutations
  const saveAllState = (
    updatedAccs: BankAccount[],
    updatedCards: CreditCard[],
    updatedLoans: Loan[],
    updatedTxs: Transaction[]
  ) => {
    setAccounts(updatedAccs);
    setCreditCards(updatedCards);
    setLoans(updatedLoans);
    setTransactions(updatedTxs);

    LocalStorageService.saveAccounts(updatedAccs);
    LocalStorageService.saveCreditCards(updatedCards);
    LocalStorageService.saveLoans(updatedLoans);
    LocalStorageService.saveTransactions(updatedTxs);
  };

  // --- CONTAS BANCÁRIAS (BANK ACCOUNTS) CRUD ---
  const handleSaveAccount = (account: BankAccount) => {
    const exists = accounts.find(a => a.id === account.id);
    let updated: BankAccount[];
    if (exists) {
      updated = accounts.map(a => (a.id === account.id ? account : a));
    } else {
      updated = [...accounts, account];
    }
    saveAllState(updated, creditCards, loans, transactions);
  };

  const handleDeleteAccount = (accountId: string) => {
    const updatedAccs = accounts.filter(a => a.id !== accountId);
    // Unlink bank accounts from transactions
    const updatedTxs = transactions.map(t => {
      if (t.bankAccountId === accountId) {
        return { ...t, bankAccountId: undefined };
      }
      return t;
    });
    // Unlink from active loans
    const updatedLoans = loans.map(l => {
      if (l.bankAccountId === accountId && updatedAccs.length > 0) {
        return { ...l, bankAccountId: updatedAccs[0].id };
      }
      return l;
    });

    saveAllState(updatedAccs, creditCards, updatedLoans, updatedTxs);
  };

  // --- CARTÕES DE CRÉDITO (CREDIT CARDS) CRUD ---
  const handleSaveCreditCard = (card: CreditCard) => {
    const exists = creditCards.find(c => c.id === card.id);
    let updated: CreditCard[];
    if (exists) {
      updated = creditCards.map(c => (c.id === card.id ? card : c));
    } else {
      updated = [...creditCards, card];
    }
    saveAllState(accounts, updated, loans, transactions);
  };

  const handleDeleteCreditCard = (cardId: string) => {
    const updatedCards = creditCards.filter(c => c.id !== cardId);
    // Unlink card and reset transactions paymentMethod or remove card reference
    const updatedTxs = transactions.filter(t => t.creditCardId !== cardId);

    saveAllState(accounts, updatedCards, loans, updatedTxs);
  };

  const handlePayCardStatement = (cardId: string, bankAccountId: string, amount: number) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;

    // Create custom expense transaction that pays off this credit card statement
    const payTx: Transaction = {
      id: `statement-pay-${Date.now()}`,
      description: `Pagamento Fatura: ${card.name}`,
      amount: amount,
      type: 'despesa',
      date: new Date().toISOString().substring(0, 10),
      categoryId: 'cartao_pagamento',
      paymentMethod: 'debito',
      bankAccountId: bankAccountId,
      status: 'pago',
      notes: `Quitação total/parcial da fatura do cartão ${card.name}`
    };

    // Keep the credit card transactions but we can delete or mark them in some other system if needed.
    // In this premium flow, we add the pay statement transaction so it reduces the bank account balance correctly.
    // Also, we can optionally clear out the card's unpaid transactions for a fresh cycle!
    // Let's clear matching card expenses or keep them as archive but log the payment. Let's keep them and log the payment.
    const updatedTxs = [payTx, ...transactions];
    saveAllState(accounts, creditCards, loans, updatedTxs);
  };

  // --- EMPRÉSTIMOS (LOANS) CRUD ---
  const handleSaveLoan = (loan: Loan) => {
    const exists = loans.find(l => l.id === loan.id);
    let updatedLoans: Loan[];
    if (exists) {
      updatedLoans = loans.map(l => (l.id === loan.id ? loan : l));
    } else {
      updatedLoans = [...loans, loan];
      // When a loan is initialized, we optionally add a paid income transaction representing the funding received in bankAccountId!
      const fundingTx: Transaction = {
        id: `loan-fund-${Date.now()}`,
        description: `Entrada Crédito: ${loan.name}`,
        amount: loan.totalAmount,
        type: 'receita',
        date: loan.startDate,
        categoryId: 'investimentos', // or outers
        paymentMethod: 'debito',
        bankAccountId: loan.bankAccountId,
        status: 'pago',
        notes: `Valor depositado referente a empréstimo com ${loan.lender}`
      };
      const updatedTxs = [fundingTx, ...transactions];
      saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
      return;
    }
    saveAllState(accounts, creditCards, updatedLoans, transactions);
  };

  const updatedUniqLoans = (updated: Loan[]) => updated;

  const handleDeleteLoan = (loanId: string) => {
    const updatedLoans = loans.filter(l => l.id !== loanId);
    // Unlink transaction references
    const updatedTxs = transactions.filter(t => t.loanId !== loanId);
    saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
  };

  const handlePayLoanInstallment = (loanId: string, bankAccountId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    if (loan.installmentsPaid >= loan.installmentsTotal) return;

    const nextPaidCount = loan.installmentsPaid + 1;
    const updatedLoan: Loan = {
      ...loan,
      installmentsPaid: nextPaidCount
    };

    // Create payment transaction
    const payTx: Transaction = {
      id: `loan-pay-${Date.now()}`,
      description: `Parcela ${nextPaidCount}/${loan.installmentsTotal}: ${loan.name}`,
      amount: loan.monthlyPayment,
      type: 'despesa',
      date: new Date().toISOString().substring(0, 10),
      categoryId: 'emprestimo_pagamento',
      paymentMethod: 'debito',
      bankAccountId: bankAccountId,
      loanId: loanId,
      status: 'pago',
      notes: `Abatimento de parcela de empréstimo com ${loan.lender}`,
      isInstallmentPayment: true
    };

    const updatedLoans = loans.map(l => (l.id === loanId ? updatedLoan : l));
    const updatedTxs = [payTx, ...transactions];

    saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
  };

  // --- TRANSAÇÕES (TRANSACTIONS) CRUD ---
  const handleSaveTransaction = (tx: Transaction) => {
    const exists = transactions.find(t => t.id === tx.id);
    let updatedTxs: Transaction[];
    if (exists) {
      updatedTxs = transactions.map(t => (t.id === tx.id ? tx : t));
    } else {
      updatedTxs = [tx, ...transactions];
    }
    saveAllState(accounts, creditCards, loans, updatedTxs);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    let updatedLoans = [...loans];
    // If we're deleting an installment payment, we rollback the installment count!
    if (tx.isInstallmentPayment && tx.loanId) {
      updatedLoans = loans.map(l => {
        if (l.id === tx.loanId) {
          return {
            ...l,
            installmentsPaid: Math.max(0, l.installmentsPaid - 1)
          };
        }
        return l;
      });
    }

    const updatedTxs = transactions.filter(t => t.id !== id);
    saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
  };

  // Switch status (e.g. Confirm Payment)
  const handleTogglePaymentStatus = (id: string) => {
    const updatedTxs = transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'pago' ? ('pendente' as const) : ('pago' as const)
        };
      }
      return t;
    });
    saveAllState(accounts, creditCards, loans, updatedTxs);
  };

  // Shifting date of transactions (reprogrammed transactions)
  const handleReprogramTransactionDate = (id: string, newDate: string) => {
    const updatedTxs = transactions.map(t => {
      if (t.id === id) {
        return { ...t, date: newDate };
      }
      return t;
    });
    saveAllState(accounts, creditCards, loans, updatedTxs);
  };

  // --- SETTINGS AND PROFILE ---
  const handleUpdateGoal = (updatedGoal: MonthlyGoal) => {
    setGoal(updatedGoal);
    LocalStorageService.saveGoal(updatedGoal);
  };

  const handleUpdateBudgets = (updatedBudgets: CategoryBudget[]) => {
    setBudgets(updatedBudgets);
    LocalStorageService.saveBudgets(updatedBudgets);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    LocalStorageService.saveProfile(updatedProfile);
  };

  const handleResetAllData = () => {
    LocalStorageService.clearAll();
    const seeds = LocalStorageService.getInitialSeedData();
    setAccounts(seeds.accounts);
    setCreditCards(seeds.cards);
    setLoans(seeds.loans);
    setTransactions(seeds.transactions);
    setGoal(DEFAULT_GOAL);
    setBudgets(DEFAULT_BUDGETS);
    setProfile({ name: 'Marcelo Silva', currency: 'BRL' });

    LocalStorageService.saveAccounts(seeds.accounts);
    LocalStorageService.saveCreditCards(seeds.cards);
    LocalStorageService.saveLoans(seeds.loans);
    LocalStorageService.saveTransactions(seeds.transactions);
    LocalStorageService.saveGoal(DEFAULT_GOAL);
    LocalStorageService.saveBudgets(DEFAULT_BUDGETS);
    LocalStorageService.saveProfile({ name: 'Marcelo Silva', currency: 'BRL' });
  };

  const handleLoginSuccess = (name: string) => {
    setIsLoggedIn(true);
    LocalStorageService.setIsLoggedIn(true);
    const updatedProfile = { name: name || 'Usuário Organizado', currency: 'BRL' };
    setProfile(updatedProfile);
    LocalStorageService.saveProfile(updatedProfile);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    LocalStorageService.setIsLoggedIn(false);
  };

  return {
    isLoggedIn,
    accounts,
    creditCards,
    loans,
    transactions,
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    goal,
    budgets,
    profile,

    // CRUD Hooks
    handleSaveAccount,
    handleDeleteAccount,
    handleSaveCreditCard,
    handleDeleteCreditCard,
    handlePayCardStatement,
    handleSaveLoan,
    handleDeleteLoan,
    handlePayLoanInstallment,
    handleSaveTransaction,
    handleDeleteTransaction,
    handleTogglePaymentStatus,
    handleReprogramTransactionDate,

    // Profile & Goal Actions
    handleUpdateGoal,
    handleUpdateBudgets,
    handleUpdateProfile,
    handleResetAllData,
    handleLoginSuccess,
    handleLogout
  };
}
