'use client';

import React, { useState } from 'react';
import { User } from '@/types/game';
import { X, Trophy, Calendar, Users, Plus, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface NewChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  currentDate: string;
  onCreated: (championshipId: string) => void;
}

export function NewChampionshipModal({
  isOpen,
  onClose,
  currentUser,
  users,
  currentDate,
  onCreated
}: NewChampionshipModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('Campeonato de Ditloid');
  const [totalRounds, setTotalRounds] = useState(3);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    users.map(u => u.id)
  );

  // Inicializa as datas consecutivas para cada rodada a partir da data atual
  const [roundDates, setRoundDates] = useState<string[]>([]);

  React.useEffect(() => {
    if (roundDates.length === 0 && currentDate) {
      const dates = Array.from({ length: totalRounds }).map((_, i) => {
        const d = new Date(currentDate + 'T12:00:00');
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      });
      setRoundDates(dates);
    }
  }, [currentDate, totalRounds, roundDates.length]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoundsChange = (n: number) => {
    const num = Math.max(1, Math.min(50, isNaN(n) ? 1 : n));
    setTotalRounds(num);
    const newDates = Array.from({ length: num }).map((_, i) => {
      if (roundDates[i]) return roundDates[i];
      const d = new Date(currentDate + 'T12:00:00');
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    setRoundDates(newDates);
  };

  const handleDateChange = (index: number, val: string) => {
    const updated = [...roundDates];
    updated[index] = val;
    setRoundDates(updated);
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length <= 1) return; // Mínimo 1 participante
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) {
      setError('Por favor, informe o nome do campeonato.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Selecione pelo menos um participante.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          creatorId: currentUser.id,
          totalRounds,
          dates: roundDates,
          participantIds: selectedUserIds
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar campeonato');

      toast.success('Campeonato criado com sucesso!');
      onCreated(data.championshipId);
      onClose();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Criar Novo Campeonato</h3>
            <p className="text-xs text-slate-400">Configure as rodadas, datas e convide os participantes da base</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nome do Campeonato */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nome do Campeonato</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Liga Trevo dos Amigos 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Quantidade de Partidas / Rodadas Personalizável */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">
                Quantidade de Partidas / Rodadas
              </label>
              <span className="text-emerald-400 font-black text-sm">
                {totalRounds} {totalRounds === 1 ? 'Rodada' : 'Rodadas'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Stepper e Input Numérico Livre */}
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => handleRoundsChange(totalRounds - 1)}
                  disabled={totalRounds <= 1}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-sm font-bold"
                  title="Diminuir"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalRounds}
                  onChange={(e) => handleRoundsChange(parseInt(e.target.value, 10))}
                  className="w-14 text-center bg-transparent py-2 text-slate-100 font-black text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => handleRoundsChange(totalRounds + 1)}
                  disabled={totalRounds >= 50}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-sm font-bold"
                  title="Aumentar"
                >
                  +
                </button>
              </div>

              {/* Botões Rápidos (incluindo 4 rodadas) */}
              <div className="flex-1 flex gap-1.5 overflow-x-auto py-0.5">
                {[1, 2, 3, 4, 5, 7, 10].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => handleRoundsChange(n)}
                    className={`flex-1 min-w-[34px] py-2 rounded-xl border font-bold text-xs transition ${
                      totalRounds === n
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendário das Rodadas */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Datas de cada Rodada
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {roundDates.map((dateVal, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400">Rodada {idx + 1}:</span>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => handleDateChange(idx, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Participantes da Base */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Participantes ({selectedUserIds.length} selecionados)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {users.map(u => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: u.avatar_color }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <span className="truncate flex-1 font-medium text-xs">{u.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Iniciar Campeonato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
