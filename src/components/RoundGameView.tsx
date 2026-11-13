'use client';

import React, { useState, useEffect } from 'react';
import { Round, RoundQuestion, PlayerRoundSubmission, User, ChampionshipParticipant } from '@/types/game';
import { checkAnswer, generatePatternHint } from '@/lib/ditloidEngine';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Calendar,
  HelpCircle,
  Dice5,
  Send,
  Flag,
  UserCheck,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/Toast';

interface RoundGameViewProps {
  roundId: string;
  currentUser: User | null;
  users: User[];
  currentSimulatedDate: string;
  onSetDate: (date: string) => void;
  onBack: () => void;
}

export function RoundGameView({
  roundId,
  currentUser,
  users,
  currentSimulatedDate,
  onSetDate,
  onBack
}: RoundGameViewProps) {
  const { toast, confirm: confirmModal } = useToast();
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<Round | null>(null);
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [userSubmission, setUserSubmission] = useState<PlayerRoundSubmission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<PlayerRoundSubmission[]>([]);
  const [participants, setParticipants] = useState<ChampionshipParticipant[]>([]);

  // Estado local das respostas do jogador atual
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [savedBadge, setSavedBadge] = useState<boolean>(false);
  const [chosenThemeInput, setChosenThemeInput] = useState('');
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({});

  // 1. Carregamento instantâneo via localStorage na inicialização para evitar qualquer atraso visual
  useEffect(() => {
    if (!currentUser) return;
    try {
      const storageKey = `gametrevo_answers_${roundId}_${currentUser.id}`;
      const localStr = localStorage.getItem(storageKey);
      if (localStr) {
        const parsed = JSON.parse(localStr);
        if (parsed && typeof parsed === 'object') {
          setAnswers(prev => ({ ...parsed, ...prev }));
        }
      }
    } catch {}
  }, [roundId, currentUser?.id]);

  const fetchRound = async () => {
    try {
      const url = `/api/rounds/${roundId}${currentUser ? `?userId=${currentUser.id}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        onBack();
        return;
      }
      const data = await res.json();

      setRound(data.round);
      const roundQuestions: RoundQuestion[] = data.questions || [];
      setQuestions(roundQuestions);
      setUserSubmission(data.userSubmission || null);
      setAllSubmissions(data.allSubmissions || []);
      setParticipants(data.participants || []);

      // Se já houver respostas do usuário salvas no banco de dados, carregar e restaurar
      const loaded: Record<string, string> = {};
      const corrects: Record<string, boolean> = {};

      if (data.userSubmission?.answers) {
        const rawAnswers = typeof data.userSubmission.answers === 'string'
          ? JSON.parse(data.userSubmission.answers)
          : data.userSubmission.answers;

        for (const [qid, val] of Object.entries(rawAnswers as Record<string, any>)) {
          const ansText = typeof val === 'object' && val !== null ? (val.userAnswer || '') : String(val || '');
          if (ansText) loaded[qid] = ansText;
          if (typeof val === 'object' && val !== null && val.isCorrect) {
            corrects[qid] = true;
          }
        }
      }

      // Mescla com cache local de redundância
      if (currentUser) {
        try {
          const storageKey = `gametrevo_answers_${roundId}_${currentUser.id}`;
          const localStr = localStorage.getItem(storageKey);
          if (localStr) {
            const localObj = JSON.parse(localStr);
            for (const [qid, val] of Object.entries(localObj as Record<string, string>)) {
              if (!loaded[qid] && val) loaded[qid] = val;
            }
          }
        } catch {}
      }

      // Validação em lote das respostas carregadas com as questões para garantir estado correto e verde
      roundQuestions.forEach(q => {
        const ans = loaded[q.id];
        if (ans && checkAnswer(ans, q.answer)) {
          corrects[q.id] = true;
        }
      });

      setAnswers(loaded);
      setCorrectMap(corrects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRound();
  }, [roundId, currentUser?.id]);

  // Sorteia quem escolhe o tema
  const handleDrawSelector = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/rounds/${roundId}/draw-selector`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro no sorteio');
      toast.success('Jogador sorteado com sucesso!');
      await fetchRound();
    } catch (err: any) {
      toast.error(err.message || 'Erro no sorteio');
    } finally {
      setActionLoading(false);
    }
  };

  // Define o tema e gera os 20 Ditloids
  const handleSetTheme = async (themeName: string) => {
    if (!currentUser) return;
    const finalTheme = themeName.trim();
    if (!finalTheme) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/rounds/${roundId}/set-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, theme: finalTheme })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao definir tema');
      }
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success(`Tema "${finalTheme}" definido! 20 Ditloids liberados.`);
      await fetchRound();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao definir tema');
    } finally {
      setActionLoading(false);
    }
  };

  // Auto-save em background no banco de dados no exato momento do acerto
  const autoSaveAnswer = async (updatedAnswers: Record<string, string>) => {
    if (!currentUser) return;
    try {
      setSavedBadge(true);
      await fetch(`/api/rounds/${roundId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          answers: updatedAnswers,
          isCompleted: false
        })
      });
      setTimeout(() => setSavedBadge(false), 3000);
    } catch (e) {
      console.warn('Erro ao salvar em background no banco:', e);
    }
  };

  // Atualiza resposta de um Ditloid individual com validação em tempo real!
  const handleAnswerChange = (questionId: string, val: string) => {
    const updated = { ...answers, [questionId]: val };
    setAnswers(updated);

    // Persistência local imediata para segurança contra desconexões
    if (currentUser) {
      try {
        localStorage.setItem(`gametrevo_answers_${roundId}_${currentUser.id}`, JSON.stringify(updated));
      } catch {}
    }

    const q = questions.find(item => item.id === questionId);
    if (!q || correctMap[questionId]) return;

    // VALIDAÇÃO INSTANTÂNEA EM TEMPO REAL ENQUANTO DIGITA
    if (checkAnswer(val, q.answer)) {
      setCorrectMap(prev => ({ ...prev, [questionId]: true }));
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
      // PERSISTE NO BANCO DE DADOS NO MOMENTO EXATO QUE ACERTA
      autoSaveAnswer(updated);
    }
  };

  // Envia as respostas para cálculo de pontuação (+1 por acerto)
  const handleSubmitAnswers = async (complete: boolean = false) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rounds/${roundId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          answers,
          isCompleted: complete
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar respostas');

      if (data.score >= 15) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      }

      if (complete) {
        toast.success('Partida finalizada! Suas respostas foram salvas com sucesso.');
      } else {
        toast.info('Respostas conferidas e salvas no banco!');
      }

      await fetchRound();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar respostas');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Encerra a rodada do dia e consolida os pontos no ranking do campeonato
  const handleCloseRound = () => {
    confirmModal({
      title: 'Encerrar e Consolidar Rodada',
      message: 'Deseja encerrar esta partida e consolidar as pontuações no Ranking Geral? A névoa de guerra será suspensa e as pontuações de todos os competidores nesta rodada serão reveladas.',
      confirmText: 'Sim, Encerrar Rodada',
      cancelText: 'Cancelar',
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/rounds/${roundId}/close`, { method: 'POST' });
          if (!res.ok) throw new Error('Erro ao encerrar rodada');
          confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
          toast.success('Rodada encerrada! Ranking geral consolidado com sucesso.');
          await fetchRound();
        } catch (err: any) {
          toast.error(err.message || 'Erro ao encerrar rodada');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400 text-xs">Carregando dados da partida...</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Partida não encontrada.</p>
        <button onClick={onBack} className="mt-4 text-emerald-400 text-xs underline">Voltar</button>
      </div>
    );
  }

  const isLockedByDate = round.scheduled_date > currentSimulatedDate;
  const isMatchDay = round.scheduled_date === currentSimulatedDate;
  const isPastDate = round.scheduled_date < currentSimulatedDate;
  const isThemeSelectorDrawn = Boolean(round.theme_selector_id);
  const isCurrentUserSelector = currentUser?.id === round.theme_selector_id;
  const selectorUser = users.find(u => u.id === round.theme_selector_id) || round.selector;
  const isMatchOpen = round.status === 'open';
  const isMatchClosed = round.status === 'closed';
  const isRoundFinalized = isMatchClosed || isPastDate;

  const liveScore = Math.max(userSubmission?.score ?? 0, Object.values(correctMap).filter(Boolean).length);
  const isCompleted = userSubmission?.is_completed ?? false;

  return (
    <div className="space-y-6">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Campeonato
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Data Agendada: <strong className="text-slate-100">{round.scheduled_date}</strong>
          </span>

          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            isMatchClosed
              ? 'bg-slate-800 text-slate-400 border-slate-700'
              : isMatchOpen
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isMatchClosed ? '🏁 Encerrada' : isMatchOpen ? '🟢 Aberta' : '⏳ Aguardando Início'}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                Partida #{round.round_number}
              </span>
              {round.theme && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Tema: {round.theme}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white">Desafio dos 20 Ditloids</h2>
            <p className="text-xs text-slate-400 mt-1">
              Regra oficial: Cada enigma decifrado = <strong className="text-emerald-400">+1 Ponto</strong> (Pontuação máxima: 20 pontos).
            </p>
          </div>

          {/* Score Pill if open or completed */}
          {(isMatchOpen || isMatchClosed) && currentUser && (
            <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Sua Pontuação</span>
                <span className="text-2xl font-black text-emerald-400 leading-tight">
                  {liveScore} <span className="text-xs text-slate-500 font-normal">/ 20</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CASE 1: MATCH LOCKED BY DATE */}
      {isLockedByDate && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Partida Bloqueada</h3>
            <p className="text-xs text-slate-400 mt-1">
              Esta partida só é liberada na sua data oficial ({round.scheduled_date}). Hoje no sistema é {currentSimulatedDate}.
            </p>
          </div>
          <button
            onClick={() => onSetDate(round.scheduled_date)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Avançar data do sistema para {round.scheduled_date} (Testar)
          </button>
        </div>
      )}

      {/* CASE 2: MATCH DAY ARRIVED, BUT THEME SELECTOR NOT DRAWN YET */}
      {!isLockedByDate && !isThemeSelectorDrawn && !isMatchClosed && (
        <div className="bg-slate-900 border border-indigo-900/50 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-bounce">
            <Dice5 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">Hora do Sorteio do Tema!</h3>
            <p className="text-xs text-slate-400 mt-1">
              O dia da partida começou. O sistema irá sortear um dos participantes da liga para definir o tema dos 20 enigmas.
            </p>
          </div>
          <button
            onClick={handleDrawSelector}
            disabled={actionLoading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {actionLoading ? 'Sorteando...' : '🎲 Sortear Jogador da Rodada'}
          </button>
        </div>
      )}

      {/* CASE 3: THEME SELECTOR DRAWN, BUT THEME NOT YET DEFINED */}
      {!isLockedByDate && isThemeSelectorDrawn && round.status === 'pending_theme' && (
        <div className="space-y-4">
          {isCurrentUserSelector ? (
            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-700/60 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Parabéns! Você foi o sorteado de hoje!</h3>
                  <p className="text-xs text-slate-300">
                    Defina o tema da rodada. O sistema gerará automaticamente os 20 Ditloids correspondentes.
                  </p>
                </div>
              </div>

              {/* Sugestões rápidas de temas */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Sugestões de temas pré-cadastrados (Com 20 enigmas prontos)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Futebol e Esportes',
                    'Cinema, Música e Séries',
                    'Geografia e História',
                    'Geral e Cotidiano'
                  ].map(t => (
                    <button
                      key={t}
                      onClick={() => handleSetTheme(t)}
                      disabled={actionLoading}
                      className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition text-left"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema customizado */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ou digite um tema livre personalizado:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chosenThemeInput}
                    onChange={(e) => setChosenThemeInput(e.target.value)}
                    placeholder="Ex: Fórmula 1, Animes, Quadrinhos..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleSetTheme(chosenThemeInput)}
                    disabled={actionLoading || !chosenThemeInput.trim()}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Gerando 20 Ditloids...' : 'Gerar Desafio'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-base shadow" style={{ backgroundColor: selectorUser?.avatar_color || '#6366f1' }}>
                {selectorUser?.name?.charAt(0) || '?'}
              </div>
              <h3 className="text-base font-bold text-white">
                O jogador sorteado foi: <span className="text-emerald-400">{selectorUser?.name}</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aguardando {selectorUser?.name} escolher o tema da partida de hoje para liberar os 20 Ditloids.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CASE 4: MATCH IS OPEN OR CLOSED -> THE 20 DITLOIDS ARE AVAILABLE */}
      {(isMatchOpen || isMatchClosed) && (
        <div className="space-y-6">

          {/* Progress & Submit Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Progresso dos 20 Enigmas</span>
                  {savedBadge && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono animate-pulse">
                      ● Salvo no banco de dados
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-bold">{liveScore} / 20 acertados</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${(liveScore / 20) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isRoundFinalized && (
                <>
                  <button
                    onClick={() => handleSubmitAnswers(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Respostas'}
                  </button>
                  <button
                    onClick={() => handleSubmitAnswers(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-emerald-500/20"
                  >
                    Finalizar Minha Partida
                  </button>
                </>
              )}

              {/* Fechamento da rodada */}
              {!isRoundFinalized && (
                <button
                  onClick={handleCloseRound}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-amber-500/20"
                  title="Encerra a rodada e consolida as pontuações no Ranking Geral"
                >
                  <Flag className="w-3.5 h-3.5 inline mr-1" />
                  Encerrar Rodada
                </button>
              )}
            </div>
          </div>

          {/* Banner de Rodada Finalizada (Regra de não responder rodadas já encerradas) */}
          {isRoundFinalized && (
            <div className="p-3.5 bg-slate-900 border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex items-center gap-3 shadow-md">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="text-amber-300">Partida Finalizada:</strong> Esta rodada já foi concluída e não aceita mais novas respostas. Competidores que ingressaram no campeonato continuam a partir da rodada atual em diante.
              </div>
            </div>
          )}

          {/* 20 Ditloids Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q) => {
              const isCorrect = Boolean(correctMap[q.id]);
              const isHintVisible = showHintMap[q.id];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      #{q.question_index} de 20
                    </span>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ✅ Correto (+1 Ponto)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">1 Ponto</span>
                    )}
                  </div>

                  {/* Ditloid Enigma */}
                  <div className={`text-xl font-black tracking-wide font-mono mb-2 transition-colors ${
                    isCorrect ? 'text-emerald-300' : 'text-white'
                  }`}>
                    {q.enigma}
                  </div>

                  {/* Hint Toggle */}
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowHintMap(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      {isHintVisible ? 'Esconder Dica' : 'Ver Dica (Tamanho das Palavras)'}
                    </button>
                    {isHintVisible && (
                      <div className="mt-1.5 p-2 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Dica:</span>
                        <code className="text-xs font-mono font-bold tracking-wider text-amber-300 select-all">
                          {generatePatternHint(q.answer)}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Answer Input */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      disabled={isRoundFinalized || isCorrect}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={isRoundFinalized ? "Partida finalizada (Bloqueada para respostas)" : "Qual é a resposta completa?"}
                      className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                        isCorrect
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/50'
                          : isRoundFinalized
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-600 focus:border-emerald-500'
                      }`}
                    />
                    {isCorrect ? (
                      <div className="p-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    ) : !isRoundFinalized && (
                      <button
                        onClick={() => handleSubmitAnswers(false)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                        title="Verificar"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Show answer if match closed */}
                  {isMatchClosed && !isCorrect && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg">
                      Resposta oficial: <strong className="text-emerald-400">{q.answer}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submissions Table for this Round */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" /> Desempenho dos Participantes na Partida #{round.round_number}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Jogador</th>
                    <th className="py-2 px-3">Acertos</th>
                    <th className="py-2 px-3">Pontuação na Partida</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map(p => {
                    const sub = allSubmissions.find(s => s.user_id === p.user_id);
                    const user = p.user;
                    const isCurrentUser = user?.id === currentUser?.id;

                    return (
                      <tr key={p.id} className={isCurrentUser ? 'bg-emerald-950/20 font-semibold' : ''}>
                        <td className="py-2.5 px-3 flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: user?.avatar_color || '#10b981' }}
                          >
                            {user?.name.charAt(0)}
                          </div>
                          <span className="text-slate-200">{user?.name} {isCurrentUser ? '(Você)' : ''}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {isCurrentUser ? (
                            <strong className="text-emerald-400">{sub ? `${sub.score} / 20` : '0 / 20'}</strong>
                          ) : isMatchClosed ? (
                            <span>{sub ? `${sub.score} / 20` : '0 / 20'}</span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                              <Lock className="w-3 h-3 text-slate-500" /> Oculto até amanhã
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isCurrentUser ? (
                            <span className="font-bold text-emerald-400">
                              +{sub?.score || 0} pts
                            </span>
                          ) : isMatchClosed ? (
                            <span className="font-bold text-emerald-400">
                              +{sub?.score || 0} pts
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              🔒 Em sigilo
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {sub?.is_completed ? (
                            <span className="text-emerald-400">Finalizada</span>
                          ) : sub ? (
                            <span className="text-amber-400">Em andamento</span>
                          ) : (
                            <span className="text-slate-500">Ainda não jogou</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
