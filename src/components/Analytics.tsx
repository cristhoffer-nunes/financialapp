/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById } from '../domain/entities/Category';
import { FinanceService } from '../domain/services/FinanceService';
import { formatCurrency } from '../utils';
import { CategoryIcon } from '../presentation/components/CategoryIcon';
import { BarChart3, PieChart } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  categories?: Category[];
}

export default function Analytics({
  transactions,
  selectedMonth,
  categories = DEFAULT_CATEGORIES
}: AnalyticsProps) {
  const [selectedCategorySlice, setSelectedCategorySlice] = useState<string | null>(null);
  const [hoveredTrendMonth, setHoveredTrendMonth] = useState<string | null>(null);

  // 1. Calculations for CURRENT SELECTED MONTH (Category Donut)
  const currentMonthTransactions = transactions.filter(
    t => t.date.startsWith(selectedMonth)
  );

  const currentExpenses = currentMonthTransactions.filter(t => t.type === 'despesa');
  const totalExpenseAmount = currentExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Group current expenses by category using the domain service!
  const groupedExpenses = FinanceService.groupExpensesByCategory(transactions, selectedMonth);
  const hasExpenses = totalExpenseAmount > 0;

  // Convert to array with visual details and sort descending
  const donutData = groupedExpenses.map((group) => {
    const cat = getCategoryById(group.categoryId, categories);
    return {
      catId: group.categoryId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color, // uses our monochromatic colors defined in the Category entity
      amount: group.amount,
      pct: group.percentage
    };
  });

  // Math for SVG Donut (using stroke-dasharray technique)
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // Approx 408.4

  let accumulatedPercent = 0;

  // 2. Calculations for ALL MONTHS (Historical Trend Chart: Receita vs Despesa)
  const monthlyTotals: Record<string, { receita: number; despesa: number }> = {};
  
  // Ensure we at least have May and June represented
  monthlyTotals['2026-05'] = { receita: 0, despesa: 0 };
  monthlyTotals['2026-06'] = { receita: 0, despesa: 0 };

  transactions.forEach(t => {
    const m = t.date.substring(0, 7);
    if (!monthlyTotals[m]) {
      monthlyTotals[m] = { receita: 0, despesa: 0 };
    }
    if (t.type === 'receita') {
      monthlyTotals[m].receita += t.amount;
    } else {
      monthlyTotals[m].despesa += t.amount;
    }
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyTotals).sort().slice(-4); // show last 4 months

  // Find max value in monthly to scale the trend chart y-axis
  const maxTrendValue = Math.max(
    ...sortedMonths.map(m => Math.max(monthlyTotals[m].receita, monthlyTotals[m].despesa, 500)),
    3000 // default minimum peak representation
  ) * 1.15; // 15% top padding

  const selectedCategoryDetail = selectedCategorySlice 
    ? donutData.find(d => d.catId === selectedCategorySlice) 
    : donutData[0];

  return (
    <div className="space-y-6">
      {/* 1. Category Chart */}
      <div id="category-chart-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <PieChart className="w-4 h-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Distribuição de Gastos</h3>
        </div>
        <p className="text-[11px] text-slate-400 mb-5">Categorias de despesas em {selectedMonth}</p>

        {!hasExpenses ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <PieChart className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Nenhum gasto cadastrado</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Adicione despesas para começarmos a traçar sua distribuição financeira.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Donut */}
            <div className="relative flex justify-center items-center h-44">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 200 200">
                <defs>
                  <filter id="glow-effect" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                  </filter>
                </defs>
                {/* Background base circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="20"
                />
                
                {donutData.map((slice) => {
                  const strokeWidth = selectedCategorySlice === slice.catId ? 26 : 20;
                  const dashOffset = circumference - (accumulatedPercent / 100) * circumference;
                  const dashLength = (slice.pct / 100) * circumference;
                  accumulatedPercent += slice.pct;

                  return (
                    <circle
                      key={slice.catId}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap={slice.pct > 3 ? "round" : "butt"}
                      className="cursor-pointer transition-all duration-300 hover:opacity-90"
                      style={{ filter: selectedCategorySlice === slice.catId ? 'url(#glow-effect)' : 'none' }}
                      onClick={() => {
                        setSelectedCategorySlice(
                          selectedCategorySlice === slice.catId ? null : slice.catId
                        );
                      }}
                    />
                  );
                })}
              </svg>

              {/* Text in the Center */}
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-center">
                {selectedCategoryDetail ? (
                  <>
                    <CategoryIcon name={selectedCategoryDetail.icon} className="w-5 h-5 text-slate-800" />
                    <span className="text-xs font-semibold text-slate-500 mt-1 truncate max-w-[90px]">
                      {selectedCategoryDetail.name}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedCategoryDetail.pct.toFixed(0)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    <span className="text-sm font-bold text-rose-600">
                      {formatCurrency(totalExpenseAmount)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legend checklist with values */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
              {donutData.map((slice) => (
                <button
                  key={slice.catId}
                  id={`legend-btn-${slice.catId}`}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 text-left border ${
                    selectedCategorySlice === slice.catId 
                      ? 'bg-slate-150 border-slate-300 shadow-xs' 
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setSelectedCategorySlice(
                      selectedCategorySlice === slice.catId ? null : slice.catId
                    );
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100 border border-slate-200 text-slate-800"
                    >
                      <CategoryIcon name={slice.icon} className="w-4 h-4 text-slate-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{slice.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {slice.pct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-rose-600 border-none">
                      {formatCurrency(slice.amount)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Historic Trends Chart */}
      <div id="trend-chart-card" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 font-sans">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Histórico Mensal</h3>
        </div>
        <p className="text-[11px] text-slate-400 mb-6">Comparação do fluxo de caixa recente</p>

        <div className="relative pt-2 pb-2 h-44">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
            {/* Horizontal Grid lines */}
            <line x1="30" y1="10" x2="390" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="60" x2="390" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="110" x2="390" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            {/* X-Axis baseline */}
            <line x1="30" y1="120" x2="390" y2="120" stroke="#e2e8f0" strokeWidth="1" />

            {/* Render Bars */}
            {sortedMonths.map((m, index) => {
              const { receita, despesa } = monthlyTotals[m];
              
              // Coordinates on X (grouped)
              const containerWidth = 360 / sortedMonths.length;
              const xCenter = 30 + (index * containerWidth) + (containerWidth / 2);
              
              // Heights of bars (capped to 0-110px)
              const rHeight = (receita / maxTrendValue) * 110;
              const dHeight = (despesa / maxTrendValue) * 110;

              // Bar width for grouped values
              const barWidth = 14;
              const spacing = 4;
              const rx = xCenter - barWidth - (spacing / 2);
              const dx = xCenter + (spacing / 2);

              const ry = 120 - rHeight;
              const dy = 120 - dHeight;

              const isHovered = hoveredTrendMonth === m;

              return (
                <g 
                  key={m} 
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredTrendMonth(m)}
                  onMouseLeave={() => setHoveredTrendMonth(null)}
                >
                  {/* Income Bar (Green - Emerald) */}
                  <rect
                    x={rx}
                    y={ry}
                    width={barWidth}
                    height={Math.max(rHeight, 1)}
                    rx="2"
                    fill="#10b981" // Emerald-500
                    className="transition-all duration-300"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Expense Bar (Red - Rose) */}
                  <rect
                    x={dx}
                    y={dy}
                    width={barWidth}
                    height={Math.max(dHeight, 1)}
                    rx="2"
                    fill="#f43f5e" // Rose-500
                    className="transition-all duration-300"
                    opacity={isHovered ? 1 : 0.8}
                  />

                  {/* X-Axis labels (Short months names) */}
                  <text
                    x={xCenter}
                    y="138"
                    textAnchor="middle"
                    className="text-[10px] font-extrabold fill-slate-400 uppercase tracking-wider"
                  >
                    {m === '2026-05' ? 'Mai' : m === '2026-06' ? 'Jun' : m.split('-')[1]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Overlay Legend */}
          {hoveredTrendMonth && (
            <div className="absolute top-2 left-[50%] transform -translate-x-1/2 bg-black text-white rounded-xl shadow-lg p-2.5 flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider pointer-events-none z-10">
              <div>
                <p className="text-slate-400 font-extrabold mb-1">
                  {hoveredTrendMonth === '2026-05' ? 'Maio 2026' : hoveredTrendMonth === '2026-06' ? 'Junho 2026' : hoveredTrendMonth}
                </p>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Rec: <strong className="text-white">{formatCurrency(monthlyTotals[hoveredTrendMonth].receita)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Desp: <strong className="text-white">{formatCurrency(monthlyTotals[hoveredTrendMonth].despesa)}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend block indicators */}
        <div className="flex justify-center items-center gap-6 mt-2 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-rose-500" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Despesas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
