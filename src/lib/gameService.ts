import { supabase, isSupabaseConfigured } from './supabase';
import { User, Championship, ChampionshipParticipant, Round, RoundQuestion, PlayerRoundSubmission } from '@/types/game';
import { generate20Ditloids, checkAnswer } from './ditloidEngine';
import bcrypt from 'bcryptjs';

export interface UserRecord extends User {
  password_hash: string;
}

// Memória local para fallback (sem usuários testes falsos)
let mockUsers: UserRecord[] = [];
let mockChampionships: Championship[] = [];
let mockParticipants: ChampionshipParticipant[] = [];
let mockRounds: Round[] = [];
let mockQuestions: RoundQuestion[] = [];
let mockSubmissions: PlayerRoundSubmission[] = [];

// ================= USERS & AUTH =================
export async function getUsers(): Promise<User[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('users').select('id, name, email, avatar_color, created_at').order('name');
      if (!error && data) return data;
    } catch {}
  }
  return mockUsers.map(u => ({ id: u.id, name: u.name, email: u.email, avatar_color: u.avatar_color, created_at: u.created_at }));
}

export async function registerUser(params: { name: string; email: string; password: string; avatarColor?: string }): Promise<User> {
  const { name, email, password, avatarColor } = params;
  const normalizedEmail = email.toLowerCase().trim();
  const password_hash = await bcrypt.hash(password, 10);
  const color = avatarColor || '#10b981';

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
      if (existing) {
        throw new Error('Já existe um usuário cadastrado com este e-mail.');
      }
      const { data, error } = await supabase.from('users').insert({
        name,
        email: normalizedEmail,
        password_hash,
        avatar_color: color
      }).select('id, name, email, avatar_color, created_at').single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      if (e.message?.includes('Já existe')) throw e;
      console.warn('Supabase não inicializado, usando mock para cadastro:', e);
    }
  }

  // Mock
  if (mockUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }
  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    name,
    email: normalizedEmail,
    password_hash,
    avatar_color: color,
    created_at: new Date().toISOString()
  };
  mockUsers.push(newUser);
  return { id: newUser.id, name: newUser.name, email: newUser.email, avatar_color: newUser.avatar_color, created_at: newUser.created_at };
}

export async function loginUser(identifier: string, password: string): Promise<User> {
  const cleanIdentifier = (identifier || '').trim();
  const normalized = cleanIdentifier.toLowerCase();

  if (isSupabaseConfigured) {
    try {
      let foundUser: any = null;

      // 1. Tenta buscar por e-mail (case-insensitive)
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalized)
        .maybeSingle();

      if (userByEmail) {
        foundUser = userByEmail;
      } else {
        // 2. Tenta buscar por nome de usuário / apelido (case-insensitive)
        const { data: userByName } = await supabase
          .from('users')
          .select('*')
          .ilike('name', cleanIdentifier)
          .maybeSingle();

        if (userByName) {
          foundUser = userByName;
        }
      }

      if (foundUser) {
        const isMatch = await bcrypt.compare(password, foundUser.password_hash);
        if (!isMatch) throw new Error('Usuário ou senha incorretos.');
        return {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar_color: foundUser.avatar_color,
          created_at: foundUser.created_at
        };
      }
    } catch (e: any) {
      if (e.message?.includes('incorretos')) throw e;
      console.warn('Supabase login fallback:', e);
    }
  }

  // Fallback Mock: busca tanto por e-mail quanto por nome de usuário
  const user = mockUsers.find(
    u => u.email.toLowerCase() === normalized || u.name.toLowerCase() === normalized
  );
  if (!user) throw new Error('Usuário ou senha incorretos.');
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error('Usuário ou senha incorretos.');

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_color: user.avatar_color,
    created_at: user.created_at
  };
}

export async function createUser(name: string, avatarColor?: string): Promise<User> {
  return registerUser({ name, email: `${name.toLowerCase().replace(/\s+/g, '')}@gametrevo.com`, password: '123' });
}

