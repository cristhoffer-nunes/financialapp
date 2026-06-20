/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinanceApp } from './application/hooks/useFinanceApp';
import { FinanceService } from './domain/services/FinanceService';
import { formatCurrency, getMonthName } from './utils';
import { BankAccount, CreditCard, Loan, Transaction, MonthlyGoal } from './types';

// Visual Components
import Analytics from './components/Analytics';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import GoalsPanel from './components/GoalsPanel';
import AuthScreen from './components/AuthScreen';
import { 
  AccountDialog, 
  CardDialog, 
  LoanDialog, 
  StatementPaymentDialog 
} from './components/EntityDialogs';

// Icons from Lucide
import {
  Plus,
  LayoutDashboard,
  Receipt,
  Target,
  LogOut,
  User,
  RefreshCw,
  Trash2,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CreditCard as CardIcon,
  Coins,
  Building,
  Menu,
  ChevronRight,
  ChevronDown,
  Activity,
  ArrowRightLeft,
  CircleDot
} from 'lucide-react';

export default function App() {
  const {
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

    // Actions
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
    handleUpdateGoal,
    handleUpdateBudgets,
    handleResetAllData,
    handleLoginSuccess,
    handleLogout
  } = useFinanceApp();

  // --- COMPONENT LEVEL STATE ---
  // Transaction sheet
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Bank accounts sheets
  const [isAccOpen, setIsAccOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<BankAccount | null>(null);

  // Credit card sheets
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Loan sheets
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Statement payment wizard
  const [activePayCard, setActivePayCard] = useState<CreditCard | null>(null);

  // Mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- FINANCIAL METRICS & AGGREGATIONS ---
  const currentMonth = selectedMonth;

  // 1. Calculate dynamized bank account balances
  const dynamicAccountBalances = FinanceService.calculateAccountBalances(accounts, transactions);
  const totalCheckingAccountsBalance = Object.values(dynamicAccountBalances).reduce((sum, val) => sum + val, 0);

  // 2. Calculate dynamic credit card usages
  const dynamicCardInvoices = FinanceService.calculateCreditCardUsages(creditCards, transactions);
  const totalCardDebtOutstanding = Object.values(dynamicCardInvoices).reduce((sum, val) => sum + val, 0);

  // 3. Calculate dynamic loan outstandings
  const dynamicLoanBalances = FinanceService.calculateLoanBalances(loans, transactions);
  const totalLoanDebtsOutstanding = Object.values(dynamicLoanBalances).reduce((sum, val) => sum + val, 0);

  // 4. Balanço Geral (Overall Consolidated Balance)
  const consolidatedBalançoGeral = totalCheckingAccountsBalance - totalCardDebtOutstanding;

  // 5. Categorized Monthly Flow (Debit vs Card vs Loans)
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const paidMonth = monthTxs.filter(t => t.status === 'pago');

  // Request #3 specific metrics segmentation
  const gastosDebitoConta = paidMonth
    .filter(t => t.type === 'despesa' && t.paymentMethod === 'debito')
    .reduce((sum, t) => sum + t.amount, 0);

  const gastosCartaoCredito = paidMonth
    .filter(t => t.type === 'despesa' && t.paymentMethod === 'credito')
    .reduce((sum, t) => sum + t.amount, 0);

  const gastosDinheiroMao = paidMonth
    .filter(t => t.type === 'despesa' && t.paymentMethod === 'dinheiro')
    .reduce((sum, t) => sum + t.amount, 0);

  const gastosParcelasEmprestimos = paidMonth
    .filter(t => t.type === 'despesa' && t.categoryId === 'emprestimo_pagamento')
    .reduce((sum, t) => sum + t.amount, 0);

  const gastosOutrasFormas = paidMonth
    .filter(t => t.type === 'despesa' && t.paymentMethod === 'outro' && t.categoryId !== 'emprestimo_pagamento')
    .reduce((sum, t) => sum + t.amount, 0);

  // Totals
  const totalSpentPaidMonth = paidMonth.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const totalEarnedPaidMonth = paidMonth.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);

  // Calendar options list
  const availableMonths = FinanceService.getAvailableMonths(transactions);

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // --- ACTIONS TRIGGERS ---
  const triggerAddTransaction = () => {
    setEditingTx(null);
    setIsTxOpen(true);
  };

  const triggerEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxOpen(true);
  };

  const triggerAddAccount = () => {
    setEditingAcc(null);
    setIsAccOpen(true);
  };

  const triggerEditAccount = (acc: BankAccount) => {
    setEditingAcc(acc);
    setIsAccOpen(true);
  };

  const triggerAddCard = () => {
    setEditingCard(null);
    setIsCardOpen(true);
  };

  const triggerEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsCardOpen(true);
  };

  const triggerAddLoan = () => {
    setEditingLoan(null);
    setIsLoanOpen(true);
  };

  const triggerEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setIsLoanOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row select-none font-sans antialiased animate-in fade-in duration-200">
      
      {/* 1. SIDEBAR FOR DESKTOP & TABLETS */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-900 text-white shrink-0 h-screen sticky top-0 border-r border-neutral-800 font-sans p-6 justify-between z-20">
        <div className="space-y-6">
          {/* Logo brand and subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center shadow-md shadow-black/30">
              <span className="font-extrabold text-base">O.</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white">Organize.io</h1>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-0.5">Controle Financeiro</p>
            </div>
          </div>

          {/* Quick profile indicators */}
          <div className="p-3 bg-neutral-850 rounded-2xl border border-neutral-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              M
            </div>
            <div className="leading-tight">
              <span className="text-[10px] font-bold text-zinc-400 block tracking-wider uppercase">Conta Ativa</span>
              <span className="text-xs font-bold text-white block">{profile.name}</span>
            </div>
          </div>

          {/* Nav elements */}
          <nav className="space-y-1">
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block px-3 mb-2">Painel Geral</span>
            
            {[
              { id: 'dashboard', label: 'Balanço Geral', icon: LayoutDashboard },
              { id: 'ledger', label: 'Histórico & Fluxo', icon: Receipt },
              { id: 'accounts', label: 'Contas Bancárias', icon: Building },
              { id: 'cards', label: 'Cartões de Crédito', icon: CardIcon },
              { id: 'loans', label: 'Empréstimos', icon: Coins },
              { id: 'budgets', label: 'Metas e Limites', icon: Target }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-neutral-800 text-white font-bold border border-neutral-750' 
                      : 'text-zinc-400 hover:text-white hover:bg-neutral-850/50'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-violet-400 shadow-xs' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync panel and actions */}
        <div className="pt-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-850 hover:bg-rose-900 border border-neutral-800 text-rose-400 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do App</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION */}
      <header className="md:hidden bg-neutral-900 text-white px-4 py-3 border-b border-neutral-800 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs">
            O.
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase">Organize.io</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerAddTransaction}
            className="p-1 px-3.5 py-1.5 bg-violet-600 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Lançar
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu collapsible options */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-neutral-900 border-b border-neutral-800 p-4 space-y-3 shadow-2xl z-30 animate-in slide-in-from-top-4 duration-250">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dashboard', label: 'Cockpit', icon: LayoutDashboard },
                { id: 'ledger', label: 'Histórico', icon: Receipt },
                { id: 'accounts', label: 'Contas Bancárias', icon: Building },
                { id: 'cards', label: 'Cartões Crédito', icon: CardIcon },
                { id: 'loans', label: 'Empréstimos', icon: Coins },
                { id: 'budgets', label: 'Metas', icon: Target }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold ${
                    activeTab === t.id ? 'bg-neutral-800 text-white shadow-sm' : 'text-zinc-400 bg-neutral-850/50'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            
            <div className="pt-2 border-t border-neutral-800">
              <button 
                onClick={() => { handleLogout(); }}
                className="w-full py-2 text-[8.5px] uppercase font-black tracking-widest text-rose-400 bg-neutral-850 rounded-xl"
              >
                Voltar/Sair
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN WORKPLACE ROUTER CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-h-screen no-scrollbar">
        
        {/* Universal Subtitle / Quick commands line */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              Ambiente de Produção Local
            </div>
            <h2 className="text-lg font-black text-slate-850 uppercase tracking-tight mt-0.5">
              {activeTab === 'dashboard' && 'Balanço Geral'}
              {activeTab === 'ledger' && 'Histórico de Lançamentos'}
              {activeTab === 'accounts' && 'Contas Bancárias'}
              {activeTab === 'cards' && 'Cartões de Crédito'}
              {activeTab === 'loans' && 'Linhas de Empréstimos'}
              {activeTab === 'budgets' && 'Metas & Planejamento'}
            </h2>
          </div>

          {/* Quick Month Navigation + Add Lançamento block */}
          <div className="flex items-center gap-3">
            
            {/* Month select box */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 p-1 px-3.5 rounded-full shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-405 shrink-0" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-black uppercase tracking-wider text-slate-650 focus:outline-hidden focus:ring-0 cursor-pointer"
              >
                {availableMonths.map(mon => (
                  <option key={mon} value={mon}>
                    {getMonthName(mon)} {mon.split('-')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick action for desktop */}
            <button
              onClick={triggerAddTransaction}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-950 text-white hover:bg-neutral-800 rounded-full font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-neutral-950/15 cursor-pointer hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              <span>Novo Lançamento</span>
            </button>

          </div>
        </section>

        {/* PAGE VIEWS SECTION ROUTER */}

        {/* VIEW 1: COCKPIT / BALANÇO GERAL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Multi accounts & debts aggregate grids */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Dynamic Overall Checking Account Balance card */}
              <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-xs relative overflow-hidden group">
                <div className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0 bottom-0" />
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Saldo Líquido em Contas</span>
                  <Building className="w-3.5 h-3.5 text-slate-350" />
                </div>
                <strong className="text-xl font-black text-slate-800 block leading-tight">
                  {formatCurrency(totalCheckingAccountsBalance)}
                </strong>
                <span className="text-[9px] text-slate-400 block mt-1.5 font-bold uppercase tracking-wider">
                  Soma de {accounts.length} contas bancárias ativas
                </span>
              </div>

              {/* Outstanding dynamic Statement charges */}
              <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-xs relative overflow-hidden">
                <div className="w-1.5 h-full bg-indigo-500 absolute left-0 top-0 bottom-0" />
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Faturas Pendentes</span>
                  <CardIcon className="w-3.5 h-3.5 text-slate-350" />
                </div>
                <strong className="text-xl font-black text-rose-600 block leading-tight">
                  {formatCurrency(totalCardDebtOutstanding)}
                </strong>
                <span className="text-[9px] text-slate-400 block mt-1.5 font-bold uppercase tracking-wider">
                  Acumulado de faturas ativas em uso
                </span>
              </div>

              {/* Dynamic overall Balanço Geral calculation (Checking Accounts Minus Cards and Loans or Cards) */}
              <div className="bg-neutral-900 border border-neutral-950 p-5 rounded-3xl shadow-md text-white relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/2 rounded-full pointer-events-none" />
                <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Balanço Patrimonial Geral</span>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                </div>
                <strong className="text-xl font-black block leading-tight">
                  {formatCurrency(consolidatedBalançoGeral)}
                </strong>
                <span className="text-[9px] text-zinc-400 block mt-1.5 font-bold uppercase tracking-wider">
                  Contas correntes - Dívidas ativas de cartão
                </span>
              </div>

            </div>

            {/* Request #3 Dashboard Panel: Explicit metric cards grouping segregating débit vs card vs loans vs cash */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest block">Metas de Transações</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Origens de Gastos no Período ({getMonthName(selectedMonth)})
                </h3>
                <p className="text-[10px] text-slate-400">Separação detalhada das despesas pagas por canal de liquidação</p>
              </div>

              {/* Grid of sources */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                
                <div className="bg-slate-55 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                  <div>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block mb-1.5" />
                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">Lançamentos Débito</span>
                  </div>
                  <strong className="text-sm font-black text-slate-800 block mt-1">
                    {formatCurrency(gastosDebitoConta)}
                  </strong>
                </div>

                <div className="bg-slate-55 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                  <div>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block mb-1.5" />
                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">Cartão de Crédito</span>
                  </div>
                  <strong className="text-sm font-black text-rose-600 block mt-1">
                    {formatCurrency(gastosCartaoCredito)}
                  </strong>
                </div>

                <div className="bg-slate-55 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                  <div>
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block mb-1.5" />
                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">Parcelas Empréstimo</span>
                  </div>
                  <strong className="text-sm font-black text-indigo-700 block mt-1">
                    {formatCurrency(gastosParcelasEmprestimos)}
                  </strong>
                </div>

                <div className="bg-slate-55 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                  <div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mb-1.5" />
                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">Dinheiro em Mão</span>
                  </div>
                  <strong className="text-sm font-black text-slate-800 block mt-1">
                    {formatCurrency(gastosDinheiroMao)}
                  </strong>
                </div>

                <div className="bg-slate-55 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between col-span-2 lg:col-span-1">
                  <div>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mb-1.5" />
                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">Outras Formas</span>
                  </div>
                  <strong className="text-sm font-black text-slate-800 block mt-1">
                    {formatCurrency(gastosOutrasFormas)}
                  </strong>
                </div>

              </div>

              {/* Total Summary Cashflow info */}
              <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex gap-4">
                  <div className="text-xs">
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wide">Total Receitas Liquidadas</span>
                    <strong className="text-emerald-600 font-bold block">
                      {formatCurrency(totalEarnedPaidMonth)}
                    </strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wide">Total Despesas Liquidadas</span>
                    <strong className="text-neutral-800 font-bold block">
                      {formatCurrency(totalSpentPaidMonth)}
                    </strong>
                  </div>
                </div>

                <p className="text-[9.5px] font-semibold text-slate-400 max-w-sm">
                  Gastos com débito e dinheiro reduzem suas contas correntes diretamente. Gastos em cartão acumulam na fatura para payout.
                </p>
              </div>

            </div>

            {/* Analytics segment and mini trends */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Category donut distribution chart in Cockpit */}
              <div className="lg:col-span-7">
                <Analytics transactions={transactions} selectedMonth={selectedMonth} />
              </div>

              {/* Dynamic Mini deck cards overview panel */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Bank Account micro-deck */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Contas Corrente</h3>
                    <button 
                      onClick={() => setActiveTab('accounts')} 
                      className="text-[9.5px] font-black uppercase tracking-widest text-violet-600 hover:text-black transition"
                    >
                      Gerenciar
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                    {accounts.map(acc => {
                      const bal = dynamicAccountBalances[acc.id] !== undefined ? dynamicAccountBalances[acc.id] : acc.initialBalance;
                      return (
                        <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-neutral-50 rounded-2xl border border-slate-100 transition duration-150">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                            <div>
                              <span className="text-[11px] font-bold text-slate-800 block capitalize">{acc.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">{acc.bankName}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-800 font-sans">
                            {formatCurrency(bal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Credit Limits visual overview */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Uso de Crédito</h3>
                    <button 
                      onClick={() => setActiveTab('cards')} 
                      className="text-[9.5px] font-black uppercase tracking-widest text-violet-600 hover:text-indigo-650 transition"
                    >
                      Ver Limites
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-[160px] overflow-y-auto no-scrollbar">
                    {creditCards.map(card => {
                      const invoiceAmount = dynamicCardInvoices[card.id] || 0;
                      const pct = Math.min(100, (invoiceAmount / card.limit) * 100);
                      return (
                        <div key={card.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-700 capitalize text-[11px]">{card.name}</span>
                            <span className="font-black text-rose-600 text-[11px]">{formatCurrency(invoiceAmount)} / {formatCurrency(card.limit)}</span>
                          </div>
                          
                          <div className="w-full h-1.5 bg-slate-150 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              
            </div>

          </div>
        )}

        {/* VIEW 2: HISTÓRICO LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <TransactionList
              transactions={transactions}
              accounts={accounts}
              creditCards={creditCards}
              onEdit={triggerEditTransaction}
              onDelete={handleDeleteTransaction}
              onToggleStatus={handleTogglePaymentStatus}
              onReprogramDate={handleReprogramTransactionDate}
              selectedMonth={selectedMonth}
            />
          </div>
        )}

        {/* VIEW 3: BANK ACCOUNTS MANAGER */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850">Lotes de Contas ({accounts.length})</h3>
                <p className="text-[10px] text-slate-400">Crie, edite saldos iniciais, e gerencie contas e reservas financeiras</p>
              </div>
              <button
                onClick={triggerAddAccount}
                className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer hover:bg-neutral-800"
              >
                Nova Conta
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => {
                const bal = dynamicAccountBalances[acc.id] !== undefined ? dynamicAccountBalances[acc.id] : acc.initialBalance;
                return (
                  <div key={acc.id} className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                    <span className="w-1.5 h-full absolute left-0 top-0 bottom-0" style={{ backgroundColor: acc.color }} />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block capitalize">{acc.type}</span>
                        <strong className="text-sm font-black text-slate-850 mt-0.5 block capitalize">{acc.name}</strong>
                        <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 block">{acc.bankName}</span>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => triggerEditAccount(acc)}
                          className="px-2 py-1 text-[9.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="px-2 py-1 text-[9.5px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100/65 flex justify-between items-baseline">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400">Saldo Dinâmico</span>
                      <strong className="text-base font-black text-slate-800">
                        {formatCurrency(bal)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 4: CREDIT CARDS MANAGER */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850">Evolutivo de Cartões ({creditCards.length})</h3>
                <p className="text-[10px] text-slate-400">Administre limites de crédito, fechamentos e pague faturas</p>
              </div>
              <button
                onClick={triggerAddCard}
                className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer hover:bg-neutral-800"
              >
                Registrar Cartão
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creditCards.map(card => {
                const invoiceAmount = dynamicCardInvoices[card.id] || 0;
                const limitAvailable = Math.max(0, card.limit - invoiceAmount);
                const pct = Math.min(100, (invoiceAmount / card.limit) * 100);

                return (
                  <div key={card.id} className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xs space-y-5 flex flex-col justify-between">
                    
                    {/* Visual Card simulation */}
                    <div 
                      className="p-5 rounded-2xl text-white space-y-4 shadow-sm shadow-black/10 relative overflow-hidden"
                      style={{ backgroundColor: card.color }}
                    >
                      <div className="absolute right-4 top-4 opacity-15"><CardIcon className="w-16 h-16" /></div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] uppercase font-black text-slate-200 block tracking-widest">{card.bankName}</span>
                          <strong className="text-sm font-black tracking-wide block uppercase leading-tight">{card.name}</strong>
                        </div>
                        <span className="text-[9px] bg-white/15 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider select-none">Platinum</span>
                      </div>

                      <div className="pt-2 flex justify-between items-end">
                        <div>
                          <span className="text-[7.5px] uppercase font-bold text-slate-250 block tracking-wider">Fatura do Mês</span>
                          <span className="text-lg font-black block">
                            {formatCurrency(invoiceAmount)}
                          </span>
                        </div>
                        <div className="text-right text-[8.5px] font-semibold text-slate-200">
                          Fechamento: Dia {card.closingDay} • Vencimento: Dia {card.dueDay}
                        </div>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs font-bold uppercase text-slate-500 text-[10px]">
                        <span>Limite Usado: R$ {invoiceAmount.toFixed(2)} ({pct.toFixed(0)}%)</span>
                        <span>Disponível: R$ {limitAvailable.toFixed(2)}</span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-150 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition bg-rose-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Row control actions */}
                    <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 flex-wrap">
                      <button
                        onClick={() => setActivePayCard(card)}
                        className="flex-1 min-w-[120px] px-3 py-2 bg-emerald-600 border border-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:bg-emerald-500 cursor-pointer text-center"
                      >
                        Pagar Fatura
                      </button>
                      <button
                        onClick={() => triggerEditCard(card)}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCreditCard(card.id)}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        Excluir
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 5: LOANS TRACKER */}
        {activeTab === 'loans' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850">Painel de Empréstimos ({loans.length})</h3>
                <p className="text-[10px] text-slate-400">Acompanhe evolução de amortização, parcelas pagas, e adicione pagamentos</p>
              </div>
              <button
                onClick={triggerAddLoan}
                className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer hover:bg-neutral-800"
              >
                Cadastrar Contrato
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loans.map(loan => {
                const outstandingBal = dynamicLoanBalances[loan.id] !== undefined ? dynamicLoanBalances[loan.id] : loan.totalAmount;
                const ratio = loan.installmentsPaid / loan.installmentsTotal;
                const pct = Math.min(100, ratio * 100);

                return (
                  <div key={loan.id} className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xs space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] font-black tracking-widest text-indigo-600 block uppercase">{loan.lender}</span>
                        <strong className="text-sm font-black text-slate-850 block capitalise">{loan.name}</strong>
                        {loan.interestRate && (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm font-bold border border-indigo-100 inline-block mt-0.5">
                            Taxa: {loan.interestRate}% am.
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => triggerEditLoan(loan)}
                          className="px-2.5 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-black border border-slate-200 rounded-lg text-[9.5px] font-bold uppercase transition"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="px-2.5 py-1 bg-slate-50 text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg text-[9.5px] font-bold uppercase transition"
                        >
                          X
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-1.5 border-t border-b border-slate-100/60 font-sans">
                      <div>
                        <span className="text-[8.5px] text-zinc-400 block uppercase font-bold tracking-wider">Principal do Contrato</span>
                        <strong className="text-sm font-black text-slate-800 block">{formatCurrency(loan.totalAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-zinc-400 block uppercase font-bold tracking-wider">Saldo Devido Estimado</span>
                        <strong className="text-sm font-black text-rose-600 block">{formatCurrency(outstandingBal)}</strong>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9.5px] font-extrabold uppercase text-slate-400">
                        <span>Parcelas: {loan.installmentsPaid} / {loan.installmentsTotal} Pagas</span>
                        <span>{pct.toFixed(0)}% Pago</span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center flex-wrap gap-3">
                      <div className="text-[10px]">
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">Valor Mensalidade</span>
                        <strong className="text-xs font-black text-neutral-800">{formatCurrency(loan.monthlyPayment)}</strong>
                      </div>

                      <button
                        onClick={() => handlePayLoanInstallment(loan.id, loan.bankAccountId)}
                        disabled={loan.installmentsPaid >= loan.installmentsTotal}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer text-center ${
                          loan.installmentsPaid >= loan.installmentsTotal
                            ? 'bg-zinc-150 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                            : 'bg-indigo-600 border border-indigo-700 text-white hover:bg-indigo-500'
                        }`}
                      >
                        {loan.installmentsPaid >= loan.installmentsTotal ? 'Contrato Liquidado!' : 'Pagar Parcela Local'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 6: GOAL & BUDGET PLANNING */}
        {activeTab === 'budgets' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <GoalsPanel
              transactions={transactions}
              loans={loans}
              selectedMonth={selectedMonth}
              goal={goal}
              budgets={budgets}
              onUpdateGoal={handleUpdateGoal}
              onUpdateBudgets={handleUpdateBudgets}
            />
          </div>
        )}

      </main>

      {/* --- ALL FLOW ENTRY POPUP SHEETS (DIALOGS MODULE) --- */}
      
      {/* 1. Transaction Form Modal */}
      {isTxOpen && (
        <TransactionForm
          onSave={handleSaveTransaction}
          onClose={() => { setIsTxOpen(false); setEditingTx(null); }}
          editingTransaction={editingTx}
          accounts={accounts}
          creditCards={creditCards}
        />
      )}

      {/* 2. Account dialog modal */}
      {isAccOpen && (
        <AccountDialog
          onSave={handleSaveAccount}
          onClose={() => { setIsAccOpen(false); setEditingAcc(null); }}
          editingAccount={editingAcc}
        />
      )}

      {/* 3. Credit Card dialog modal */}
      {isCardOpen && (
        <CardDialog
          onSave={handleSaveCreditCard}
          onClose={() => { setIsCardOpen(false); setEditingCard(null); }}
          editingCard={editingCard}
        />
      )}

      {/* 4. Loan dialog modal */}
      {isLoanOpen && (
        <LoanDialog
          onSave={handleSaveLoan}
          onClose={() => { setIsLoanOpen(false); setEditingLoan(null); }}
          accounts={accounts}
          editingLoan={editingLoan}
        />
      )}

      {/* 5. Fast Statement clearing popup */}
      {activePayCard && (
        <StatementPaymentDialog
          creditCard={activePayCard}
          outstandingAmount={dynamicCardInvoices[activePayCard.id] || 0}
          accounts={accounts}
          onConfirm={handlePayCardStatement}
          onClose={() => setActivePayCard(null)}
        />
      )}

    </div>
  );
}
