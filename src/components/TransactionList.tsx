/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById, formatCurrency, formatDateFriendly } from '../utils';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  categories?: Category[];
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  categories = DEFAULT_CATEGORIES
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 1. Filter transactions
  const filtered = transactions.filter((t) => {
    // Type Filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    
    // Category Filter
    if (catFilter !== 'all' && t.categoryId !== catFilter) return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
      const cat = getCategoryById(t.categoryId, categories);
      const matchCat = cat.name.toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchCat) return false;
    }

    return true;
  });

  // 2. Sort transactions
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    }
    if (sortBy === 'oldest') {
      return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    }
    if (sortBy === 'highest') {
      return b.amount - a.amount;
    }
    if (sortBy === 'lowest') {
      return a.amount - b.amount;
    }
    return 0;
  });

  // 3. Group by date (only if sorting chronologically)
  const isChronological = sortBy === 'newest' || sortBy === 'oldest';

  // Grouped interface helper
  const dateGroups: Record<string, Transaction[]> = {};
  if (isChronological) {
    sorted.forEach((t) => {
      if (!dateGroups[t.date]) {
        dateGroups[t.date] = [];
      }
      dateGroups[t.date].push(t);
    });
  }

  // Get date key display term
  const getDateHeader = (dateStr: string): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Get yesterday representation
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';

    // Normal date friendly
    return formatDateFriendly(dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Drawer */}
      <div id="filter-wrapper-div" className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por descrição, nota ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-200 focus:bg-white transition"
          />
          <span className="absolute left-3.5 top-3 text-sm font-medium text-slate-400">🔍</span>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-2 py-1 px-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories / Type quick pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {/* Type filters */}
          <button
            onClick={() => { setTypeFilter('all'); setCatFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => { setTypeFilter('receita'); setCatFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              typeFilter === 'receita'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            📈 Receitas
          </button>
          <button
            onClick={() => { setTypeFilter('despesa'); setCatFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              typeFilter === 'despesa'
                ? 'bg-rose-50 border border-rose-100 text-rose-600 shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            💸 Despesas
          </button>

          <div className="w-[1px] h-4 bg-slate-200 shrink-0 mx-0.5" />

          {/* Quick Select specific Categories relative to the type filter */}
          {categories
            .filter((c) => typeFilter === 'all' || c.type === typeFilter)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(catFilter === cat.id ? 'all' : cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 flex items-center gap-1 transition ${
                  catFilter === cat.id
                    ? 'text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100/55'
                }`}
                style={catFilter === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
        </div>

        {/* Sort and counters */}
        <div className="flex items-center justify-between text-xs pt-1">
          <p className="text-[11px] font-bold text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}
          </p>

          <div className="flex items-center gap-1 font-semibold text-slate-600">
            <span className="text-[10px] text-slate-400">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none outline-hidden font-bold text-slate-700 cursor-pointer text-xs"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="highest">Maior valor</option>
              <option value="lowest">Menor valor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actual List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-semibold text-slate-700">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-450 mt-1 max-w-[240px]">
              Tente redefinir seus filtros ou digite algum outro termo na busca.
            </p>
            {(search || typeFilter !== 'all' || catFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setCatFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            )}
        </div>
      ) : isChronological ? (
        /* Render Grouped by Days */
        <div className="space-y-5">
          {Object.entries(dateGroups).map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-2">
              <h4 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase px-1">
                {getDateHeader(dateStr)}
              </h4>

              <div className="bg-white rounded-2xl border border-slate-50 shadow-xs divide-y divide-slate-50 overflow-hidden">
                {items.map((t) => {
                  const cat = getCategoryById(t.categoryId, categories);
                  const isSelected = selectedId === t.id;

                  return (
                    <div key={t.id} className="transition-all duration-200">
                      {/* Main raw info */}
                      <div 
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected ? 'bg-slate-50/70' : 'hover:bg-slate-55'
                        }`}
                        onClick={() => setSelectedId(isSelected ? null : t.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Visual custom category avatar */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                          >
                            <span className="text-lg">{cat.icon}</span>
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                              {t.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span 
                                className="text-[9px] font-extrabold rounded-md px-1 py-[1.5px] uppercase tracking-wide shrink-0"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                              >
                                {cat.name}
                              </span>
                              {t.notes && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  • {t.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount visual indicator */}
                        <div className="text-right shrink-0">
                          <p 
                            className={`text-sm font-bold ${
                              t.type === 'receita' ? 'text-emerald-600' : 'text-slate-950'
                            }`}
                          >
                            {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Expanding Action Drawer (Edit / Delete) */}
                      {isSelected && (
                        <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-end gap-3 border-t border-slate-50/50">
                          <button
                            id={`edit-btn-${t.id}`}
                            onClick={() => {
                              onEdit(t);
                              setSelectedId(null);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-850 shadow-xs transition flex items-center gap-1"
                          >
                            <span>✏️</span> Editar
                          </button>
                          <button
                            id={`del-btn-${t.id}`}
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este lançamento permanentemente?')) {
                                onDelete(t.id);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-xs font-bold text-rose-600 shadow-xs transition flex items-center gap-1"
                          >
                            <span>🗑️</span> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Flat list if sorted by Value */
        <div className="bg-white rounded-2xl border border-slate-50 shadow-xs divide-y divide-slate-50 overflow-hidden">
          {sorted.map((t) => {
            const cat = getCategoryById(t.categoryId, categories);
            const isSelected = selectedId === t.id;

            return (
              <div key={t.id} className="transition-all duration-200">
                <div 
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-slate-50/70' : 'hover:bg-slate-55'
                  }`}
                  onClick={() => setSelectedId(isSelected ? null : t.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                    >
                      <span className="text-lg">{cat.icon}</span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {formatDateFriendly(t.date)}
                        </span>
                        <span 
                          className="text-[9px] font-extrabold rounded-md px-1 py-[1.5px] uppercase tracking-wide shrink-0"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p 
                      className={`text-sm font-bold ${
                        t.type === 'receita' ? 'text-emerald-600' : 'text-slate-950'
                      }`}
                    >
                      {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-end gap-3 border-t border-slate-50/50">
                    <button
                      onClick={() => {
                        onEdit(t);
                        setSelectedId(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 text-xs font-bold text-slate-600 shadow-xs transition flex items-center gap-1"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este lançamento permanentemente?')) {
                          onDelete(t.id);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-xs font-bold text-rose-600 shadow-xs transition flex items-center gap-1"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
