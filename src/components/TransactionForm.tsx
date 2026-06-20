/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category, BankAccount, CreditCard, Transaction, PaymentMethod } from '../types';
import { DEFAULT_CATEGORIES } from '../domain/entities/Category';
import { CategoryIcon } from '../presentation/components/CategoryIcon';
import { Calendar, FileText, AlertCircle, Sparkles } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  accounts: BankAccount[];
  creditCards: CreditCard[];
  categories?: Category[];
}

export default function TransactionForm({
  onSave,
  onClose,
  editingTransaction = null,
  accounts = [],
  creditCards = [],
  categories = DEFAULT_CATEGORIES
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [bankAccountId, setBankAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [notes, setNotes] = useState('');
  const [errorString, setErrorString] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description || '');
      setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
      setType(editingTransaction.type || 'despesa');
      setDate(editingTransaction.date || '');
      setCategoryId(editingTransaction.categoryId || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'debito');
      setBankAccountId(editingTransaction.bankAccountId || '');
      setCreditCardId(editingTransaction.creditCardId || '');
      setStatus(editingTransaction.status || 'pago');
      setNotes(editingTransaction.notes || '');
    } else {
      // Set default values for new
      const today = new Date().toISOString().substring(0, 10);
      setDate(today);
      setDescription('');
      setAmount('');
      setType('despesa');
      setPaymentMethod('debito');
      setNotes('');
      setStatus('pago');

      // Select default account or card if available
      if (accounts.length > 0) {
        setBankAccountId(accounts[0].id);
      }
      if (creditCards.length > 0) {
        setCreditCardId(creditCards[0].id);
      }

      // Default category
      const expenseCats = categories.filter(c => c.type === 'despesa');
      if (expenseCats.length > 0) {
        setCategoryId(expenseCats[0].id);
      }
    }
  }, [editingTransaction, accounts, creditCards, categories]);

  // Handle changing Transaction Type to sync appropriate categories
  const handleTypeChange = (newType: 'receita' | 'despesa') => {
    setType(newType);
    
    // Auto-select first matching category
    const matchingCats = categories.filter(c => c.type === newType);
    if (matchingCats.length > 0) {
      setCategoryId(matchingCats[0].id);
    }

    if (newType === 'receita') {
      setPaymentMethod('debito'); // Receitas are default to debito (account balance)
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorString('Por favor, informe um valor numérico válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorString('A descrição não pode ser vazia.');
      return;
    }

    if (!categoryId) {
      setErrorString('Por favor, selecione uma categoria.');
      return;
    }

    if (!date) {
      setErrorString('Selecione uma data para o registro.');
      return;
    }

    // Validation based on payment method
    let finalBankId = bankAccountId || undefined;
    let finalCardId = creditCardId || undefined;

    if (type === 'despesa') {
      if (paymentMethod === 'debito' && !bankAccountId) {
        setErrorString('Por favor, escolha uma Conta Bancária para debitar.');
        return;
      }
      if (paymentMethod === 'credito') {
        if (!creditCardId) {
          setErrorString('Por favor, escolha o Cartão de Crédito.');
          return;
        }
        finalBankId = undefined; // Credit card buys don't occupy account liquid balance directly
      }
    } else {
      // Receita must have a bankAccountId
      if (!bankAccountId) {
        setErrorString('Por favor, escolha a conta de destino para receber o saldo.');
        return;
      }
      finalCardId = undefined;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : `tx-${Date.now()}`,
      description: description.trim(),
      amount: parsedAmount,
      type,
      date,
      categoryId,
      paymentMethod,
      bankAccountId: finalBankId,
      creditCardId: finalCardId,
      loanId: editingTransaction?.loanId,
      status,
      notes: notes.trim() || undefined,
      isInstallmentPayment: editingTransaction?.isInstallmentPayment
    });

    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header styling echoing premium design */}
        <div className="bg-neutral-900 text-white p-5 flex justify-between items-center relative">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Sincronizado e Seguro
            </span>
            <h3 className="text-base font-black uppercase tracking-wider mt-1">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4 no-scrollbar">
          
          {errorString && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorString}</span>
            </div>
          )}

          {/* Flow Type Selector: Tabs resembling Shadcn */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                type === 'despesa'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Receita
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Amount Label Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                required
              />
            </div>

            {/* Date Picker (supports reprogramming easily) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data da Transação</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                  required
                />
              </div>
            </div>

          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descrição / Conceito</label>
            <input
              type="text"
              placeholder="Ex: Aluguel, Supermercado, Freela..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold text-slate-850 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                required
              >
                <option value="" disabled>Selecione...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status (Pago vs Pendente) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Situação</label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-2xl border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                    status === 'pago'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {type === 'receita' ? 'Recebido' : 'Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                    status === 'pendente'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Agendado
                </button>
              </div>
            </div>
          </div>

          {/* Payment Method - visible only for despesas */}
          {type === 'despesa' && (
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-200/50 rounded-xl">
                {(['debito', 'credito', 'dinheiro', 'outro'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-neutral-950'
                    }`}
                  >
                    {method === 'debito' && 'Débito'}
                    {method === 'credito' && 'Crédito'}
                    {method === 'dinheiro' && 'Dinheiro'}
                    {method === 'outro' && 'Outro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Selector based on Payment Method */}
          {type === 'receita' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conta de Destino (Saldo)</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                required
              >
                <option value="" disabled>Escolha a conta...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (R$ {acc.initialBalance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Despesa Dynamic Options
            <>
              {paymentMethod !== 'credito' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Débito na Conta</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                    required
                  >
                    <option value="" disabled>Escolha a conta...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod === 'credito' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Lançar no Cartão de Crédito</label>
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
                    required
                  >
                    <option value="" disabled>Escolha o cartão...</option>
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name} (Lim. R$ {card.limit.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observações (Opcional)</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-350" />
              <textarea
                placeholder="Informações adicionais do pagamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-neutral-900 focus:bg-white transition min-h-[60px]"
              />
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-black uppercase text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl tracking-wider transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs font-black uppercase text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl tracking-wider transition shadow-md shadow-neutral-950/20 cursor-pointer"
            >
              Salvar Registro
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