// ================= CAMPEONATOS =================
// Apenas retorna campeonatos onde o usuário é criador ou participante
export async function getChampionships(userId?: string): Promise<Championship[]> {
  let list: Championship[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select(`
          *,
          participants:championship_participants(
            *,
            user:users(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        list = data;
      }
    } catch {}
  }

  if (list.length === 0) {
    list = mockChampionships.map(c => ({
      ...c,
      participants: mockParticipants
        .filter(p => p.championship_id === c.id)
        .map(p => ({
          ...p,
          user: mockUsers.find(u => u.id === p.user_id)
        }))
    }));
  }

  // Filtragem de privacidade: o usuário só vê os campeonatos aos quais está associado!
  if (userId) {
    return list.filter(c => {
      const isCreator = c.creator_id === userId;
      const isParticipant = c.participants?.some(p => p.user_id === userId);
      return isCreator || isParticipant;
    });
  }

  return list;
}

export async function getChampionshipById(id: string): Promise<Championship | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select(`
          *,
          participants:championship_participants(
            *,
            user:users(*)
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch {}
  }

  let champ = mockChampionships.find(c => c.id === id);
  // Se o ID for de uma sessão anterior reiniciada, pega o primeiro campeonato disponível
  if (!champ && mockChampionships.length > 0) {
    champ = mockChampionships[0];
  }
  if (!champ) return null;
  return {
    ...champ,
    participants: mockParticipants
      .filter(p => p.championship_id === champ.id)
      .map(p => ({
        ...p,
        user: mockUsers.find(u => u.id === p.user_id)
      }))
  };
}

export async function createChampionship(params: {
  title: string;
  creatorId: string;
  totalRounds: number;
  dates: string[]; // YYYY-MM-DD para cada rodada
  participantIds: string[];
}): Promise<{ championshipId: string }> {
  const { title, creatorId, totalRounds, dates, participantIds } = params;
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  if (isSupabaseConfigured) {
    try {
      let finalCreatorId = creatorId;

      // Se creatorId não for UUID (ex: sessão antiga), busca o UUID real do usuário no banco
      if (!isUuid(finalCreatorId)) {
        const mockU = mockUsers.find(u => u.id === creatorId);
        if (mockU) {
          const { data: realU } = await supabase
            .from('users')
            .select('id')
            .ilike('email', mockU.email.toLowerCase())
            .maybeSingle();
          if (realU?.id) finalCreatorId = realU.id;
        }
      }

      // Se ainda não for UUID válido, busca o primeiro usuário do Supabase
      if (!isUuid(finalCreatorId)) {
        const { data: firstUser } = await supabase.from('users').select('id').limit(1).maybeSingle();
        if (firstUser?.id) finalCreatorId = firstUser.id;
      }

      // 1. Inserir Campeonato no Supabase
      const { data: champ, error: champErr } = await supabase
        .from('championships')
        .insert({
          title,
          creator_id: isUuid(finalCreatorId) ? finalCreatorId : null,
          total_rounds: totalRounds,
          status: 'active'
        })
        .select()
        .single();

      if (champErr) {
        console.error('Erro ao salvar campeonato no Supabase:', champErr);
        throw new Error(`Erro ao persistir campeonato no banco: ${champErr.message}`);
      }

      if (champ) {
        // 2. Inserir Participantes (garante que inclui o criador e apenas UUIDs válidos)
        const allUserIds = Array.from(new Set([
          ...participantIds,
          finalCreatorId
        ])).filter(isUuid);

        const participantsData = allUserIds.map(uid => ({
          championship_id: champ.id,
          user_id: uid,
          total_score: 0,
          has_chosen_theme: false
        }));

        if (participantsData.length > 0) {
          const { error: partErr } = await supabase.from('championship_participants').insert(participantsData);
          if (partErr) console.error('Erro ao inserir participantes:', partErr);
        }

        // 3. Inserir Rodadas Agendadas
        const roundsData = dates.map((d, index) => ({
          championship_id: champ.id,
          round_number: index + 1,
          scheduled_date: d,
          status: 'pending_theme'
        }));

        const { error: roundErr } = await supabase.from('rounds').insert(roundsData);
        if (roundErr) console.error('Erro ao inserir rodadas:', roundErr);

        return { championshipId: champ.id };
      }
    } catch (e: any) {
      console.error('Falha de persistência no Supabase:', e);
      throw e;
    }
  }

  // Fallback Mock (cria instantaneamente em memória para não travar o teste)
  const champId = `champ-${Date.now()}`;
  const newChamp: Championship = {
    id: champId,
    title,
    creator_id: creatorId,
    total_rounds: totalRounds,
    status: 'active',
    created_at: new Date().toISOString()
  };
  mockChampionships.unshift(newChamp);

  participantIds.forEach(uid => {
    mockParticipants.push({
      id: `part-${Date.now()}-${uid}`,
      championship_id: champId,
      user_id: uid,
      total_score: 0,
      has_chosen_theme: false
    });
  });

  dates.forEach((d, idx) => {
    mockRounds.push({
      id: `round-${Date.now()}-${idx + 1}`,
      championship_id: champId,
      round_number: idx + 1,
      scheduled_date: d,
      status: 'pending_theme'
    });
  });

  return { championshipId: champId };
}

// Adiciona um competidor a um campeonato em andamento
export async function addParticipantToChampionship(
  championshipId: string,
  userId: string
): Promise<ChampionshipParticipant> {
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isUuid.test(championshipId) && isUuid.test(userId)) {
        // Verifica se já está inscrito
        const { data: existing } = await supabase
          .from('championship_participants')
          .select('id')
          .eq('championship_id', championshipId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          throw new Error('Este jogador já participa deste campeonato.');
        }

        const { data: inserted, error: insErr } = await supabase
          .from('championship_participants')
          .insert({
            championship_id: championshipId,
            user_id: userId,
            total_score: 0,
            has_chosen_theme: false
          })
          .select('*, user:users(*)')
          .single();

        if (!insErr && inserted) {
          return inserted;
        }
      }
    } catch (e: any) {
      if (e.message?.includes('já participa')) throw e;
      console.warn('Erro ao inserir participante no Supabase:', e);
    }
  }

  // Fallback Mock
  const existingMock = mockParticipants.find(p => p.championship_id === championshipId && p.user_id === userId);
  if (existingMock) {
    throw new Error('Este jogador já participa deste campeonato.');
  }

  const user = mockUsers.find(u => u.id === userId);
  const newPart: ChampionshipParticipant = {
    id: `part-${Date.now()}-${userId}`,
    championship_id: championshipId,
    user_id: userId,
    total_score: 0,
    has_chosen_theme: false,
    user
  };
  mockParticipants.push(newPart);

  const mockChamp = mockChampionships.find(c => c.id === championshipId);
  if (mockChamp) {
    mockChamp.participants = mockChamp.participants || [];
    mockChamp.participants.push(newPart);
  }

  return newPart;
}

