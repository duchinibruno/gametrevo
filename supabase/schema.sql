-- =========================================================
-- GAME TREVO - SCHEMA SUPABASE COM AUTENTICAÇÃO REAL
-- Execute este script no SQL Editor do seu projeto Supabase
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Usuários / Jogadores (Com Cadastro e Login)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#10b981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Campeonatos
CREATE TABLE IF NOT EXISTS public.championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total_rounds INT NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'finished'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Participantes do Campeonato
CREATE TABLE IF NOT EXISTS public.championship_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_score INT NOT NULL DEFAULT 0,
    has_chosen_theme BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(championship_id, user_id)
);

-- 4. Rodadas / Partidas do Campeonato
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    scheduled_date DATE NOT NULL, -- Formato 'YYYY-MM-DD'
    status TEXT NOT NULL DEFAULT 'pending_theme', -- 'pending_theme', 'open', 'closed'
    theme_selector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    theme TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(championship_id, round_number)
);

-- 5. Enigmas (Ditloids) da Rodada (20 por rodada)
CREATE TABLE IF NOT EXISTS public.round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    question_index INT NOT NULL, -- 1 a 20
    enigma TEXT NOT NULL, -- Ex: "7 D na S"
    answer TEXT NOT NULL, -- Ex: "7 Dias na Semana"
    hint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(round_id, question_index)
);

-- 6. Submissões e Respostas dos Jogadores
CREATE TABLE IF NOT EXISTS public.player_round_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0, -- 0 a 20 (1 ponto por acerto)
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(round_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_participants_champ ON public.championship_participants(championship_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.championship_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_rounds_champ ON public.rounds(championship_id);
CREATE INDEX IF NOT EXISTS idx_rounds_date ON public.rounds(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_questions_round ON public.round_questions(round_id);
CREATE INDEX IF NOT EXISTS idx_submissions_round ON public.player_round_submissions(round_id);

-- Habilitar RLS com políticas abertas para anon key da aplicação
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_round_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public championships access" ON public.championships;
CREATE POLICY "Public championships access" ON public.championships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public participants access" ON public.championship_participants;
CREATE POLICY "Public participants access" ON public.championship_participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public rounds access" ON public.rounds;
CREATE POLICY "Public rounds access" ON public.rounds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public questions access" ON public.round_questions;
CREATE POLICY "Public questions access" ON public.round_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public submissions access" ON public.player_round_submissions;
CREATE POLICY "Public submissions access" ON public.player_round_submissions FOR ALL USING (true) WITH CHECK (true);
