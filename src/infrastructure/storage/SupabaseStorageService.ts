/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../lib/supabase';
import { BankAccount, CreditCard, Loan, Transaction, MonthlyGoal, CategoryBudget, UserProfile } from '../../types';

export class SupabaseStorageService {
  // Check if a table error means the table doesn't exist
  private static isTableMissingError(error: any): boolean {
    if (!error) return false;
    const msg = error.message || '';
    return (
      msg.includes('relation') && 
      (msg.includes('does not exist') || msg.includes('não existe'))
    );
  }

  // General helper to fetch all user data from Supabase
  static async fetchAllUserData(userId: string) {
    try {
      // Execute all fetch requests in parallel for speed
      const [
        accountsRes,
        cardsRes,
        loansRes,
        transactionsRes,
        goalsRes,
        budgetsRes,
        profileRes
      ] = await Promise.all([
        supabase.from('bank_accounts').select('*').eq('user_id', userId),
        supabase.from('credit_cards').select('*').eq('user_id', userId),
        supabase.from('loans').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('monthly_goals').select('*').eq('user_id', userId),
        supabase.from('category_budgets').select('*').eq('user_id', userId),
        supabase.from('user_profiles').select('*').eq('id', userId).single()
      ]);

      // Check if any critical table is missing (relation does not exist)
      // This is a clear indicator that the SQL schema hasn't been set up in Supabase yet.
      const tablesMissing = [
        accountsRes.error,
        cardsRes.error,
        loansRes.error,
        transactionsRes.error,
        goalsRes.error,
        budgetsRes.error,
        profileRes.error
      ].some(err => this.isTableMissingError(err));

      if (tablesMissing) {
        throw new Error('SCHEMA_NOT_FOUND');
      }

      // Format response
      const accounts: BankAccount[] = (accountsRes.data || []).map(row => ({
        id: row.id,
        name: row.name,
        bankName: row.bankName,
        type: row.type,
        initialBalance: Number(row.initialBalance),
        color: row.color
      }));

      const creditCards: CreditCard[] = (cardsRes.data || []).map(row => ({
        id: row.id,
        name: row.name,
        bankName: row.bankName,
        limit: Number(row.limit),
        closingDay: Number(row.closingDay),
        dueDay: Number(row.dueDay),
        color: row.color
      }));

      const loans: Loan[] = (loansRes.data || []).map(row => ({
        id: row.id,
        name: row.name,
        lender: row.lender,
        totalAmount: Number(row.totalAmount),
        interestRate: row.interestRate ? Number(row.interestRate) : undefined,
        startDate: row.startDate,
        installmentsTotal: Number(row.installmentsTotal),
        installmentsPaid: Number(row.installmentsPaid),
        monthlyPayment: Number(row.monthlyPayment),
        bankAccountId: row.bankAccountId,
        notes: row.notes || undefined
      }));

      const transactions: Transaction[] = (transactionsRes.data || []).map(row => ({
        id: row.id,
        description: row.description,
        amount: Number(row.amount),
        type: row.type as any,
        date: row.date,
        categoryId: row.categoryId,
        paymentMethod: row.paymentMethod as any,
        bankAccountId: row.bankAccountId || undefined,
        creditCardId: row.creditCardId || undefined,
        loanId: row.loanId || undefined,
        status: row.status as any,
        notes: row.notes || undefined,
        isInstallmentPayment: row.isInstallmentPayment || undefined
      }));

      const goals: MonthlyGoal[] = (goalsRes.data || []).map(row => ({
        month: row.month,
        targetAmount: Number(row.targetAmount),
        incomeTarget: row.incomeTarget ? Number(row.incomeTarget) : undefined
      }));

      const budgets: CategoryBudget[] = (budgetsRes.data || []).map(row => ({
        categoryId: row.categoryId,
        limitAmount: Number(row.limitAmount)
      }));

      const profile: UserProfile | null = profileRes.data ? {
        name: profileRes.data.name,
        currency: profileRes.data.currency
      } : null;

      return {
        success: true,
        data: {
          accounts,
          creditCards,
          loans,
          transactions,
          goals,
          budgets,
          profile
        }
      };
    } catch (error: any) {
      console.warn('Error fetching all user data from Supabase:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  // Save multiple items (batch sync during initial setup or backup)
  static async syncAllToSupabase(userId: string, data: {
    accounts: BankAccount[];
    creditCards: CreditCard[];
    loans: Loan[];
    transactions: Transaction[];
    goal: MonthlyGoal;
    budgets: CategoryBudget[];
    profile: UserProfile;
  }) {
    try {
      const promises: any[] = [];

      // 1. Profile
      promises.push(
        supabase.from('user_profiles').upsert({
          id: userId,
          name: data.profile.name,
          currency: data.profile.currency
        })
      );

      // 2. Bank accounts
      if (data.accounts.length > 0) {
        promises.push(
          supabase.from('bank_accounts').upsert(
            data.accounts.map(acc => ({
              id: acc.id,
              user_id: userId,
              name: acc.name,
              bankName: acc.bankName,
              type: acc.type,
              initialBalance: acc.initialBalance,
              color: acc.color
            }))
          )
        );
      }

      // 3. Credit cards
      if (data.creditCards.length > 0) {
        promises.push(
          supabase.from('credit_cards').upsert(
            data.creditCards.map(card => ({
              id: card.id,
              user_id: userId,
              name: card.name,
              bankName: card.bankName,
              limit: card.limit,
              closingDay: card.closingDay,
              dueDay: card.dueDay,
              color: card.color
            }))
          )
        );
      }

      // 4. Loans
      if (data.loans.length > 0) {
        promises.push(
          supabase.from('loans').upsert(
            data.loans.map(loan => ({
              id: loan.id,
              user_id: userId,
              name: loan.name,
              lender: loan.lender,
              totalAmount: loan.totalAmount,
              interestRate: loan.interestRate,
              startDate: loan.startDate,
              installmentsTotal: loan.installmentsTotal,
              installmentsPaid: loan.installmentsPaid,
              monthlyPayment: loan.monthlyPayment,
              bankAccountId: loan.bankAccountId,
              notes: loan.notes
            }))
          )
        );
      }

      // 5. Transactions
      if (data.transactions.length > 0) {
        promises.push(
          supabase.from('transactions').upsert(
            data.transactions.map(tx => ({
              id: tx.id,
              user_id: userId,
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              date: tx.date,
              categoryId: tx.categoryId,
              paymentMethod: tx.paymentMethod,
              bankAccountId: tx.bankAccountId,
              creditCardId: tx.creditCardId,
              loanId: tx.loanId,
              status: tx.status,
              notes: tx.notes,
              isInstallmentPayment: tx.isInstallmentPayment
            }))
          )
        );
      }

      // 6. Goal
      promises.push(
        supabase.from('monthly_goals').upsert({
          id: `${userId}_${data.goal.month}`,
          user_id: userId,
          month: data.goal.month,
          targetAmount: data.goal.targetAmount,
          incomeTarget: data.goal.incomeTarget
        })
      );

      // 7. Budgets
      if (data.budgets.length > 0) {
        promises.push(
          supabase.from('category_budgets').upsert(
            data.budgets.map(b => ({
              id: `${userId}_${b.categoryId}`,
              user_id: userId,
              categoryId: b.categoryId,
              limitAmount: b.limitAmount
            }))
          )
        );
      }

      const results = await Promise.all(promises);
      const errorResult = results.find(res => res.error);
      if (errorResult) {
        throw errorResult.error;
      }

      return { success: true };
    } catch (error: any) {
      console.warn('Error syncing data to Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  // BANK ACCOUNT CRUD
  static async saveBankAccount(userId: string, account: BankAccount) {
    try {
      const { error } = await supabase.from('bank_accounts').upsert({
        id: account.id,
        user_id: userId,
        name: account.name,
        bankName: account.bankName,
        type: account.type,
        initialBalance: account.initialBalance,
        color: account.color
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  static async deleteBankAccount(userId: string, accountId: string) {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // CREDIT CARD CRUD
  static async saveCreditCard(userId: string, card: CreditCard) {
    try {
      const { error } = await supabase.from('credit_cards').upsert({
        id: card.id,
        user_id: userId,
        name: card.name,
        bankName: card.bankName,
        limit: card.limit,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        color: card.color
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  static async deleteCreditCard(userId: string, cardId: string) {
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // LOAN CRUD
  static async saveLoan(userId: string, loan: Loan) {
    try {
      const { error } = await supabase.from('loans').upsert({
        id: loan.id,
        user_id: userId,
        name: loan.name,
        lender: loan.lender,
        totalAmount: loan.totalAmount,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        installmentsTotal: loan.installmentsTotal,
        installmentsPaid: loan.installmentsPaid,
        monthlyPayment: loan.monthlyPayment,
        bankAccountId: loan.bankAccountId,
        notes: loan.notes
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  static async deleteLoan(userId: string, loanId: string) {
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // TRANSACTION CRUD
  static async saveTransaction(userId: string, tx: Transaction) {
    try {
      const { error } = await supabase.from('transactions').upsert({
        id: tx.id,
        user_id: userId,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        categoryId: tx.categoryId,
        paymentMethod: tx.paymentMethod,
        bankAccountId: tx.bankAccountId || null,
        creditCardId: tx.creditCardId || null,
        loanId: tx.loanId || null,
        status: tx.status,
        notes: tx.notes || null,
        isInstallmentPayment: tx.isInstallmentPayment || null
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  static async deleteTransaction(userId: string, transactionId: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // GOAL CRUD
  static async saveGoal(userId: string, goal: MonthlyGoal) {
    try {
      const { error } = await supabase.from('monthly_goals').upsert({
        id: `${userId}_${goal.month}`,
        user_id: userId,
        month: goal.month,
        targetAmount: goal.targetAmount,
        incomeTarget: goal.incomeTarget
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // BUDGETS CRUD
  static async saveBudgets(userId: string, budgets: CategoryBudget[]) {
    try {
      if (budgets.length === 0) return { success: true };
      const { error } = await supabase.from('category_budgets').upsert(
        budgets.map(b => ({
          id: `${userId}_${b.categoryId}`,
          user_id: userId,
          categoryId: b.categoryId,
          limitAmount: b.limitAmount
        }))
      );
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }

  // PROFILE CRUD
  static async saveProfile(userId: string, profile: UserProfile) {
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: userId,
        name: profile.name,
        currency: profile.currency
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Supabase error:', e);
      return { success: false, error: e.message };
    }
  }
}
