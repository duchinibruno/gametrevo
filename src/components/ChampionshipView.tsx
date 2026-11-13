'use client';

import React, { useState, useEffect } from 'react';
import { Championship, Round, User, ChampionshipParticipant } from '@/types/game';
import {
  Trophy,
  Calendar,
  Users,
  Play,
  Lock,
  CheckCircle,
  Dice5,
  Sparkles,
  Medal,
  ChevronRight,
  UserPlus,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ChampionshipViewProps {
  championshipId: string;
  currentUser: User | null;
  users?: User[];
  currentSimulatedDate: string;
  onSelectRound: (roundId: string) => void;
  onBack: () => void;
}

export function ChampionshipView({
  championshipId,
  currentUser,
  users = [],
  currentSimulatedDate,
  onSelectRound,
  onBack
}: ChampionshipViewProps) {
  const { toast } = useToast();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const fetchChamp = async () => {
    try {
      const res = await fetch(`/api/championships/${championshipId}`);
      if (!res.ok) {
        onBack();
        return;
      }
      const data = await res.json();
      setChamp(data);
      setRounds(data.rounds || []);
    } catch (err) {
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamp();
  }, [championshipId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400 text-xs">Carregando classificação do campeonato...</p>
      </div>
    );
  }

  if (!champ) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Campeonato não encontrado.</p>
        <button onClick={onBack} className="mt-4 text-emerald-400 text-xs underline">Voltar</button>
      </div>
    );
  }

  const handleAddParticipant = async (targetUserId: string) => {
    if (!targetUserId) return;
    setAddingUserId(targetUserId);
    try {
      const res = await fetch(`/api/championships/${championshipId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar competidor');
      toast.success('Competidor adicionado com sucesso ao campeonato!');
      setIsAddUserModalOpen(false);
      await fetchChamp();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar competidor');
    } finally {
      setAddingUserId(null);
    }
  };

  const participantUserIds = new Set((champ?.participants || []).map(p => p.user_id));
  const availableUsersToAdd = users.filter(u => !participantUserIds.has(u.id));

  // Ordena participantes por pontuação total decrescente
  const sortedParticipants = [...(champ?.participants || [])].sort(
    (a, b) => (b.total_score || 0) - (a.total_score || 0)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                {champ.status === 'finished' ? 'Campeonato Finalizado' : 'Em Andamento'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {champ.participants?.length || 0} Participantes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{champ.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {champ.total_rounds} Partidas programadas • 20 Enigmas por partida (+1 por acerto)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="text-xs px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              title="Adicionar competidor no meio do campeonato"
            >
              <UserPlus className="w-3.5 h-3.5" /> Adicionar Competidor
            </button>
            <button
              onClick={onBack}
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
            >
              Ver Campeonatos
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1 & 2: Cronograma das Rodadas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Cronograma de Partidas
            </h3>
            <span className="text-xs text-slate-400">
              Hoje no sistema: <strong className="text-slate-200">{currentSimulatedDate}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {rounds.map((r) => {
              const isLocked = r.scheduled_date > currentSimulatedDate;
              const isToday = r.scheduled_date === currentSimulatedDate;
              const isClosed = r.status === 'closed';
              const isOpen = r.status === 'open';
              const isPendingTheme = r.status === 'pending_theme';

              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRound(r.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isOpen
                      ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/5 hover:border-emerald-400'
                      : isToday && isPendingTheme
                      ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                      : isClosed
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-90'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isClosed
                        ? 'bg-slate-800 text-slate-400'
                        : isOpen
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : isToday
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      #{r.round_number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          Rodada #{r.round_number}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          ({r.scheduled_date})
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        {isClosed ? (
                          <span className="text-slate-400">🏁 Partida Finalizada • Tema: <strong className="text-slate-300">{r.theme || 'Geral'}</strong></span>
                        ) : isOpen ? (
                          <span className="text-emerald-400 font-semibold">🟢 Aberta para Jogar! • Tema: {r.theme}</span>
                        ) : isToday ? (
                          <span className="text-amber-300 font-semibold">🎲 É Hoje! Aguardando definição do tema</span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Abre apenas em {r.scheduled_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isOpen
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          : isToday
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isOpen ? 'Jogar Agora' : isToday ? 'Acessar Sorteio' : isClosed ? 'Ver Resultados' : 'Detalhes'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 3: Tabela de Classificação Geral (Leaderboard) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Tabela de Classificação
            </h3>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="text-xs px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> + Convidar
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <p className="text-[11px] text-slate-400 mb-3 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <span>🔒</span> Os pontos da rodada de hoje só aparecem no ranking no dia seguinte após o encerramento.
            </p>
            <div className="space-y-2.5">
              {sortedParticipants.map((p, index) => {
                const user = p.user;
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                const isCurrentUser = user?.id === currentUser?.id;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isCurrentUser
                        ? 'bg-emerald-950/30 border-emerald-600/50'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center text-xs font-extrabold ${
                        isFirst ? 'text-amber-400' : isSecond ? 'text-slate-300' : isThird ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `${index + 1}º`}
                      </span>

                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{ backgroundColor: user?.avatar_color || '#10b981' }}
                      >
                        {user?.name.charAt(0)}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {user?.name} {isCurrentUser ? '(Você)' : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.has_chosen_theme ? '✓ Já escolheu tema' : '• Não escolheu tema ainda'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400">
                        {p.total_score || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Adicionar Competidor no Meio do Campeonato */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Adicionar Competidor</h3>
                <p className="text-xs text-slate-400">Inscrever jogador no campeonato em andamento</p>
              </div>
            </div>

            {/* Aviso das Regras de Ingresso */}
            <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200/90 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-300">
                <span>⚡</span> Regras de entrada no meio da competição:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                <li>O jogador inicia com <strong>0 pontos</strong> no Ranking Geral.</li>
                <li>Ele continuará a partir da <strong>rodada em que todos estiverem</strong>.</li>
                <li><strong>Não poderá responder rodadas já finalizadas</strong>.</li>
              </ul>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableUsersToAdd.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Todos os usuários cadastrados já participam deste campeonato.
                </div>
              ) : (
                availableUsersToAdd.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
                        style={{ backgroundColor: u.avatar_color || '#10b981' }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddParticipant(u.id)}
                      disabled={addingUserId === u.id}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                    >
                      {addingUserId === u.id ? 'Adicionando...' : 'Adicionar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