// ================= RODADAS =================
export async function getRoundsByChampionship(championshipId: string): Promise<Round[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('rounds')
      .select(`
        *,
        selector:users(*)
      `)
      .eq('championship_id', championshipId)
      .order('round_number', { ascending: true });

    if (!error && data) return data;
  }

  return mockRounds
    .filter(r => r.championship_id === championshipId)
    .map(r => ({
      ...r,
      selector: mockUsers.find(u => u.id === r.theme_selector_id)
    }))
    .sort((a, b) => a.round_number - b.round_number);
}

export async function getRoundDetails(roundId: string, currentUserId?: string): Promise<{
  round: Round;
  questions: RoundQuestion[];
  userSubmission: PlayerRoundSubmission | null;
  allSubmissions: PlayerRoundSubmission[];
  participants: ChampionshipParticipant[];
}> {
  let round: any = null;
  let questions: RoundQuestion[] = [];
  let userSubmission: PlayerRoundSubmission | null = null;
  let allSubmissions: PlayerRoundSubmission[] = [];
  let participants: ChampionshipParticipant[] = [];

  if (isSupabaseConfigured) {
    const { data: rData } = await supabase
      .from('rounds')
      .select('*, selector:users(*)')
      .eq('id', roundId)
      .single();
    round = rData;

    if (round) {
      const { data: qData } = await supabase
        .from('round_questions')
        .select('*')
        .eq('round_id', roundId)
        .order('question_index', { ascending: true });
      questions = qData || [];

      const { data: subData } = await supabase
        .from('player_round_submissions')
        .select('*, user:users(*)')
        .eq('round_id', roundId);
      allSubmissions = subData || [];

      if (currentUserId) {
        userSubmission = allSubmissions.find(s => s.user_id === currentUserId) || null;
      }
      if (!userSubmission && currentUserId) {
        userSubmission = mockSubmissions.find(s => s.round_id === roundId && s.user_id === currentUserId) || null;
      }

      const { data: partData } = await supabase
        .from('championship_participants')
        .select('*, user:users(*)')
        .eq('championship_id', round.championship_id);
      participants = partData || [];
    }
  }

  if (!round) {
    round = mockRounds.find(r => r.id === roundId);
    if (round) {
      round.selector = mockUsers.find(u => u.id === round.theme_selector_id);
      questions = mockQuestions.filter(q => q.round_id === roundId).sort((a, b) => a.question_index - b.question_index);
      allSubmissions = mockSubmissions
        .filter(s => s.round_id === roundId)
        .map(s => ({ ...s, user: mockUsers.find(u => u.id === s.user_id) }));
      if (currentUserId) {
        userSubmission = allSubmissions.find(s => s.user_id === currentUserId) || null;
      }
      if (!userSubmission && currentUserId) {
        userSubmission = mockSubmissions.find(s => s.round_id === roundId && s.user_id === currentUserId) || null;
      }
      participants = mockParticipants
        .filter(p => p.championship_id === round.championship_id)
        .map(p => ({ ...p, user: mockUsers.find(u => u.id === p.user_id) }));
    }
  }

  // REGRA DE PRIVACIDADE:
  // Durante o dia da partida (enquanto status !== 'closed'), cada jogador SÓ pode ver
  // a sua própria pontuação e acertos. Para todos os outros jogadores, o score fica oculto (-1)
  // e as respostas vazias! Apenas no fechamento da rodada (dia seguinte) os pontos de todos são revelados.
  if (round && round.status !== 'closed') {
    allSubmissions = allSubmissions.map(sub => {
      if (sub.user_id === currentUserId) return sub;
      return {
        ...sub,
        score: -1, // -1 indica pontuação oculta para os demais competidores
        answers: {}
      };
    });
  }

  return { round, questions, userSubmission, allSubmissions, participants };
}

