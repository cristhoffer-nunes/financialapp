/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Transaction, MonthlyGoal, CategoryBudget, Loan } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById } from '../domain/entities/Category';
import { FinanceService } from '../domain/services/FinanceService';
import { formatCurrency } from '../utils';
import { CategoryIcon } from '../presentation/components/CategoryIcon';
import { Target, ShieldAlert, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

interface GoalsPanelProps {
  transactions: Transaction[];
  loans: Loan[];
  selectedMonth: string; // YYYY-MM
  goal: MonthlyGoal;
  budgets: CategoryBudget[];
  onUpdateGoal: (newGoal: MonthlyGoal) => void;
  onUpdateBudgets: (newBudgets: CategoryBudget[]) => void;
  categories?: Category[];
}

export default function GoalsPanel({
  transactions,
  loans,
  selectedMonth,
  goal,
  budgets,
  onUpdateGoal,
  onUpdateBudgets,
  categories = DEFAULT_CATEGORIES
}: GoalsPanelProps) {
  const [savingsTarget, setSavingsTarget] = useState<string>(goal.targetAmount.toString());
  const [incomeTarget, setIncomeTarget] = useState<string>((goal.incomeTarget || 0).toString());
  
  // Track editing state for category limits in a local object
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    budgets.forEach(b => {
      initial[b.categoryId] = b.limitAmount.toString();
    });
    return initial;
  });

  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Use Domain Service for aggregating month-level totals
  const totals = FinanceService.calculateMonthlyTotals(transactions, loans, selectedMonth);
  const monthExpenses = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'despesa');

  // Spent by category for current month
  const spentByCategory = monthExpenses.reduce((acc, t) => {
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Handle saving primary goals
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const stVal = parseFloat(savingsTarget.replace(',', '.'));
    const itVal = parseFloat(incomeTarget.replace(',', '.'));

    if (isNaN(stVal) || stVal < 0 || isNaN(itVal) || itVal < 0) {
      setSavingStatus('Erro: Valores inválidos fornecidos.');
      return;
    }

    onUpdateGoal({
      month: selectedMonth,
      targetAmount: stVal,
      incomeTarget: itVal
    });

    setSavingStatus('Metas salvas com sucesso.');
    setTimeout(() => setSavingStatus(null), 3000);
  };

  // Handle single budget limits changes
  const handleBudgetLimitChange = (catId: string, value: string) => {
    const updatedDraft = { ...editingBudgets, [catId]: value };
    setEditingBudgets(updatedDraft);

    // Save automatically on valid change
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      const otherBudgets = budgets.filter(b => b.categoryId !== catId);
      const newBudgets = [...otherBudgets, { categoryId: catId, limitAmount: parsed }];
      onUpdateBudgets(newBudgets);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 1. Monthly Savings Goal Section */}
      <div id="monthly-savings-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/60">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Metas Financeiras</h3>
        </div>
        <p className="text-[11px] text-slate-450 mb-4">Seus objetivos de ganho e poupança para {selectedMonth}</p>

        <form onSubmit={handleSaveGoals} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                Meta de Receita
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={incomeTarget}
                  onChange={(e) => setIncomeTarget(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 font-bold text-slate-800 text-xs focus:outline-hidden focus:border-black focus:bg-white transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                Meta de Economia
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 font-bold text-slate-800 text-xs focus:outline-hidden focus:border-black focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-500 font-bold max-w-[200px] leading-tight">
              {savingStatus ? (
                <span className="flex items-center gap-1.5 text-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  {savingStatus}
                </span>
              ) : 'Defina os objetivos mensais e confirme.'}
            </p>
            <button
              type="submit"
              className="px-4 py-2 bg-black hover:bg-slate-900 border border-black text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </form>

        {/* Dynamic Saving Progress Indicator */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Poupança acumulada: / {formatCurrency(goal.targetAmount)}</span>
            <span className="font-bold text-emerald-600 border-none text-[11px]">
              {goal.targetAmount > 0 
                ? `${Math.max(0, (totals.savings / goal.targetAmount) * 100).toFixed(0)}%` 
                : '100%'}
            </span>
          </div>

          {/* Progress Bar background loading */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 bg-emerald-500`}
              style={{ width: `${Math.min(100, Math.max(0, goal.targetAmount > 0 ? (totals.savings / goal.targetAmount) * 100 : 0))}%` }}
            />
          </div>

          <div className="flex justify-between items-baseline text-xs pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Poupado Atual</span>
            <span className={`text-sm font-extrabold ${totals.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(totals.savings)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Budgets per Category (Limites de Gastos por Categoria) */}
      <div id="category-budgets-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/60">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Limites por Categoria</h3>
        </div>
        <p className="text-[11px] text-slate-450 mb-5">Administre limites máximos de despesa para evitar gastos excessivos</p>

        <div className="space-y-3">
          {categories
            .filter(c => c.type === 'despesa')
            .map(cat => {
              const currentSpent = spentByCategory[cat.id] || 0;
              const savedBudget = budgets.find(b => b.categoryId === cat.id);
              const limit = savedBudget ? savedBudget.limitAmount : 0;
              const inputVal = editingBudgets[cat.id] || '0';

              const pctSpent = limit > 0 ? (currentSpent / limit) * 100 : 0;
              const isOverLimit = currentSpent > limit && limit > 0;
              const isWarningLimit = currentSpent >= limit * 0.8 && currentSpent <= limit && limit > 0;

              return (
                <div 
                  key={cat.id} 
                  id={`budget-row-${cat.id}`}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5 transition duration-150 hover:bg-slate-100/40"
                >
                  <div className="flex items-center justify-between gap-3 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <CategoryIcon name={cat.icon} className="w-4 h-4 text-slate-800" />
                      </div>
                      <span className="text-xs font-bold text-slate-850">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Limite R$</span>
                      <input
                        type="text"
                        placeholder="Sem Limite"
                        value={inputVal === '0' ? '' : inputVal}
                        onChange={(e) => handleBudgetLimitChange(cat.id, e.target.value.replace(/[^0-9.,]/g, ''))}
                        className="w-20 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:border-black"
                      />
                    </div>
                  </div>

                  {limit > 0 ? (
                    <div className="space-y-1">
                      {/* Budget tracking visual bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverLimit 
                              ? 'bg-rose-500' 
                              : isWarningLimit 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pctSpent)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold pt-0.5 uppercase tracking-wide">
                        <span className="text-slate-400">Gastou: <strong className="text-rose-600 font-black">{formatCurrency(currentSpent)}</strong></span>
                        {isOverLimit ? (
                          <span className="text-rose-700 font-extrabold flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Excedido em {formatCurrency(currentSpent - limit)}
                          </span>
                        ) : isWarningLimit ? (
                          <span className="text-amber-700 font-extrabold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Alerta 80%+
                          </span>
                        ) : (
                          <span className="text-slate-500">Saldo: <strong className="text-emerald-600 font-black">{formatCurrency(limit - currentSpent)}</strong></span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sem limite cadastrado. Insira um valor acima.</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
