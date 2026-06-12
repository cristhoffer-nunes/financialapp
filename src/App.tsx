/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, Category, MonthlyGoal, CategoryBudget, UserProfile } from './types';
import {
  DEFAULT_CATEGORIES,
  INITIAL_TRANSACTIONS,
  DEFAULT_GOAL,
  DEFAULT_BUDGETS,
  formatCurrency,
  getAvailableMonths,
  getMonthName,
  getCategoryById
} from './utils';

import Analytics from './components/Analytics';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import GoalsPanel from './components/GoalsPanel';
import AuthScreen from './components/AuthScreen';
import { supabase } from './lib/supabase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cont_fin_id_logged') === 'true';
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goal, setGoal] = useState<MonthlyGoal>(DEFAULT_GOAL);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Visitante', currency: 'BRL' });

  // Supabase Sync States
  const [user, setUser] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<'syncing' | 'synced' | 'error_tables_missing' | 'offline' | null>('offline');
  const [showSql, setShowSql] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'goals'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load local state initially
  useEffect(() => {
    try {
      const storedTx = localStorage.getItem('cont_fin_transactions');
      const storedGoal = localStorage.getItem('cont_fin_goal');
      const storedBudgets = localStorage.getItem('cont_fin_budgets');
      const storedProfile = localStorage.getItem('cont_fin_profile');

      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem('cont_fin_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      }

      if (storedGoal) {
        setGoal(JSON.parse(storedGoal));
      } else {
        setGoal(DEFAULT_GOAL);
        localStorage.setItem('cont_fin_goal', JSON.stringify(DEFAULT_GOAL));
      }

      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        setBudgets(DEFAULT_BUDGETS);
        localStorage.setItem('cont_fin_budgets', JSON.stringify(DEFAULT_BUDGETS));
      }

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        localStorage.setItem('cont_fin_profile', JSON.stringify({ name: 'Visitante', currency: 'BRL' }));
      }
    } catch (e) {
      console.error('Error hydrating state from localStorage', e);
      setTransactions(INITIAL_TRANSACTIONS);
      setGoal(DEFAULT_GOAL);
      setBudgets(DEFAULT_BUDGETS);
    }
  }, []);

  // Set up Supabase Auth listeners & status synchronization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        const displayName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuário';
        setProfile({ name: displayName, currency: 'BRL' });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        const displayName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuário';
        setProfile({ name: displayName, currency: 'BRL' });
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data function from Supabase
  const fetchUserDataFromSupabase = async (currentUser: any) => {
    if (!currentUser) return;
    setDbStatus('syncing');
    try {
      // 1. Fetch transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (txError) throw txError;

      // 2. Fetch monthly goals
      const { data: gls, error: goalError } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', currentUser.id);

      if (goalError) throw goalError;

      // 3. Fetch budgets
      const { data: bdgts, error: budgetError } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('user_id', currentUser.id);

      if (budgetError) throw budgetError;

      // Sync React state and local cached copy
      if (txs) {
        const parsedTxs: Transaction[] = txs.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          type: t.type as 'receita' | 'despesa',
          categoryId: t.category_id,
          date: t.date,
          notes: t.notes || ''
        }));
        setTransactions(parsedTxs);
        localStorage.setItem('cont_fin_transactions', JSON.stringify(parsedTxs));
      }

      if (gls && gls.length > 0) {
        const currentGoal = gls.find((g: any) => g.month === selectedMonth) || gls[0];
        if (currentGoal) {
          const parsedGoal: MonthlyGoal = {
            month: currentGoal.month,
            targetAmount: Number(currentGoal.target_amount),
            incomeTarget: Number(currentGoal.income_target || 0)
          };
          setGoal(parsedGoal);
          localStorage.setItem('cont_fin_goal', JSON.stringify(parsedGoal));
        }
      }

      if (bdgts) {
        const parsedBudgets: CategoryBudget[] = bdgts.map((b: any) => ({
          categoryId: b.category_id,
          limitAmount: Number(b.limit_amount)
        }));
        setBudgets(parsedBudgets);
        localStorage.setItem('cont_fin_budgets', JSON.stringify(parsedBudgets));
      }

      setDbStatus('synced');
    } catch (error: any) {
      console.error('Erro ao ler do Supabase:', error);
      if (error.code === '42P01') {
        setDbStatus('error_tables_missing');
      } else {
        setDbStatus('offline');
      }
    }
  };

  // Sync when user status or selectedMonth changes
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserDataFromSupabase(user);
    } else {
      setDbStatus('offline');
    }
  }, [isLoggedIn, user, selectedMonth]);

  // Update localStorage helper
  const saveTransactionsToStorage = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('cont_fin_transactions', JSON.stringify(newTransactions));
  };

  // 1. Create or Update Transaction with Supabase syncer
  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    const isNew = !txData.id;
    const newId = txData.id || `t_${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id: newId
    };

    let updatedList: Transaction[];
    if (isNew) {
      updatedList = [newTx, ...transactions];
    } else {
      updatedList = transactions.map((t) => (t.id === txData.id ? newTx : t));
    }
    
    // Local copy updated first
    saveTransactionsToStorage(updatedList);

    // Sync cloud DB
    if (user) {
      try {
        const { error } = await supabase
          .from('transactions')
          .upsert({
            id: newId,
            user_id: user.id,
            description: newTx.description,
            amount: newTx.amount,
            type: newTx.type,
            category_id: newTx.categoryId,
            date: newTx.date,
            notes: newTx.notes || ''
          });
        if (error) throw error;
        if (dbStatus !== 'synced') setDbStatus('synced');
      } catch (err: any) {
        console.error('Erro de gravação Supabase:', err);
        if (err.code === '42P01') setDbStatus('error_tables_missing');
      }
    }

    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  // 2. Delete Transaction with Supabase syncer
  const handleDeleteTransaction = async (id: string) => {
    const filtered = transactions.filter((t) => t.id !== id);
    saveTransactionsToStorage(filtered);

    if (user) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      } catch (err: any) {
        console.error('Erro de remoção Supabase:', err);
      }
    }
  };

  // 3. Open Editing Modal
  const handleStartEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  // 4. Update Goals with Supabase syncer
  const handleUpdateGoal = async (newGoal: MonthlyGoal) => {
    setGoal(newGoal);
    localStorage.setItem('cont_fin_goal', JSON.stringify(newGoal));

    if (user) {
      try {
        const compositeId = `${user.id}_${newGoal.month}`;
        const { error } = await supabase
          .from('monthly_goals')
          .upsert({
            id: compositeId,
            user_id: user.id,
            month: newGoal.month,
            target_amount: newGoal.targetAmount,
            income_target: newGoal.incomeTarget || 0
          });
        if (error) throw error;
        if (dbStatus !== 'synced') setDbStatus('synced');
      } catch (err: any) {
        console.error('Erro ao atualizar meta Supabase:', err);
        if (err.code === '42P01') setDbStatus('error_tables_missing');
      }
    }
  };

  // 5. Update budgets with Supabase syncer
  const handleUpdateBudgets = async (newBudgets: CategoryBudget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('cont_fin_budgets', JSON.stringify(newBudgets));

    if (user) {
      try {
        for (const b of newBudgets) {
          const compositeId = `${user.id}_${b.categoryId}`;
          const { error } = await supabase
            .from('category_budgets')
            .upsert({
              id: compositeId,
              user_id: user.id,
              category_id: b.categoryId,
              limit_amount: b.limitAmount
            });
          if (error) throw error;
        }
        if (dbStatus !== 'synced') setDbStatus('synced');
      } catch (err: any) {
        console.error('Erro ao atualizar limites Supabase:', err);
        if (err.code === '42P01') setDbStatus('error_tables_missing');
      }
    }
  };

  // 6. Config Reset & Seed options
  const handleResetAllData = () => {
    if (confirm('Atenção: Isso excluirá TODOS os seus lançamentos e redefinirá o aplicativo. Continuar?')) {
      setTransactions([]);
      setGoal({ month: '2026-06', targetAmount: 0, incomeTarget: 0 });
      setBudgets([]);
      localStorage.removeItem('cont_fin_transactions');
      localStorage.removeItem('cont_fin_goal');
      localStorage.removeItem('cont_fin_budgets');
      alert('Aplicativo redefinido com sucesso.');
    }
  };

  const handleReloadMockData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setGoal(DEFAULT_GOAL);
    setBudgets(DEFAULT_BUDGETS);
    localStorage.setItem('cont_fin_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('cont_fin_goal', JSON.stringify(DEFAULT_GOAL));
    localStorage.setItem('cont_fin_budgets', JSON.stringify(DEFAULT_BUDGETS));
    alert('Dados de exemplo recarregados!');
  };

  const handleLoginSuccess = (email: string, userName?: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('cont_fin_id_logged', 'true');
    const uName = userName || email.split('@')[0];
    const update = { name: uName, currency: 'BRL' };
    setProfile(update);
    localStorage.setItem('cont_fin_profile', JSON.stringify(update));
    
    // Explicitly grab user data to trigger sync instantly
    supabase.auth.getUser().then(({ data: { user: supabaseUser } }) => {
      if (supabaseUser) {
        setUser(supabaseUser);
        fetchUserDataFromSupabase(supabaseUser);
      }
    });
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setUser(null);
    setDbStatus('offline');
    localStorage.removeItem('cont_fin_id_logged');
    localStorage.removeItem('cont_fin_transactions');
    localStorage.removeItem('cont_fin_goal');
    localStorage.removeItem('cont_fin_budgets');
    setTransactions([]);
    setGoal(DEFAULT_GOAL);
    setBudgets([]);
    await supabase.auth.signOut();
    setActiveTab('dashboard');
  };

  // Primary aggregates for SELECTED MONTH
  const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  
  const monthIncomes = currentMonthTransactions.filter((t) => t.type === 'receita');
  const monthExpenses = currentMonthTransactions.filter((t) => t.type === 'despesa');

  const totalIncomesMonth = monthIncomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesMonth = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalSavingsMonth = totalIncomesMonth - totalExpensesMonth;

  // Ledger Lifetime Balance
  const lifetimeBalance = transactions.reduce((acc, t) => {
    return t.type === 'receita' ? acc + t.amount : acc - t.amount;
  }, 0);

  // Month options lists (for selector filter)
  const availableMonths = [
    '2026-06',
    '2026-05',
    ...getAvailableMonths(transactions)
  ];
  const uniqueAvailableMonths = Array.from(new Set(availableMonths)).sort((a, b) => b.localeCompare(a));

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row select-none font-sans antialiased animate-in fade-in duration-200">
      
      {/* 1. SIDEBAR FOR DESKTOP & TABLETS */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 h-screen sticky top-0 border-r border-slate-800 font-sans p-6 justify-between z-20">
        <div className="space-y-6">
          {/* Logo brand and subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <div className="w-4.5 h-4.5 border-2 border-slate-900 rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight uppercase text-white">Finanças.io</h1>
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-widest leading-none mt-0.5">Controle Pessoal</p>
            </div>
          </div>

          {/* Quick profile indicators */}
          <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">👤</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Usuário</p>
                <p className="text-xs font-bold text-white truncate mt-1">{profile.name}</p>
              </div>
            </div>
          </div>

          {/* Premium Quick-Add Action Button inside sidebar */}
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>＋</span>
            <span>Novo Lançamento</span>
          </button>

          {/* Navigation vertical list */}
          <nav className="space-y-1 pt-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-slate-800 text-white border-l-4 border-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="text-base">🏠</span>
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'transactions' ? 'bg-slate-800 text-white border-l-4 border-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="text-base">📋</span>
              <span>Transações</span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'goals' ? 'bg-slate-800 text-white border-l-4 border-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="text-base">🎯</span>
              <span>Metas & Limites</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-rose-450 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
        >
          <span className="text-base">🚪</span>
          <span>Sair da Conta</span>
        </button>
      </aside>

      {/* 2. MAIN RESPONSIVE VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-slate-50">
        
        {/* MOBILE HEADER */}
        <header className="flex md:hidden pt-5 px-5 pb-3 bg-white border-b border-slate-200 items-center justify-between z-10 shrink-0 font-sans">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight uppercase text-slate-900">Finanças.io</h1>
              <p className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest leading-none mt-0.5">Olá, {profile.name}</p>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold py-1.5 px-3 rounded-xl outline-hidden cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {uniqueAvailableMonths.map((m) => (
                <option key={m} value={m}>
                  {m === '2026-06' ? 'Junho 2026' : m === '2026-05' ? 'Maio 2026' : getMonthName(m)}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white shrink-0 z-10 font-sans">
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest leading-none">
              {activeTab === 'dashboard' ? 'Painel Geral' : activeTab === 'transactions' ? 'Livro Auxiliar' : activeTab === 'goals' ? 'Planejamento de Metas' : 'Configurações'}
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1 uppercase leading-none">
              {activeTab === 'dashboard' ? `Visão Geral — ${getMonthName(selectedMonth)}` : activeTab === 'transactions' ? 'Lançamentos' : activeTab === 'goals' ? 'Objetivos Financeiros' : 'Ajustes da Conta'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 transition">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mês de Análise:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-900 text-xs font-bold outline-hidden cursor-pointer"
              >
                {uniqueAvailableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === '2026-06' ? 'Junho 2026' : m === '2026-05' ? 'Maio 2026' : getMonthName(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* CONTENT VIEW AREA */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-6 pb-28 md:pb-6 max-w-7xl w-full mx-auto">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Wallet Card - Balance Info */}
              <div id="general-wallet-card" className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Geral Consolidado</span>
                <span className="text-3xl font-light tracking-tight mt-1.5 block">
                  {formatCurrency(lifetimeBalance)}
                </span>
                <p className="text-[10px] text-slate-400 mt-4 leading-none">Seu controle financeiro pessoal e seguro</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Receitas</p>
                  <h2 className="text-lg font-bold text-emerald-600">+{formatCurrency(totalIncomesMonth)}</h2>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Despesas</p>
                  <h2 className="text-lg font-bold text-rose-600">-{formatCurrency(totalExpensesMonth)}</h2>
                </div>
              </div>

              {/* Savings Goal Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Meta de Economia ({selectedMonth})</p>
                    <h3 className="text-lg font-bold text-white">Objetivo Mensal</h3>
                  </div>
                  <p className="text-lg font-bold text-emerald-450">
                    {goal.targetAmount > 0 
                      ? `${Math.min(100, Math.max(0, (totalSavingsMonth / goal.targetAmount) * 100)).toFixed(0)}%` 
                      : '100%'}
                  </p>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                  <div 
                    className="h-full bg-emerald-450 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, goal.targetAmount > 0 ? (totalSavingsMonth / goal.targetAmount) * 100 : 0))}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {totalSavingsMonth >= goal.targetAmount 
                    ? 'Parabéns! Você alcançou a meta planejada para este mês.' 
                    : `Faltam ${formatCurrency(Math.max(0, goal.targetAmount - totalSavingsMonth))} para atingir o objetivo mensal.`}
                </p>
              </div>

              {/* Analytics Sub module SVG charts */}
              <Analytics transactions={transactions} selectedMonth={selectedMonth} />

              {/* Mini visual transaction callouts / Quick review */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline px-1">
                  <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Últimos Lançamentos</h4>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition border-none cursor-pointer"
                  >
                    Ver Tudo
                  </button>
                </div>

                {currentMonthTransactions.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400">Nenhum lançamento no mês selecionado</p>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="mt-2.5 px-3.5 py-1.5 bg-slate-900 text-white font-bold text-[10px] rounded-lg cursor-pointer hover:bg-slate-800 active:scale-95 transition"
                    >
                      + Novo lançamento
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                    {currentMonthTransactions.slice(0, 4).map((t) => {
                      const cat = getCategoryById(t.categoryId);
                      return (
                        <div 
                          key={t.id} 
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleStartEditTransaction(t)}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-lg p-1 bg-slate-50 rounded-lg">{cat.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{t.description}</p>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{cat.name}</span>
                            </div>
                          </div>
                          <strong className={`text-xs font-bold tracking-tight shrink-0 ${t.type === 'receita' ? 'text-emerald-600' : 'text-slate-950'}`}>
                            {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                          </strong>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-in fade-in duration-200 space-y-4">
              <div className="px-1">
                <h3 className="text-base font-black text-slate-900 tracking-tight">LANÇAMENTOS</h3>
                <p className="text-xs text-slate-450 mt-0.5">Histórico e busca rápida de registros</p>
              </div>

              <TransactionList
                transactions={transactions}
                onEdit={handleStartEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="animate-in fade-in duration-200 space-y-4">
              <div className="px-1">
                <h3 className="text-base font-black text-slate-900 tracking-tight">METAS & ORÇAMENTOS</h3>
                <p className="text-xs text-slate-450 mt-0.5">Configure suas intenções de economia e limites saudáveis</p>
              </div>

              <GoalsPanel
                transactions={transactions}
                selectedMonth={selectedMonth}
                goal={goal}
                budgets={budgets}
                onUpdateGoal={handleUpdateGoal}
                onUpdateBudgets={handleUpdateBudgets}
              />
            </div>
          )}

        </main>

        {/* 3. Floating Action Center Button (Floating Center FAB & Navigation dock) */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-around z-20 shrink-0">
          
          <button
            id="tab-dashboard-indicator"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition ${
              activeTab === 'dashboard' ? 'text-slate-900 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Visão Geral</span>
          </button>

          <button
            id="tab-transactions-indicator"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition ${
              activeTab === 'transactions' ? 'text-slate-900 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">📋</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Transações</span>
          </button>

          {/* Quick-Add FAB button in the center */}
          <div className="relative -top-5 shrink-0">
            <button
              id="fab-add-transaction-btn"
              onClick={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
              className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              ＋
            </button>
          </div>

          <button
            id="tab-goals-indicator"
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition ${
              activeTab === 'goals' ? 'text-slate-900 font-bold scale-[1.03]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">🎯</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Metas</span>
          </button>

        </div>

        {/* 4. Active overlay Form Sheet */}
        {isFormOpen && (
          <TransactionForm
            editingTransaction={editingTransaction}
            onSave={handleSaveTransaction}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        )}

      </div>
    </div>
  );
}