// Sorteia um participante que ainda não escolheu tema para esta rodada
export async function drawThemeSelector(roundId: string): Promise<User | null> {
  const { round, participants } = await getRoundDetails(roundId);
  if (!round) throw new Error('Rodada não encontrada');

  // Já foi sorteado?
  if (round.theme_selector_id) {
    const user = participants.find(p => p.user_id === round.theme_selector_id)?.user;
    if (user) return user;
  }

  // Filtrar participantes que ainda não escolheram tema
  let candidates = participants.filter(p => !p.has_chosen_theme);
  // Se todos já escolheram (ex: mais rodadas que pessoas), reseta a regra para todos
  if (candidates.length === 0) candidates = participants;

  const luckyParticipant = candidates[Math.floor(Math.random() * candidates.length)];
  if (!luckyParticipant) return null;

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('rounds')
        .update({ theme_selector_id: luckyParticipant.user_id })
        .eq('id', roundId);
    } catch {}
  }
  // Sempre atualiza o objeto mock da rodada em memória também
  const mockR = mockRounds.find(r => r.id === roundId);
  if (mockR) mockR.theme_selector_id = luckyParticipant.user_id;

  return luckyParticipant.user || null;
}

// Define o tema e gera os 20 Ditloids
export async function setThemeAndStartMatch(roundId: string, userId: string, theme: string): Promise<RoundQuestion[]> {
  const { round } = await getRoundDetails(roundId);
  if (!round) throw new Error('Rodada não encontrada');

  if (round.theme_selector_id && round.theme_selector_id !== userId) {
    throw new Error('Apenas o jogador sorteado pode definir o tema!');
  }

  // 1. Busca todos os enigmas e respostas já usados nas demais rodadas deste campeonato
  // para garantir que NENHUM enigma se repita, mesmo que participantes diferentes escolham o mesmo tema!
  const usedQuestionsInChamp: { enigma: string; answer: string }[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data: champRounds } = await supabase
        .from('rounds')
        .select('id')
        .eq('championship_id', round.championship_id);

      if (champRounds && champRounds.length > 0) {
        const roundIds = champRounds.map((r: any) => r.id);
        const { data: pastQuestions } = await supabase
          .from('round_questions')
          .select('enigma, answer')
          .in('round_id', roundIds);

        if (pastQuestions) {
          usedQuestionsInChamp.push(...(pastQuestions as any));
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar histórico de perguntas no Supabase:', e);
    }
  }

  // Sincroniza também com o mock em memória
  const mockChampRoundIds = mockRounds
    .filter(r => r.championship_id === round.championship_id)
    .map(r => r.id);
  const mockPastQuestions = mockQuestions.filter(q => mockChampRoundIds.includes(q.round_id));
  for (const q of mockPastQuestions) {
    if (!usedQuestionsInChamp.some(u => u.enigma === q.enigma)) {
      usedQuestionsInChamp.push({ enigma: q.enigma, answer: q.answer });
    }
  }

  // 2. Gerar os 20 Ditloids com exclusão garantida de todas as perguntas já jogadas no campeonato
  const ditloids = await generate20Ditloids(theme, usedQuestionsInChamp);

  if (isSupabaseConfigured) {
    try {
      // 1. Atualizar a rodada para 'open' com o tema
      await supabase
        .from('rounds')
        .update({
          theme,
          theme_selector_id: userId,
          status: 'open'
        })
        .eq('id', roundId);

      // 2. Marcar que esse participante escolheu o tema
      await supabase
        .from('championship_participants')
        .update({ has_chosen_theme: true })
        .eq('championship_id', round.championship_id)
        .eq('user_id', userId);

      // 3. Deletar questões antigas se houver
      await supabase.from('round_questions').delete().eq('round_id', roundId);

      // 4. Inserir as 20 questões
      const questionsToInsert = ditloids.map((item, index) => ({
        round_id: roundId,
        question_index: index + 1,
        enigma: item.enigma,
        answer: item.answer,
        hint: item.hint
      }));

      const { data: insertedQuestions, error } = await supabase
        .from('round_questions')
        .insert(questionsToInsert)
        .select();

      if (!error && insertedQuestions) return insertedQuestions;
    } catch (err) {
      console.warn('Supabase não inicializado com schema.sql, usando fallback local:', err);
    }
  }

  // Fallback Mock
  round.theme = theme;
  round.theme_selector_id = userId;
  round.status = 'open';

  const part = mockParticipants.find(p => p.championship_id === round.championship_id && p.user_id === userId);
  if (part) part.has_chosen_theme = true;

  // Remove antigas
  mockQuestions = mockQuestions.filter(q => q.round_id !== roundId);

  const newQuestions: RoundQuestion[] = ditloids.map((item, index) => ({
    id: `q-${roundId}-${index + 1}`,
    round_id: roundId,
    question_index: index + 1,
    enigma: item.enigma,
    answer: item.answer,
    hint: item.hint
  }));
  mockQuestions.push(...newQuestions);

  return newQuestions;
}

