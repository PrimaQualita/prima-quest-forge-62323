// Tipos para o módulo de gamificação

export interface User {
  name: string;
  avatarColor: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface GameProgress {
  gameId: string;
  score: number;
  completed: boolean;
  lastPlayed?: Date;
}

export interface RankingPlayer {
  name: string;
  totalScore: number;
  level: string;
}

export interface GamificationState {
  user: User;
  totalScore: number;
  integrityLevel: number;
  badges: Badge[];
  gamesProgress: Record<string, GameProgress>;
  ranking: RankingPlayer[];
  updateScore: (gameId: string, points: number) => void;
  unlockBadge: (badgeId: string) => void;
  getUserRankingPosition: () => number;
  resetProgress: () => void;
}

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Intermediário' | 'Avançado';
  icon: string;
  color: string;
}

// Tipos para Jogo 1 - Missão Integridade
export interface IntegrityScenario {
  id: string;
  title: string;
  description: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Tipos para Jogo 2 - Caça aos Riscos
export interface RiskHotspot {
  id: string;
  label: string;
  description: string;
  explanation: string;
  posX: number;
  posY: number;
}

// Tipos para Jogo 3 - Quiz da Ética
export interface QuizQuestion {
  id: string;
  question: string;
  alternatives: string[];
  correctIndex: number;
  explanation: string;
}

// Tipos para Jogo 5 - Canal de Denúncias
export interface WhistleblowerCase {
  id: string;
  report: string;
  options: string[];
  idealIndex: number;
  impacts: {
    trust: number;
    risk: number;
    reputation: number;
  };
  explanation: string;
}

// Tipos para Jogo 6 - Compliance Tycoon
export interface ComplianceAction {
  id: string;
  name: string;
  description: string;
  budgetCost: number;
  timeCost: number;
  effects: {
    compliance: number;
    reputation: number;
    engagement: number;
    maturity: number;
  };
}
