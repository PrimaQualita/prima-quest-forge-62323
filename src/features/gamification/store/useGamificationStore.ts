import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GamificationState, Badge, GameProgress, RankingPlayer } from '../types';
import { availableBadges } from '../data/gameData';

/**
 * Store global de gamificação usando Zustand
 * Persiste dados no localStorage para manter progresso entre sessões
 */

// Ranking simulado inicial
const initialRanking: RankingPlayer[] = [
  { name: 'Ana Silva', totalScore: 850, level: 'Mestre da Integridade' },
  { name: 'Carlos Mendes', totalScore: 720, level: 'Guardião de Dados e Ética' },
  { name: 'Beatriz Costa', totalScore: 680, level: 'Guardião de Dados e Ética' },
  { name: 'Diego Santos', totalScore: 590, level: 'Guardião de Dados e Ética' },
  { name: 'Elena Rodrigues', totalScore: 520, level: 'Guardião de Dados e Ética' },
  { name: 'Fernando Lima', totalScore: 480, level: 'Guardião de Dados e Ética' },
  { name: 'Gabriela Alves', totalScore: 420, level: 'Aliado da Integridade' },
  { name: 'Henrique Souza', totalScore: 380, level: 'Aliado da Integridade' },
  { name: 'Isabela Martins', totalScore: 340, level: 'Aliado da Integridade' },
  { name: 'João Pedro', totalScore: 290, level: 'Aliado da Integridade' }
];

/**
 * Calcula o nível baseado na pontuação total
 */
const calculateLevel = (score: number): string => {
  if (score >= 700) return 'Mestre da Integridade';
  if (score >= 400) return 'Guardião de Dados e Ética';
  if (score >= 200) return 'Aliado da Integridade';
  return 'Iniciante Ético';
};

/**
 * Função stub para registrar pontuação no servidor
 * TODO: Implementar integração com API
 */
export const registrarPontuacaoNoServidor = async (gameId: string, points: number): Promise<void> => {
  console.log(`TODO: Registrar pontuação no servidor - Game: ${gameId}, Points: ${points}`);
  // Aqui virá a chamada à API quando o backend estiver pronto
  // await fetch('/api/gamification/score', { ... })
};

/**
 * Função stub para carregar ranking do servidor
 * TODO: Implementar integração com API
 */
export const carregarRankingDoServidor = async (): Promise<RankingPlayer[]> => {
  console.log('TODO: Carregar ranking do servidor');
  // Retorna dados simulados por enquanto
  // await fetch('/api/gamification/ranking')
  return initialRanking;
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: {
        name: 'Usuário de Demonstração',
        avatarColor: '#4F46E5'
      },
      totalScore: 0,
      integrityLevel: 0,
      badges: availableBadges.map(badge => ({ ...badge, unlocked: false })),
      gamesProgress: {},
      ranking: initialRanking,

      /**
       * Atualiza pontuação de um jogo específico
       * - Atualiza o progresso do jogo
       * - Soma pontos ao score total
       * - Ajusta o nível de integridade
       * - Desbloqueia medalha de iniciante se for o primeiro jogo
       */
      updateScore: (gameId: string, points: number) => {
        const state = get();
        const newTotalScore = state.totalScore + points;
        
        // Calcula novo nível de integridade (0-100)
        // Fórmula: quanto maior o score, maior o nível, mas com crescimento logarítmico
        const newIntegrityLevel = Math.min(100, Math.floor((newTotalScore / 10)));

        // Atualiza progresso do jogo
        const newGamesProgress: Record<string, GameProgress> = {
          ...state.gamesProgress,
          [gameId]: {
            gameId,
            score: (state.gamesProgress[gameId]?.score || 0) + points,
            completed: true,
            lastPlayed: new Date()
          }
        };

        // Conta quantos jogos foram completados
        const completedGames = Object.values(newGamesProgress).filter(g => g.completed).length;

        set({
          totalScore: newTotalScore,
          integrityLevel: newIntegrityLevel,
          gamesProgress: newGamesProgress
        });

        // Desbloqueia medalha de iniciante no primeiro jogo
        if (completedGames === 1 && !state.badges.find(b => b.id === 'iniciante_etico')?.unlocked) {
          get().unlockBadge('iniciante_etico');
        }

        // Desbloqueia mestre da integridade se score >= 700
        if (newTotalScore >= 700 && !state.badges.find(b => b.id === 'mestre_integridade')?.unlocked) {
          get().unlockBadge('mestre_integridade');
        }

        // Atualiza ranking
        const currentUser = state.user;
        const newLevel = calculateLevel(newTotalScore);
        const updatedRanking = [
          ...state.ranking.filter(p => p.name !== currentUser.name),
          { name: currentUser.name, totalScore: newTotalScore, level: newLevel }
        ].sort((a, b) => b.totalScore - a.totalScore);

        set({ ranking: updatedRanking });

        // Chama função stub do servidor (preparado para futura integração)
        registrarPontuacaoNoServidor(gameId, points);
      },

      /**
       * Desbloqueia uma medalha
       */
      unlockBadge: (badgeId: string) => {
        set(state => ({
          badges: state.badges.map(badge =>
            badge.id === badgeId ? { ...badge, unlocked: true } : badge
          )
        }));
      },

      /**
       * Retorna a posição do usuário no ranking
       */
      getUserRankingPosition: () => {
        const state = get();
        const position = state.ranking.findIndex(p => p.name === state.user.name);
        return position === -1 ? state.ranking.length + 1 : position + 1;
      },

      /**
       * Reseta todo o progresso (útil para testes)
       */
      resetProgress: () => {
        set({
          totalScore: 0,
          integrityLevel: 0,
          badges: availableBadges.map(badge => ({ ...badge, unlocked: false })),
          gamesProgress: {},
          ranking: initialRanking
        });
      }
    }),
    {
      name: 'gamification-storage',
      version: 1
    }
  )
);