// Salva ou finaliza as respostas do jogador (1 ponto por acerto, max 20)
export async function submitRoundAnswers(
  roundId: string,
  userId: string,
  userAnswers: Record<string, string>,
  isCompleted: boolean = false
): Promise<{ score: number; answersResult: Record<string, { userAnswer: string; isCorrect: boolean }> }> {
  const { round, questions } = await getRoundDetails(roundId);
  if (!round) throw new Error('Rodada não encontrada');
  if (round.status === 'closed') throw new Error('Esta rodada já foi encerrada.');

  // Recupera respostas anteriores para garantir merge contínuo sem perda
  let prevAnswers: Record<string, { userAnswer: string; isCorrect: boolean }> = {};
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isUuid.test(roundId) && isUuid.test(userId)) {
        const { data: existingSub } = await supabase
          .from('player_round_submissions')
          .select('answers')
          .eq('round_id', roundId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existingSub?.answers && typeof existingSub.answers === 'object') {
          prevAnswers = existingSub.answers as any;
        }
      }
    } catch {}
  }
  if (Object.keys(prevAnswers).length === 0) {
    const prevMock = mockSubmissions.find(s => s.round_id === roundId && s.user_id === userId);
    if (prevMock?.answers) {
      prevAnswers = prevMock.answers;
    }
  }

  let score = 0;
  const answersResult: Record<string, { userAnswer: string; isCorrect: boolean }> = { ...prevAnswers };

  questions.forEach(q => {
    if (userAnswers[q.id] !== undefined) {
      const rawAnswer = userAnswers[q.id] || '';
      const isCorrect = checkAnswer(rawAnswer, q.answer);
      answersResult[q.id] = {
        userAnswer: rawAnswer,
        isCorrect
      };
    }
    if (answersResult[q.id]?.isCorrect) {
      score += 1;
    }
  });

  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isUuid.test(roundId) && isUuid.test(userId)) {
        // Upsert atômico garantindo gravação instantânea mesmo em digitação rápida
        const { error: upsertErr } = await supabase
          .from('player_round_submissions')
          .upsert(
            {
              round_id: roundId,
              user_id: userId,
              score,
              answers: answersResult,
              is_completed: isCompleted,
              submitted_at: new Date().toISOString()
            },
            { onConflict: 'round_id,user_id' }
          );

        if (upsertErr) {
          console.warn('Erro upsert player_round_submissions:', upsertErr);
        }
      }
    } catch (e) {
      console.warn('Erro ao salvar submissão no Supabase:', e);
    }
  }

  // Sempre sincroniza também na memória para persistência imediata
  const subIdx = mockSubmissions.findIndex(s => s.round_id === roundId && s.user_id === userId);
  const subData: PlayerRoundSubmission = {
    id: subIdx >= 0 ? mockSubmissions[subIdx].id : `sub-${Date.now()}`,
    round_id: roundId,
    user_id: userId,
    score,
    answers: answersResult,
    is_completed: isCompleted,
    submitted_at: new Date().toISOString()
  };
  if (subIdx >= 0) {
    mockSubmissions[subIdx] = subData;
  } else {
    mockSubmissions.push(subData);
  }

  return { score, answersResult };
}

