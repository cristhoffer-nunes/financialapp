/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, CreditCard, Loan, AccountType } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';

const PALETTE = ['#4f46e5', '#9333ea', '#ea580c', '#0284c7', '#10b981', '#f43f5e', '#0f172a'];

// --- BANK ACCOUNT DIALOG ---
interface AccountDialogProps {
  onSave: (account: BankAccount) => void;
  onClose: () => void;
  editingAccount?: BankAccount | null;
}

export function AccountDialog({ onSave, onClose, editingAccount = null }: AccountDialogProps) {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [type, setType] = useState<AccountType>('corrente');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [errorString, setErrorString] = useState<string | null>(null);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setBankName(editingAccount.bankName);
      setType(editingAccount.type);
      setInitialBalance(editingAccount.initialBalance.toString());
      setColor(editingAccount.color);
    } else {
      setName('');
      setBankName('');
      setType('corrente');
      setInitialBalance('');
      setColor(PALETTE[0]);
    }
  }, [editingAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorString('O nome da conta é obrigatório.');
    if (!bankName.trim()) return setErrorString('O nome do banco é obrigatório.');
    const parsedBal = parseFloat(initialBalance.replace(',', '.'));
    if (isNaN(parsedBal)) return setErrorString('Informe um saldo válido.');

    onSave({
      id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
      name: name.trim(),
      bankName: bankName.trim(),
      type,
      initialBalance: parsedBal,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in scale-in duration-300">
        <div className="bg-neutral-900 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Clean Architecture</span>
            <h3 className="text-sm font-black uppercase tracking-wider mt-1">
              {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorString && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorString}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome de exibição</label>
            <input
              type="text"
              placeholder="Ex: Nubank Principal, Itaú Poupança..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900 transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Instituição Bancária</label>
            <input
              type="text"
              placeholder="Ex: Nubank S.A., Banco Itaú S.A."
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900 transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipo de Conta</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AccountType)}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="carteira">Dinheiro em Espécie</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saldo Atual (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={initialBalance}
                onChange={e => setInitialBalance(e.target.value)}
                className="w-full px-4 py-2 text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cor de Identificação</label>
            <div className="flex gap-2.5">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-250 cursor-pointer ${
                    color === c ? 'border-neutral-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-black uppercase text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-black uppercase text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- CREDIT CARD DIALOG ---
interface CardDialogProps {
  onSave: (card: CreditCard) => void;
  onClose: () => void;
  editingCard?: CreditCard | null;
}

export function CardDialog({ onSave, onClose, editingCard = null }: CardDialogProps) {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(10);
  const [dueDay, setDueDay] = useState(17);
  const [color, setColor] = useState('#7e22ce');
  const [errorString, setErrorString] = useState<string | null>(null);

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setBankName(editingCard.bankName);
      setLimit(editingCard.limit.toString());
      setClosingDay(editingCard.closingDay);
      setDueDay(editingCard.dueDay);
      setColor(editingCard.color);
    } else {
      setName('');
      setBankName('');
      setLimit('');
      setClosingDay(10);
      setDueDay(17);
      setColor(PALETTE[1]);
    }
  }, [editingCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorString('O nome do cartão é obrigatório.');
    if (!bankName.trim()) return setErrorString('O emissor é obrigatório.');
    const parsedLimit = parseFloat(limit.replace(',', '.'));
    if (isNaN(parsedLimit) || parsedLimit <= 0) return setErrorString('Limite inválido.');

    onSave({
      id: editingCard ? editingCard.id : `card-${Date.now()}`,
      name: name.trim(),
      bankName: bankName.trim(),
      limit: parsedLimit,
      closingDay,
      dueDay,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in scale-in duration-300">
        <div className="bg-neutral-900 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Crédito Organizado</span>
            <h3 className="text-sm font-black uppercase tracking-wider mt-1">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorString && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorString}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome do Cartão</label>
            <input
              type="text"
              placeholder="Ex: Nubank Ultra, Itaú Visa Infinite..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bandeira / Emissor</label>
            <input
              type="text"
              placeholder="Ex: Mastercard, Visa, American Express"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-neutral-900"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest col-span-1 block">Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={e => setClosingDay(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={e => setDueDay(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Limite R$</label>
              <input
                type="text"
                placeholder="4000"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Layout Visual do Cartão</label>
            <div className="flex gap-2.5">
              {['#6b21a8', '#ea580c', '#3b82f6', '#1e293b', '#dc2626', '#16a34a'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-sm border-2 transition-all duration-200 cursor-pointer ${
                    color === c ? 'border-neutral-900 scale-105 shadow-sm' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-black uppercase text-slate-500 bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-black uppercase text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- LOAN REGISTRATION DIALOG ---
interface LoanDialogProps {
  onSave: (loan: Loan) => void;
  onClose: () => void;
  accounts: BankAccount[];
  editingLoan?: Loan | null;
}

export function LoanDialog({ onSave, onClose, accounts = [], editingLoan = null }: LoanDialogProps) {
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('12');
  const [installmentsPaid, setInstallmentsPaid] = useState('0');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [interestRate, setInterestRate] = useState('1.2');
  const [notes, setNotes] = useState('');
  const [errorString, setErrorString] = useState<string | null>(null);

  useEffect(() => {
    if (editingLoan) {
      setName(editingLoan.name);
      setLender(editingLoan.lender);
      setTotalAmount(editingLoan.totalAmount.toString());
      setInstallmentsTotal(editingLoan.installmentsTotal.toString());
      setInstallmentsPaid(editingLoan.installmentsPaid.toString());
      setMonthlyPayment(editingLoan.monthlyPayment.toString());
      setBankAccountId(editingLoan.bankAccountId);
      setInterestRate(editingLoan.interestRate ? editingLoan.interestRate.toString() : '');
      setNotes(editingLoan.notes || '');
    } else {
      setName('');
      setLender('');
      setTotalAmount('');
      setInstallmentsTotal('24');
      setInstallmentsPaid('0');
      setMonthlyPayment('');
      setNotes('');
      setInterestRate('1.5');
      if (accounts.length > 0) {
        setBankAccountId(accounts[0].id);
      }
    }
  }, [editingLoan, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorString('O nome do empréstimo é obrigatório.');
    if (!lender.trim()) return setErrorString('O credor/banco é obrigatório.');
    const parsedTotal = parseFloat(totalAmount.replace(',', '.'));
    if (isNaN(parsedTotal) || parsedTotal <= 0) return setErrorString('Valor total inválido.');
    const parsedMonthly = parseFloat(monthlyPayment.replace(',', '.'));
    if (isNaN(parsedMonthly) || parsedMonthly <= 0) return setErrorString('Valor da parcela inválido.');
    if (!bankAccountId) return setErrorString('Selecione uma conta vinculada.');

    onSave({
      id: editingLoan ? editingLoan.id : `loan-${Date.now()}`,
      name: name.trim(),
      lender: lender.trim(),
      totalAmount: parsedTotal,
      installmentsTotal: parseInt(installmentsTotal) || 12,
      installmentsPaid: parseInt(installmentsPaid) || 0,
      monthlyPayment: parsedMonthly,
      bankAccountId,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      startDate: editingLoan ? editingLoan.startDate : new Date().toISOString().substring(0, 10),
      notes: notes.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in scale-in duration-300 max-h-[92vh]">
        <div className="bg-neutral-900 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Financiamentos & Dívidas</span>
            <h3 className="text-sm font-black uppercase tracking-wider mt-1">
              {editingLoan ? 'Editar Empréstimo' : 'Registrar Empréstimo / Financiamento'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
          {errorString && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorString}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descrição do Empréstimo</label>
              <input
                type="text"
                placeholder="Ex: Financiamento Jeep, Empréstimo Itaú..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Instituição Credora</label>
              <input
                type="text"
                placeholder="Ex: BV Financeira, Banco do Brasil..."
                value={lender}
                onChange={e => setLender(e.target.value)}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total R$</label>
              <input
                type="text"
                placeholder="Ex: 35000"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tx de Juros (%mês)</label>
              <input
                type="text"
                placeholder="Ex: 1.5"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor Parcela R$</label>
              <input
                type="text"
                placeholder="Ex: 850"
                value={monthlyPayment}
                onChange={e => setMonthlyPayment(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Parcelas (Nº)</label>
              <input
                type="number"
                min="1"
                value={installmentsTotal}
                onChange={e => setInstallmentsTotal(e.target.value)}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Parcelas Pagas (Nº)</label>
              <input
                type="number"
                min="0"
                value={installmentsPaid}
                onChange={e => setInstallmentsPaid(e.target.value)}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conta Associada (Aportes/Abatimentos)</label>
            <select
              value={bankAccountId}
              onChange={e => setBankAccountId(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              required
            >
              <option value="" disabled>Selecione a conta...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <span className="text-[8.5px] text-zinc-400 block mt-1">O valor liberado de crédito inicial será depositado nesta conta corrente.</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observações (Opcional)</label>
            <textarea
              placeholder="Ex: Financiamento direto com a concessionária ou banco de fomento..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px]"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-black uppercase text-slate-500 bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-black uppercase text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer"
            >
              Registrar Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- QUICK STATEMENT PAYMENT DIALOG ---
interface StatementPaymentDialogProps {
  creditCard: CreditCard;
  outstandingAmount: number;
  accounts: BankAccount[];
  onConfirm: (cardId: string, bankAccountId: string, paymentAmount: number) => void;
  onClose: () => void;
}

export function StatementPaymentDialog({
  creditCard,
  outstandingAmount,
  accounts,
  onConfirm,
  onClose
}: StatementPaymentDialogProps) {
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [errorString, setErrorString] = useState<string | null>(null);

  useEffect(() => {
    setAmount(outstandingAmount.toFixed(2));
    if (accounts.length > 0) {
      setBankAccountId(accounts[0].id);
    }
  }, [creditCard, outstandingAmount, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId) return setErrorString('Por favor, selecione uma conta de pagamento.');
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setErrorString('Por favor, insira um valor de quitação válido.');

    onConfirm(creditCard.id, bankAccountId, parsedAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in scale-in duration-300">
        <div className="bg-neutral-900 text-white p-5">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Pagar Fatura</span>
          <h3 className="text-sm font-black uppercase tracking-wider mt-0.5">{creditCard.name}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorString && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorString}</span>
            </div>
          )}

          <div className="bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-100 text-zinc-700 text-center space-y-1">
            <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider">Gastos Acumulados no Cartão</span>
            <strong className="text-lg font-black text-rose-600 block">R$ {outstandingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conta para Debitarem (Saldo Canalizado)</label>
            <select
              value={bankAccountId}
              onChange={e => setBankAccountId(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              required
            >
              <option value="" disabled>Escolha a conta...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.initialBalance.toFixed(2)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor de Quitação R$</label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2 text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-2.5 text-xs font-black uppercase text-slate-500 bg-slate-50 rounded-xl cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex-grow py-2.5 text-xs font-black uppercase text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer"
            >
              Efetivar Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
