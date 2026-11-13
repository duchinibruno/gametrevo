'use client';

import React, { useState, useEffect } from 'react';
import { User, Championship } from '@/types/game';
import { Navbar } from '@/components/Navbar';
import { AuthScreen } from '@/components/AuthScreen';
import { NewChampionshipModal } from '@/components/NewChampionshipModal';
import { ChampionshipView } from '@/components/ChampionshipView';
import { RoundGameView } from '@/components/RoundGameView';
import {
  Trophy,
  Plus,
  Clover,
  Calendar,
  Users,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Gamepad2,
  Lock
} from 'lucide-react';

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegação
  const [activeChampionshipId, setActiveChampionshipId] = useState<string | null>(null);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);

  const handleSelectRound = (rId: string | null) => {
    setActiveRoundId(rId);
    if (rId) {
      localStorage.setItem('gametrevo_active_round', rId);
    } else {
      localStorage.removeItem('gametrevo_active_round');
    }
  };

  const handleSelectChampionship = (champId: string | null) => {
    setActiveChampionshipId(champId);
    if (champId) {
      localStorage.setItem('gametrevo_active_champ', champId);
    } else {
      localStorage.removeItem('gametrevo_active_champ');
    }
  };

  // Modais
  const [isNewChampModalOpen, setIsNewChampModalOpen] = useState(false);

  // Data atual da simulação
  const [simulatedDate, setSimulatedDate] = useState<string>('2026-11-13');

  const loadData = async (userToUse?: User | null) => {
    try {
      let activeUser = userToUse !== undefined ? userToUse : currentUser;

      // 1. Lista de Usuários cadastrados (para criar campeonatos e adicionar membros)
      const userRes = await fetch('/api/users');
      const userData: User[] = await userRes.json();
      setUsers(userData || []);

      // 2. Reconciliação de integridade da sessão do usuário
      // Se activeUser for um ID mock antigo (ex: "user-1794..."), sincroniza com o UUID real do Supabase
      if (activeUser && activeUser.id.startsWith('user-') && userData.length > 0) {
        const real = userData.find(
          u => u.email.toLowerCase() === activeUser?.email.toLowerCase() ||
               u.name.toLowerCase() === activeUser?.name.toLowerCase()
        );
        if (real) {
          activeUser = real;
          setCurrentUser(real);
          localStorage.setItem('gametrevo_user', JSON.stringify(real));
        } else {
          localStorage.removeItem('gametrevo_user');
          setCurrentUser(null);
          activeUser = null;
        }
      }

      // 3. Campeonatos associados a este usuário
      if (activeUser) {
        const champRes = await fetch(`/api/championships?userId=${activeUser.id}`);
        const champData = await champRes.json();
        setChampionships(champData || []);

        if (champData?.length > 0 && !activeChampionshipId) {
          setActiveChampionshipId(champData[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      setSimulatedDate(today);

      const savedUserStr = localStorage.getItem('gametrevo_user');
      const savedChamp = localStorage.getItem('gametrevo_active_champ');
      const savedRound = localStorage.getItem('gametrevo_active_round');

      if (savedChamp) setActiveChampionshipId(savedChamp);
      if (savedRound) setActiveRoundId(savedRound);

      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        setCurrentUser(savedUser);
        loadData(savedUser);
      } else {
        loadData(null);
      }
    } catch {
      loadData(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('gametrevo_user');
    localStorage.removeItem('gametrevo_active_champ');
    localStorage.removeItem('gametrevo_active_round');
    setCurrentUser(null);
    setActiveChampionshipId(null);
    setActiveRoundId(null);
  };

  const handleChampionshipCreated = async (id: string) => {
    await loadData(currentUser);
    handleSelectChampionship(id);
    handleSelectRound(null);
  };

  // Se ainda não verificou a sessão local
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // TELA DE LOGIN & CADASTRO (Se o jogador não estiver logado)
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Carregando GameTrevo...</p>
          </div>
        ) : activeRoundId ? (
          /* TELA 3: ÁREA DA PARTIDA (OS 20 DITLOIDS DO DIA) */
          <RoundGameView
            roundId={activeRoundId}
            currentUser={currentUser}
            users={users}
            currentSimulatedDate={simulatedDate}
            onSetDate={setSimulatedDate}
            onBack={() => {
              handleSelectRound(null);
              loadData();
            }}
          />
        ) : activeChampionshipId ? (
          /* TELA 2: DETALHES DO CAMPEONATO & CLASSIFICAÇÃO */
          <ChampionshipView
            championshipId={activeChampionshipId}
            currentUser={currentUser}
            users={users}
            currentSimulatedDate={simulatedDate}
            onSelectRound={(rId) => handleSelectRound(rId)}
            onBack={() => handleSelectChampionship(null)}
          />
        ) : (
          /* TELA 1: LISTA GERAL DE CAMPEONATOS & HERO */
          <div className="space-y-8">
            
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-900/40 p-8 sm:p-10 shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-4">
                  <Clover className="w-4 h-4 fill-emerald-400" /> Competição Diária de Ditloids
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Descubra os <span className="text-emerald-400">20 enigmas</span> do dia e lidere o ranking.
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Crie campeonatos, sorteie os temas diários entre os participantes, resolva enigmas de letras e números (como <em>"7 D na S = 7 Dias na Semana"</em>) e dispute ponto a ponto.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsNewChampModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" /> Criar Novo Campeonato
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Campeonatos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Campeonatos Ativos
                </h2>
                <button
                  onClick={() => setIsNewChampModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>
              </div>

              {championships.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-300">Nenhum campeonato criado ainda</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Crie o primeiro campeonato para reunir seus amigos e começar a competição de Ditloids!
                  </p>
                  <button
                    onClick={() => setIsNewChampModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    Criar Meu Primeiro Campeonato
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {championships.map((c) => {
                    const totalParticipants = c.participants?.length || 0;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChampionship(c.id)}
                        className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 p-5 rounded-2xl cursor-pointer transition group shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                              {c.total_rounds} Partidas
                            </span>
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {totalParticipants} jogadores
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                            {c.title}
                          </h3>
                        </div>

                        <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>Acessar Tabela & Jogos</span>
                          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Modais */}
      <NewChampionshipModal
        isOpen={isNewChampModalOpen}
        onClose={() => setIsNewChampModalOpen(false)}
        currentUser={currentUser}
        users={users}
        currentDate={simulatedDate}
        onCreated={handleChampionshipCreated}
      />
    </div>
  );
}