// Encerra a rodada e consolida os pontos no campeonato
export async function closeRoundAndTally(roundId: string): Promise<void> {
  const { round, allSubmissions } = await getRoundDetails(roundId);
  if (!round) return;

  if (isSupabaseConfigured) {
    // 1. Fechar a rodada
    await supabase
      .from('rounds')
      .update({ status: 'closed' })
      .eq('id', roundId);

    // 2. Atualizar pontuação total dos participantes no campeonato
    // Recalcular soma de scores de todas as rodadas encerradas do campeonato
    const { data: champRounds } = await supabase
      .from('rounds')
      .select('id')
      .eq('championship_id', round.championship_id);

    const roundIds = (champRounds || []).map((r: { id: string }) => r.id);

    const { data: allChampSubs } = await supabase
      .from('player_round_submissions')
      .select('user_id, score')
      .in('round_id', roundIds);

    const scoresByUser: Record<string, number> = {};
    (allChampSubs || []).forEach((sub: { user_id: string; score: number }) => {
      scoresByUser[sub.user_id] = (scoresByUser[sub.user_id] || 0) + (sub.score || 0);
    });

    for (const [uid, tot] of Object.entries(scoresByUser)) {
      await supabase
        .from('championship_participants')
        .update({ total_score: tot })
        .eq('championship_id', round.championship_id)
        .eq('user_id', uid);
    }
  } else {
    round.status = 'closed';
    // Recalcula scores totais em mock
    const champRoundIds = mockRounds.filter(r => r.championship_id === round.championship_id).map(r => r.id);
    const participants = mockParticipants.filter(p => p.championship_id === round.championship_id);

    participants.forEach(p => {
      const subs = mockSubmissions.filter(s => champRoundIds.includes(s.round_id) && s.user_id === p.user_id);
      p.total_score = subs.reduce((acc, curr) => acc + curr.score, 0);
    });
  }
}
