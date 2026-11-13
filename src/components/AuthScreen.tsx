'use client';

import React, { useState } from 'react';
import { User } from '@/types/game';
import { Clover, Lock, Mail, User as UserIcon, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    '#10b981', // emerald
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#ec4899', // pink
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ef4444'  // red
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { name, email, password, avatarColor }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na autenticação');

      // Salva no localStorage para manter a sessão ativa
      localStorage.setItem('gametrevo_user', JSON.stringify(data));
      toast.success(isRegister ? 'Conta criada com sucesso!' : `Bem-vindo de volta, ${data.name}!`);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: User) => {
    localStorage.setItem('gametrevo_user', JSON.stringify(u));
    onLoginSuccess(u);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19]">
      <div className="max-w-md w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/20">
            <Clover className="w-8 h-8 text-slate-950 fill-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">GameTrevo</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Liga Diária de Trivia Ditloid • Competição em Grupo
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6 pb-2">
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 pb-2 text-xs font-bold transition border-b-2 ${
                !isRegister
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 pb-2 text-xs font-bold transition border-b-2 ${
                isRegister
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Cadastro
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isRegister ? 'E-mail' : 'Usuário ou E-mail'}
              </label>
              <div className="relative">
                {isRegister ? (
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                )}
                <input
                  type={isRegister ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegister ? 'seu.email@exemplo.com' : 'Seu nome de usuário ou e-mail'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Escolha a cor do seu Avatar</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-6 h-6 rounded-full transition transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processando...' : isRegister ? 'Concluir Cadastro e Jogar' : 'Entrar no Jogo'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer info about fog-of-war */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Privacidade total: seus palpites e pontos ficam em sigilo até o dia seguinte!
          </p>
        </div>

      </div>
    </div>
  );
}
