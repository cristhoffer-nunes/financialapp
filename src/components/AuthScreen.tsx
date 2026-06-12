/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onLoginSuccess: (email: string, userName?: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Simple validations
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg('Por favor, insira o seu nome.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Real Supabase Account Registration Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name
            }
          }
        });

        if (error) {
          throw error;
        }

        // Automatic log-in if session is active, otherwise prompt for confirmation
        if (data.user && data?.session) {
          onLoginSuccess(email, name);
        } else {
          setErrorMsg('Cadastro realizado! Por favor, verifique sua caixa de entrada e e-mails de spam para confirmar o seu e-mail antes de fazer login.');
          setIsSignUp(false); // Switch back to allow them to login after confirmation
        }
      } else {
        // Real Supabase Account Authentication/Login Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const displayName = data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Usuário';
          onLoginSuccess(data.user.email || email, displayName);
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação no Supabase:', err);
      const isConfirmationError = err.message?.toLowerCase().includes('confirm') || err.message === 'Email not confirmed';
      
      if (isConfirmationError) {
        setErrorMsg('O seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada para clicar no link de ativação OU desative o "Confirm email" no painel do Supabase (Authentication -> Providers -> Email).');
      } else {
        setErrorMsg(err.message || 'Credenciais inválidas ou erro ao conectar com o Supabase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900 px-4 py-8 md:py-16 w-full">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100 border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand visual header identifier */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-md shadow-slate-900/10">
            <div className="w-6 h-6 border-2 border-white rounded-md"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-slate-950">Finanças.io</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ELEGÂNCIA & SIMPLICIDADE</p>
          </div>
        </div>

        {/* Floating validation notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-center text-[10px] font-bold uppercase tracking-wide leading-tight">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Actual Form fields block */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Seu Nome</label>
              <input
                type="text"
                placeholder="Ex. Arthur Pendragon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-slate-400 transition"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-slate-400 transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Senha</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-slate-400 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 cursor-pointer text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200/50 hover:bg-slate-850 transition duration-150 flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Conectando...
              </span>
            ) : (
              isSignUp ? 'Criar Conta' : 'Acessar Carteira'
            )}
          </button>
        </form>

        {/* Change segment logic button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition underline decoration-dotted underline-offset-4"
          >
            {isSignUp ? 'Já tenho cadastro • Fazer Login' : 'Não tem conta? Cadastrar-se'}
          </button>
        </div>

      </div>
    </div>
  );
}
