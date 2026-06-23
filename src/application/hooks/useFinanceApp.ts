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
import { supabase } from '../../lib/supabase';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';

export function useFinanceApp() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return LocalStorageService.getIsLoggedIn();
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

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

  // 1. Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoggedIn(true);
        LocalStorageService.setIsLoggedIn(true);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        LocalStorageService.setIsLoggedIn(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoggedIn(true);
        LocalStorageService.setIsLoggedIn(true);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        LocalStorageService.setIsLoggedIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Load data from Supabase when user ID is available
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setIsSyncing(true);
      setDbError(null);
      const res = await SupabaseStorageService.fetchAllUserData(userId);
      if (res.success && res.data) {
        const { accounts: dbAccs, creditCards: dbCards, loans: dbLoans, transactions: dbTxs, goals: dbGoals, budgets: dbBudgets, profile: dbProfile } = res.data;

        // If there is data in Supabase, let's restore it
        if (dbAccs.length > 0 || dbCards.length > 0 || dbLoans.length > 0 || dbTxs.length > 0) {
          setAccounts(dbAccs);
          setCreditCards(dbCards);
          setLoans(dbLoans);
          setTransactions(dbTxs);
          
          if (dbGoals.length > 0) {
            const monthGoal = dbGoals.find(g => g.month === selectedMonth) || dbGoals[0];
            setGoal(monthGoal);
          }
          if (dbBudgets.length > 0) {
            setBudgets(dbBudgets);
          }
          if (dbProfile) {
            setProfile(dbProfile);
          }

          // Save to local storage for caching/offline fallback
          LocalStorageService.saveAccounts(dbAccs);
          LocalStorageService.saveCreditCards(dbCards);
          LocalStorageService.saveLoans(dbLoans);
          LocalStorageService.saveTransactions(dbTxs);
          if (dbGoals.length > 0) {
            const monthGoal = dbGoals.find(g => g.month === selectedMonth) || dbGoals[0];
            LocalStorageService.saveGoal(monthGoal);
          }
          if (dbBudgets.length > 0) {
            LocalStorageService.saveBudgets(dbBudgets);
          }
          if (dbProfile) {
            LocalStorageService.saveProfile(dbProfile);
          }
        } else {
          // If Supabase has no data yet (new user!), let's sync local data or seed data up to Supabase!
          const currentAccounts = LocalStorageService.getAccounts() || [];
          const currentCards = LocalStorageService.getCreditCards() || [];
          const currentLoans = LocalStorageService.getLoans() || [];
          const currentTxs = LocalStorageService.getTransactions() || [];
          const currentGoal = LocalStorageService.getGoal() || DEFAULT_GOAL;
          const currentBudgets = LocalStorageService.getBudgets() || DEFAULT_BUDGETS;
          const currentProfile = LocalStorageService.getProfile() || { name: profile.name, currency: 'BRL' };

          let finalAccs = currentAccounts;
          let finalCards = currentCards;
          let finalLoans = currentLoans;
          let finalTxs = currentTxs;

          if (finalAccs.length === 0 && finalCards.length === 0 && finalLoans.length === 0 && finalTxs.length === 0) {
            // Use seeds
            const seeds = LocalStorageService.getInitialSeedData();
            finalAccs = seeds.accounts;
            finalCards = seeds.cards;
            finalLoans = seeds.loans;
            finalTxs = seeds.transactions;

            setAccounts(finalAccs);
            setCreditCards(finalCards);
            setLoans(finalLoans);
            setTransactions(finalTxs);

            LocalStorageService.saveAccounts(finalAccs);
            LocalStorageService.saveCreditCards(finalCards);
            LocalStorageService.saveLoans(finalLoans);
            LocalStorageService.saveTransactions(finalTxs);
          }

          // Upload to Supabase!
          const syncRes = await SupabaseStorageService.syncAllToSupabase(userId, {
            accounts: finalAccs,
            creditCards: finalCards,
            loans: finalLoans,
            transactions: finalTxs,
            goal: currentGoal,
            budgets: currentBudgets,
            profile: currentProfile
          });

          if (!syncRes.success) {
            if (syncRes.error === 'SCHEMA_NOT_FOUND') {
              setDbError('SCHEMA_NOT_FOUND');
            } else {
              setDbError(syncRes.error || 'Erro ao sincronizar dados com o banco.');
            }
          }
        }
      } else {
        if (res.error === 'SCHEMA_NOT_FOUND') {
          setDbError('SCHEMA_NOT_FOUND');
        } else {
          setDbError(res.error || 'Erro ao obter dados do Supabase.');
        }
      }
      setIsSyncing(false);
    };

    loadData();
  }, [userId]);

  // Load state from local storage initially (or populate seeds) for non-authenticated guests
  useEffect(() => {
    if (userId) return; // Supabase listener handles this if logged in

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
  }, [userId]);

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
    if (userId) {
      SupabaseStorageService.saveBankAccount(userId, account);
    }
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
    if (userId) {
      SupabaseStorageService.deleteBankAccount(userId, accountId);
      // Update affected transactions and loans in Supabase
      updatedTxs.forEach(t => {
        if (t.bankAccountId === undefined) {
          SupabaseStorageService.saveTransaction(userId, t);
        }
      });
      updatedLoans.forEach(l => {
        if (l.bankAccountId !== loans.find(x => x.id === l.id)?.bankAccountId) {
          SupabaseStorageService.saveLoan(userId, l);
        }
      });
    }
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
    if (userId) {
      SupabaseStorageService.saveCreditCard(userId, card);
    }
  };

  const handleDeleteCreditCard = (cardId: string) => {
    const updatedCards = creditCards.filter(c => c.id !== cardId);
    // Unlink card and reset transactions paymentMethod or remove card reference
    const updatedTxs = transactions.filter(t => t.creditCardId !== cardId);

    saveAllState(accounts, updatedCards, loans, updatedTxs);
    if (userId) {
      SupabaseStorageService.deleteCreditCard(userId, cardId);
      // Since transactions linked to this card are deleted, let's delete them in Supabase
      const deletedTxs = transactions.filter(t => t.creditCardId === cardId);
      deletedTxs.forEach(t => {
        SupabaseStorageService.deleteTransaction(userId, t.id);
      });
    }
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

    const updatedTxs = [payTx, ...transactions];
    saveAllState(accounts, creditCards, loans, updatedTxs);
    if (userId) {
      SupabaseStorageService.saveTransaction(userId, payTx);
    }
  };

  // --- EMPRÉSTIMOS (LOANS) CRUD ---
  const handleSaveLoan = (loan: Loan) => {
    const exists = loans.find(l => l.id === loan.id);
    let updatedLoans: Loan[];
    if (exists) {
      updatedLoans = loans.map(l => (l.id === loan.id ? loan : l));
      saveAllState(accounts, creditCards, updatedLoans, transactions);
      if (userId) {
        SupabaseStorageService.saveLoan(userId, loan);
      }
    } else {
      updatedLoans = [...loans, loan];
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
      if (userId) {
        SupabaseStorageService.saveLoan(userId, loan);
        SupabaseStorageService.saveTransaction(userId, fundingTx);
      }
    }
  };

  const updatedUniqLoans = (updated: Loan[]) => updated;

  const handleDeleteLoan = (loanId: string) => {
    const updatedLoans = loans.filter(l => l.id !== loanId);
    // Unlink transaction references
    const updatedTxs = transactions.filter(t => t.loanId !== loanId);
    saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
    if (userId) {
      SupabaseStorageService.deleteLoan(userId, loanId);
      // Since transactions linked to this loan are deleted, delete them in Supabase
      const deletedTxs = transactions.filter(t => t.loanId === loanId);
      deletedTxs.forEach(t => {
        SupabaseStorageService.deleteTransaction(userId, t.id);
      });
    }
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
    if (userId) {
      SupabaseStorageService.saveLoan(userId, updatedLoan);
      SupabaseStorageService.saveTransaction(userId, payTx);
    }
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
    if (userId) {
      SupabaseStorageService.saveTransaction(userId, tx);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    let updatedLoans = [...loans];
    // If we're deleting an installment payment, we rollback the installment count!
    if (tx.isInstallmentPayment && tx.loanId) {
      updatedLoans = loans.map(l => {
        if (l.id === tx.loanId) {
          const updatedL = {
            ...l,
            installmentsPaid: Math.max(0, l.installmentsPaid - 1)
          };
          if (userId) {
            SupabaseStorageService.saveLoan(userId, updatedL);
          }
          return updatedL;
        }
        return l;
      });
    }

    const updatedTxs = transactions.filter(t => t.id !== id);
    saveAllState(accounts, creditCards, updatedLoans, updatedTxs);
    if (userId) {
      SupabaseStorageService.deleteTransaction(userId, id);
    }
  };

  // Switch status (e.g. Confirm Payment)
  const handleTogglePaymentStatus = (id: string) => {
    let updatedTx: Transaction | null = null;
    const updatedTxs = transactions.map(t => {
      if (t.id === id) {
        updatedTx = {
          ...t,
          status: t.status === 'pago' ? ('pendente' as const) : ('pago' as const)
        };
        return updatedTx;
      }
      return t;
    });
    saveAllState(accounts, creditCards, loans, updatedTxs);
    if (userId && updatedTx) {
      SupabaseStorageService.saveTransaction(userId, updatedTx);
    }
  };

  // Shifting date of transactions (reprogrammed transactions)
  const handleReprogramTransactionDate = (id: string, newDate: string) => {
    let updatedTx: Transaction | null = null;
    const updatedTxs = transactions.map(t => {
      if (t.id === id) {
        updatedTx = { ...t, date: newDate };
        return updatedTx;
      }
      return t;
    });
    saveAllState(accounts, creditCards, loans, updatedTxs);
    if (userId && updatedTx) {
      SupabaseStorageService.saveTransaction(userId, updatedTx);
    }
  };

  // --- SETTINGS AND PROFILE ---
  const handleUpdateGoal = (updatedGoal: MonthlyGoal) => {
    setGoal(updatedGoal);
    LocalStorageService.saveGoal(updatedGoal);
    if (userId) {
      SupabaseStorageService.saveGoal(userId, updatedGoal);
    }
  };

  const handleUpdateBudgets = (updatedBudgets: CategoryBudget[]) => {
    setBudgets(updatedBudgets);
    LocalStorageService.saveBudgets(updatedBudgets);
    if (userId) {
      SupabaseStorageService.saveBudgets(userId, updatedBudgets);
    }
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    LocalStorageService.saveProfile(updatedProfile);
    if (userId) {
      SupabaseStorageService.saveProfile(userId, updatedProfile);
    }
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

    if (userId) {
      SupabaseStorageService.syncAllToSupabase(userId, {
        accounts: seeds.accounts,
        creditCards: seeds.cards,
        loans: seeds.loans,
        transactions: seeds.transactions,
        goal: DEFAULT_GOAL,
        budgets: DEFAULT_BUDGETS,
        profile: { name: 'Marcelo Silva', currency: 'BRL' }
      });
    }
  };

  const handleLoginSuccess = (name: string) => {
    setIsLoggedIn(true);
    LocalStorageService.setIsLoggedIn(true);
    const updatedProfile = { name: name || 'Usuário Organizado', currency: 'BRL' };
    setProfile(updatedProfile);
    LocalStorageService.saveProfile(updatedProfile);
  };

  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      setIsLoggedIn(false);
      setUserId(null);
      LocalStorageService.setIsLoggedIn(false);
      LocalStorageService.clearAll();
      
      const seeds = LocalStorageService.getInitialSeedData();
      setAccounts(seeds.accounts);
      setCreditCards(seeds.cards);
      setLoans(seeds.loans);
      setTransactions(seeds.transactions);
      setGoal(DEFAULT_GOAL);
      setBudgets(DEFAULT_BUDGETS);
      setProfile({ name: 'Marcelo Silva', currency: 'BRL' });
    });
  };

  return {
    isLoggedIn,
    isSyncing,
    dbError,
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
