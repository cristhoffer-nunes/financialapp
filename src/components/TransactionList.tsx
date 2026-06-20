/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Transaction, BankAccount, CreditCard } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById } from '../domain/entities/Category';
import { formatCurrency } from '../utils';
import { CategoryIcon } from '../presentation/components/CategoryIcon';
import { 
  Search, 
  Trash2, 
  Edit3, 
  SlidersHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard as CardIcon,
  HelpCircle,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  creditCards: CreditCard[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onReprogramDate: (id: string, newDate: string) => void;
  selectedMonth: string;
  categories?: Category[];
}

type FilterMethod = 'all' | 'debito' | 'credito' | 'loan' | 'dinheiro_outro';
type FilterType = 'all' | 'receita' | 'despesa' | 'pending';
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function TransactionList({
  transactions,
  accounts,
  creditCards,
  onEdit,
  onDelete,
  onToggleStatus,
  onReprogramDate,
  selectedMonth,
  categories = DEFAULT_CATEGORIES
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date-desc');
  const [reprogramId, setReprogramId] = useState<string | null>(null);
  const [reprogramDateInput, setReprogramDateInput] = useState('');

  // Filter current month transactions first
  const monthlyTx = transactions.filter(t => t.date.startsWith(selectedMonth));

  // Filter by search, category, type and paymentMethod
  const filteredTx = monthlyTx.filter((t) => {
    const category = getCategoryById(t.categoryId, categories);
    const textMatch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!textMatch) return false;

    // Filter Type (Receipt, Expense, Pending)
    if (filterType === 'receita' && t.type !== 'receita') return false;
    if (filterType === 'despesa' && t.type !== 'despesa') return false;
    if (filterType === 'pending' && t.status !== 'pendente') return false;

    // Filter Method (Debit, Credit card, Loan, Cash)
    if (filterMethod === 'debito' && t.paymentMethod !== 'debito') return false;
    if (filterMethod === 'credito' && t.paymentMethod !== 'credito') return false;
    if (filterMethod === 'loan' && !t.loanId) return false;
    if (filterMethod === 'dinheiro_outro' && t.paymentMethod !== 'dinheiro' && t.paymentMethod !== 'outro') return false;

    return true;
  });

  // Sort logic
  const sortedTx = [...filteredTx].sort((a, b) => {
    if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
    if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Group by date
  const groupedByDate: Record<string, Transaction[]> = {};
  sortedTx.forEach((tx) => {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  });

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  const getAccountName = (id?: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Conta Geral';
  };

  const getCardName = (id?: string) => {
    const card = creditCards.find(c => c.id === id);
    return card ? card.name : 'Cartão de Crédito';
  };

  const handleStartReprogram = (tx: Transaction) => {
    setReprogramId(tx.id);
    setReprogramDateInput(tx.date);
  };

  const handleSaveReprogram = (id: string) => {
    if (reprogramDateInput) {
      onReprogramDate(id, reprogramDateInput);
    }
    setReprogramId(null);
  };

  return (
    <div className="space-y-4 select-none">
      
      {/* Search & Filter Header card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/50 space-y-4">
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, observação ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition"
          />
        </div>

        {/* Filter Badges resembling premium design */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Section: Flow Type */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['all', 'receita', 'despesa', 'pending'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  filterType === t
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'all' && 'Todos'}
                {t === 'receita' && 'Receitas'}
                {t === 'despesa' && 'Despesas'}
                {t === 'pending' && 'Agendados'}
              </button>
            ))}
          </div>

          {/* Section: Origin segregation */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['all', 'debito', 'credito', 'loan', 'dinheiro_outro'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition ${
                  filterMethod === m
                    ? 'bg-violet-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m === 'all' && 'Fluxo Geral'}
                {m === 'debito' && 'Débito / PIX'}
                {m === 'credito' && 'Cartão Crédito'}
                {m === 'loan' && 'Empréstimos'}
                {m === 'dinheiro_outro' && 'Em Mão'}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent border-0 text-[10px] uppercase tracking-wider font-extrabold text-slate-600 focus:outline-hidden focus:ring-0 cursor-pointer"
            >
              <option value="date-desc">Mais recentes</option>
              <option value="date-asc">Mais antigas</option>
              <option value="amount-desc">Maior valor</option>
              <option value="amount-asc">Menor valor</option>
            </select>
          </div>

        </div>

      </div>

      {/* Transaction List Entries */}
      <div className="space-y-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center flex flex-col items-center justify-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300" />
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Nenhum registro encontrado</h4>
            <p className="text-[10px] text-slate-400 max-w-xs">Nenhuma transação atende aos filtros definidos. Crie ou desative os filtros para listar as movimentações.</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateStr, txs]) => (
            <div key={dateStr} className="space-y-1.5">
              
              {/* Date Header label */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 capitalize block tracking-wide">
                  {formatDateLabel(dateStr)}
                </span>
                <span className="text-[8.5px] font-medium text-slate-350 tracking-wider">
                  {txs.length} {txs.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Transactions on day block */}
              <div className="bg-white rounded-2xl border border-slate-200/40 p-1.5 divide-y divide-slate-100/60 shadow-xs">
                {txs.map((tx) => {
                  const cat = getCategoryById(tx.categoryId, categories);
                  const isReprogramming = reprogramId === tx.id;

                  return (
                    <div 
                      key={tx.id} 
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        tx.status === 'pendente' ? 'bg-zinc-50/45 text-black' : 'text-black hover:bg-neutral-50/30'
                      }`}
                    >
                      
                      {/* Left: icon, category details, payment reference */}
                      <div className="flex items-start gap-3.5">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
                        >
                          <CategoryIcon name={cat.icon} className="w-5 h-5" style={{ color: cat.color }} />
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-850 capitalize leading-snug">
                            {tx.description}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm">{cat.name}</span>
                            
                            {/* Account, Card or Loan contextual badge */}
                            {tx.paymentMethod === 'credito' && tx.creditCardId && (
                              <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-purple-100">
                                <CardIcon className="w-2.5 h-2.5" />
                                {getCardName(tx.creditCardId)}
                              </span>
                            )}
                            
                            {tx.paymentMethod === 'debito' && tx.bankAccountId && (
                              <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-sm border border-amber-100">
                                PIX / {getAccountName(tx.bankAccountId)}
                              </span>
                            )}

                            {tx.loanId && (
                              <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm border border-indigo-100 animate-pulse">
                                Parcela Empréstimo
                              </span>
                            )}

                            {tx.paymentMethod === 'dinheiro' && (
                              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm border border-emerald-100">
                                Dinheiro em Mão
                              </span>
                            )}
                          </div>

                          {/* Notes if present */}
                          {tx.notes && (
                            <p className="text-[10px] text-slate-450 italic font-medium pt-0.5 max-w-sm">
                              "{tx.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: amount, dynamic rescheduling controls, action buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-slate-100/80 pt-2.5 sm:pt-0">
                        
                        {/* Status Switch Badge (Click toggles paid on the fly) */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(tx.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border transition cursor-pointer ${
                            tx.status === 'pago'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {tx.status === 'pago' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {tx.type === 'receita' ? 'Recebido' : 'Liquidado'}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-zinc-400" />
                              Agendado
                            </>
                          )}
                        </button>

                        {/* Amount label */}
                        <div className="text-right">
                          <strong className={`text-xs font-black block tracking-tight ${
                            tx.type === 'receita' ? 'text-emerald-600' : 'text-neutral-800'
                          }`}>
                            {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </strong>
                        </div>

                        {/* Actions (reprogram schedule or edit/delete) */}
                        <div className="flex items-center gap-1.5">
                          
                          {isReprogramming ? (
                            <div className="flex items-center gap-1 animate-in slide-in-from-right-3">
                              <input
                                type="date"
                                value={reprogramDateInput}
                                onChange={e => setReprogramDateInput(e.target.value)}
                                className="px-1.5 py-0.5 border border-zinc-300 rounded-md text-[10px] font-bold focus:outline-hidden"
                              />
                              <button 
                                onClick={() => handleSaveReprogram(tx.id)}
                                className="bg-black text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartReprogram(tx)}
                              className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
                              title="Reprogramar Data"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onEdit(tx)}
                            className="text-slate-400 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDelete(tx.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
