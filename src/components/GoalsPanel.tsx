/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Category, MonthlyGoal, CategoryBudget } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById, formatCurrency } from '../utils';

interface GoalsPanelProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  goal: MonthlyGoal;
  budgets: CategoryBudget[];
  onUpdateGoal: (newGoal: MonthlyGoal) => void;
  onUpdateBudgets: (newBudgets: CategoryBudget[]) => void;
  categories?: Category[];
}

export default function GoalsPanel({
  transactions,
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

  // Filter current month transactions
  const monthTrans = transactions.filter(t => t.date.startsWith(selectedMonth));
  const monthExpenses = monthTrans.filter(t => t.type === 'despesa');
  const monthIncomes = monthTrans.filter(t => t.type === 'receita');

  const totalIncomes = monthIncomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const actualSavings = totalIncomes - totalExpenses;

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

    setSavingStatus('Metas mensais salvas com sucesso! 🎉');
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
    <div className="space-y-6 font-sans">
      {/* 1. Monthly Savings Goal Section */}
      <div id="monthly-savings-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
        <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider mb-1">Metas Financeiras</h3>
        <p className="text-[11px] text-slate-400 mb-4">Seus objetivos de ganho e poupança para {selectedMonth}</p>

        <form onSubmit={handleSaveGoals} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                Meta de Receita
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={incomeTarget}
                  onChange={(e) => setIncomeTarget(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-sm focus:outline-hidden focus:border-slate-200 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                Meta de Economia
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-sm focus:outline-hidden focus:border-slate-200 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-emerald-650 font-bold max-w-[180px] leading-tight">
              {savingStatus ? savingStatus : '✔️ Defina suas metas mensais acima e clique em salvar.'}
            </p>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 duration-200 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              Salvar Metas
            </button>
          </div>
        </form>

        {/* Dynamic Saving Progress Indicator */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Meta de Economia: {formatCurrency(goal.targetAmount)}</span>
            <span className="font-bold text-slate-900 border-none text-[11px]">
              {goal.targetAmount > 0 
                ? `${Math.max(0, (actualSavings / goal.targetAmount) * 100).toFixed(0)}%` 
                : '100%'}
            </span>
          </div>

          {/* Progress Bar background loading */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                actualSavings >= goal.targetAmount 
                  ? 'bg-emerald-500' 
                  : 'bg-slate-950'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, goal.targetAmount > 0 ? (actualSavings / goal.targetAmount) * 100 : 0))}%` }}
            />
          </div>

          <div className="flex justify-between items-baseline text-xs pt-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Poupado Atual</span>
            <span className={`text-sm font-bold ${actualSavings >= goal.targetAmount ? 'text-emerald-650' : 'text-slate-900'}`}>
              {formatCurrency(actualSavings)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Budgets per Category (Limites de Gastos por Categoria) */}
      <div id="category-budgets-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
        <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider mb-1">Limites por Categoria</h3>
        <p className="text-[11px] text-slate-400 mb-5">Administre limites máximos de despesa para evitar gastos excessivos</p>

        <div className="space-y-4">
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
                  className="p-3 bg-slate-55/40 rounded-xl border border-slate-100 space-y-2.5 transition duration-150 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite R$</span>
                      <input
                        type="text"
                        placeholder="Sem Limite"
                        value={inputVal === '0' ? '' : inputVal}
                        onChange={(e) => handleBudgetLimitChange(cat.id, e.target.value.replace(/[^0-9.,]/g, ''))}
                        className="w-20 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:border-slate-300"
                      />
                    </div>
                  </div>

                  {limit > 0 ? (
                    <div className="space-y-1">
                      {/* Budget tracking visual bar */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverLimit 
                              ? 'bg-rose-500' 
                              : isWarningLimit 
                              ? 'bg-amber-400' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pctSpent)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-medium pt-0.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Gastou: {formatCurrency(currentSpent)}</span>
                        {isOverLimit ? (
                          <span className="text-rose-600 font-extrabold uppercase">🚨 Estourado por {formatCurrency(currentSpent - limit)}</span>
                        ) : isWarningLimit ? (
                          <span className="text-amber-500 font-extrabold uppercase">⚠️ Alerta 80%+</span>
                        ) : (
                          <span className="text-emerald-600 font-extrabold uppercase">Livre: {formatCurrency(limit - currentSpent)}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem limite ativo. Defina um valor limite acima.</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
