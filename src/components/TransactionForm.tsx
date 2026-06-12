/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { DEFAULT_CATEGORIES, getCategoryById } from '../utils';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  categories?: Category[];
}

export default function TransactionForm({
  onSave,
  onClose,
  editingTransaction = null,
  categories = DEFAULT_CATEGORIES
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('despesa');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorString, setErrorString] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setDescription(editingTransaction.description);
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
    } else {
      // Set default values for new
      const today = new Date();
      // Adjust to Brazil/local timezone date format YYYY-MM-DD
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setType('despesa');
      setAmount('');
      setDescription('');
      setCategoryId('');
      setNotes('');
    }
  }, [editingTransaction]);

  // When type changes, auto-select the first appropriate category if the current one is mismatched
  useEffect(() => {
    const filtered = categories.filter(c => c.type === type);
    if (filtered.length > 0 && (!categoryId || !filtered.some(c => c.id === categoryId))) {
      setCategoryId(filtered[0].id);
    }
  }, [type, categoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorString('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorString('Por favor, informe uma descrição/título para o lançamento.');
      return;
    }

    if (!categoryId) {
      setErrorString('Por favor, selecione uma categoria.');
      return;
    }

    if (!date) {
      setErrorString('Por favor, selecione uma data válida.');
      return;
    }

    onSave({
      id: editingTransaction?.id,
      amount: parsedAmount,
      type,
      description: description.trim(),
      categoryId,
      date,
      notes: notes.trim() || undefined
    });
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end md:items-center justify-center z-50 p-0 md:p-4 font-sans">
      {/* Visual Backdrop Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Form Drawer Content */}
      <form 
        onSubmit={handleSubmit}
        id="transaction-form-element"
        className="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] md:max-h-[85vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 ease-out"
      >
        {/* Mobile slide bar indicator */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0 md:hidden" />

        {/* Modal Header */}
        <div className="px-6 pb-2 pt-1 md:pt-4 flex justify-between items-center shrink-0">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-6 py-2 overflow-y-auto space-y-4 pb-8 flex-1">
          {errorString && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center gap-2">
              ⚠️ {errorString}
            </div>
          )}

          {/* 1. Incomes/Expenses Segment Button */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'despesa'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setType('despesa')}
            >
              💸 Despesa
            </button>
            <button
              type="button"
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'receita'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setType('receita')}
            >
              💰 Receita
            </button>
          </div>

          {/* 2. Amount Big field */}
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
            <label className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Valor do Lançamento</label>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-xl font-light text-slate-400">R$</span>
              <input
                type="text"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setAmount(val);
                }}
                className="text-4xl font-light text-slate-900 bg-transparent outline-hidden border-none text-center max-w-[200px]"
                autoFocus={!editingTransaction}
                required
              />
            </div>
          </div>

          {/* 3. Description Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Aluguel, Salário"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-300 focus:bg-white transition"
              required
            />
          </div>

          {/* 4. Categorias Selection Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Categoria</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                      isSelected
                        ? 'border-transparent bg-slate-900 shadow-xs'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span 
                      className={`text-[9px] font-bold text-center truncate w-full ${
                        isSelected ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Date Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-850 focus:outline-hidden focus:border-slate-300 focus:bg-white transition"
              required
            />
          </div>

          {/* 6. Extra notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Observações (Opcional)</label>
            <textarea
              placeholder="Alguma nota extra..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-850 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-300 focus:bg-white transition resize-none"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`py-3 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
              type === 'despesa' 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-xs' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-xs'
            }`}
          >
            {editingTransaction ? 'Salvar Lançamento' : 'Confirmar Lançamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
