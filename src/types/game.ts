export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at?: string;
}

export interface Championship {
  id: string;
  title: string;
  creator_id: string;
  total_rounds: number;
  status: 'active' | 'finished';
  created_at?: string;
  participants?: ChampionshipParticipant[];
}

export interface ChampionshipParticipant {
  id: string;
  championship_id: string;
  user_id: string;
  total_score: number;
  has_chosen_theme: boolean;
  user?: User;
}

export interface Round {
  id: string;
  championship_id: string;
  round_number: number;
  scheduled_date: string; // YYYY-MM-DD
  status: 'pending_theme' | 'open' | 'closed';
  theme_selector_id?: string | null;
  theme?: string | null;
  created_at?: string;
  selector?: User;
  questions?: RoundQuestion[];
  userSubmission?: PlayerRoundSubmission;
}

export interface RoundQuestion {
  id: string;
  round_id: string;
  question_index: number; // 1 to 20
  enigma: string; // e.g. "7 D na S"
  answer: string; // e.g. "7 Dias na Semana"
  hint?: string;
}

export interface PlayerRoundSubmission {
  id: string;
  round_id: string;
  user_id: string;
  score: number; // 0 to 20
  answers: Record<string, { userAnswer: string; isCorrect: boolean }>;
  is_completed: boolean;
  submitted_at?: string;
  user?: User;
}
