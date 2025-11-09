import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GamificationState, Badge, GameProgress, RankingPlayer } from '../types';
import { availableBadges } from '../data/gameData';
import { supabase } from '@/integrations/supabase/client';

/**
 * Store global de gamificação usando Zustand
 * Integrado com Supabase para persistência de dados
 */

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
 * Salva progresso de gamificação no Supabase
 */
export const salvarProgressoNoServidor = async (
  userId: string,
  totalScore: number,
  integrityLevel: number,
  gamesProgress: Record<string, GameProgress>,
  badges: Badge[]
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('gamification_progress')
      .upsert({
        user_id: userId,
        total_score: totalScore,
        integrity_level: integrityLevel,
        games_progress: gamesProgress as any,
        badges: badges as any
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
  }
};

/**
 * Carrega progresso de gamificação do Supabase
 */
export const carregarProgressoDoServidor = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('gamification_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
    return null;
  }
};

/**
 * Carrega ranking de colaboradores e gestores (exclui fornecedores)
 */
export const carregarRankingDoServidor = async (): Promise<RankingPlayer[]> => {
  try {
    // Busca progresso de gamificação dos colaboradores e gestores
    const { data: progressData, error: progressError } = await supabase
      .from('gamification_progress')
      .select(`
        user_id,
        total_score,
        integrity_level
      `)
      .order('total_score', { ascending: false })
      .limit(10);

    if (progressError) throw progressError;
    if (!progressData || progressData.length === 0) return [];

    // Busca informações dos colaboradores
    const userIds = progressData.map(p => p.user_id);
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('user_id, name')
      .in('user_id', userIds);

    if (employeesError) throw employeesError;

    // Mapeia progresso com nomes dos colaboradores
    const ranking: RankingPlayer[] = progressData
      .map(progress => {
        const employee = employeesData?.find(e => e.user_id === progress.user_id);
        if (!employee) return null;

        return {
          name: employee.name,
          totalScore: progress.total_score,
          level: calculateLevel(progress.total_score)
        };
      })
      .filter((item): item is RankingPlayer => item !== null);

    return ranking;
  } catch (error) {
    console.error('Erro ao carregar ranking:', error);
    return [];
  }
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: {
        name: 'Carregando...',
        avatarColor: '#4F46E5'
      },
      totalScore: 0,
      integrityLevel: 0,
      badges: availableBadges.map(badge => ({ ...badge, unlocked: false })),
      gamesProgress: {},
      ranking: [],

      /**
       * Atualiza pontuação de um jogo específico
       * - Atualiza o progresso do jogo
       * - Soma pontos ao score total
       * - Ajusta o nível de integridade
       * - Desbloqueia medalha de iniciante se for o primeiro jogo
       * - Persiste no Supabase
       */
      updateScore: async (gameId: string, points: number) => {
        const state = get();
        const newTotalScore = state.totalScore + points;
        
        // Calcula novo nível de integridade (0-100)
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

        const newState = {
          totalScore: newTotalScore,
          integrityLevel: newIntegrityLevel,
          gamesProgress: newGamesProgress
        };

        set(newState);

        // Desbloqueia medalha de iniciante no primeiro jogo
        if (completedGames === 1 && !state.badges.find(b => b.id === 'iniciante_etico')?.unlocked) {
          get().unlockBadge('iniciante_etico');
        }

        // Desbloqueia mestre da integridade se score >= 700
        if (newTotalScore >= 700 && !state.badges.find(b => b.id === 'mestre_integridade')?.unlocked) {
          get().unlockBadge('mestre_integridade');
        }

        // Salva no Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await salvarProgressoNoServidor(
            user.id,
            newTotalScore,
            newIntegrityLevel,
            newGamesProgress,
            get().badges
          );
        }

        // Atualiza ranking
        await get().loadRanking();
      },

      /**
       * Carrega dados do servidor
       */
      loadUserData: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Busca nome do colaborador
          const { data: employeeData } = await supabase
            .from('employees')
            .select('name')
            .eq('user_id', user.id)
            .maybeSingle();

          if (employeeData) {
            set({
              user: {
                name: employeeData.name,
                avatarColor: '#4F46E5'
              }
            });
          }

          // Busca progresso de gamificação
          const progressData = await carregarProgressoDoServidor(user.id);
          if (progressData) {
            set({
              totalScore: progressData.total_score,
              integrityLevel: progressData.integrity_level,
              gamesProgress: (progressData.games_progress as any) || {},
              badges: (progressData.badges as any) || availableBadges.map(badge => ({ ...badge, unlocked: false }))
            });
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
        }
      },

      /**
       * Carrega ranking do servidor
       */
      loadRanking: async () => {
        const ranking = await carregarRankingDoServidor();
        set({ ranking });
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
          ranking: []
        });
      }
    }),
    {
      name: 'gamification-storage',
      version: 1
    }
  )
);
