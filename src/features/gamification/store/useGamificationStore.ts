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
 * Calcula o nível baseado na pontuação total (sistema de pontos infinitos)
 */
const calculateLevel = (score: number): string => {
  if (score >= 5000) return 'Lenda Compliance';
  if (score >= 3000) return 'Mestre da Integridade';
  if (score >= 1500) return 'Guardião de Dados e Ética';
  if (score >= 500) return 'Aliado da Integridade';
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
 * Retorna TODOS os colaboradores, incluindo os que não têm progresso (score 0)
 */
export const carregarRankingDoServidor = async (): Promise<RankingPlayer[]> => {
  try {
    // Busca todos os colaboradores que têm user_id válido
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('user_id, name')
      .not('user_id', 'is', null);

    if (employeesError) throw employeesError;
    if (!employeesData || employeesData.length === 0) return [];

    // Filtra user_ids válidos
    const userIds = employeesData.map(e => e.user_id).filter(id => id != null);
    
    if (userIds.length === 0) return [];

    const { data: progressData, error: progressError } = await supabase
      .from('gamification_progress')
      .select('user_id, total_score')
      .in('user_id', userIds);

    if (progressError) throw progressError;

    // Mapeia colaboradores com seu progresso (ou 0 se não tiver)
    const ranking: RankingPlayer[] = employeesData
      .map(employee => {
        const progress = progressData?.find(p => p.user_id === employee.user_id);
        const totalScore = progress?.total_score || 0;

        return {
          name: employee.name,
          totalScore,
          level: calculateLevel(totalScore)
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

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
        avatarColor: '#4F46E5',
        avatarUrl: undefined
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
        
        console.log(`[Gamification] Atualizando score - Game: ${gameId}, Points: ${points}, Old Total: ${state.totalScore}, New Total: ${newTotalScore}`);
        
        // Calcula novo nível de integridade baseado em pontos (sistema infinito)
        const newIntegrityLevel = Math.min(100, Math.floor((newTotalScore / 50)));

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
        
        console.log('[Gamification] Estado atualizado localmente:', newState);

        // Desbloqueia medalha de iniciante no primeiro jogo
        if (completedGames === 1 && !state.badges.find(b => b.id === 'iniciante_etico')?.unlocked) {
          get().unlockBadge('iniciante_etico');
        }

        // Desbloqueia mestre da integridade se score >= 3000
        if (newTotalScore >= 3000 && !state.badges.find(b => b.id === 'mestre_integridade')?.unlocked) {
          get().unlockBadge('mestre_integridade');
        }

        // Salva no Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('[Gamification] Salvando no Supabase para user:', user.id);
          await salvarProgressoNoServidor(
            user.id,
            newTotalScore,
            newIntegrityLevel,
            newGamesProgress,
            get().badges
          );
          console.log('[Gamification] Salvo no Supabase com sucesso');
        } else {
          console.error('[Gamification] Usuário não autenticado, não foi possível salvar no servidor');
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

          // Busca nome e avatar do colaborador
          const { data: employeeData } = await supabase
            .from('employees')
            .select('name')
            .eq('user_id', user.id)
            .maybeSingle();

          // Busca avatar do perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (employeeData) {
            set({
              user: {
                name: employeeData.name,
                avatarColor: '#4F46E5',
                avatarUrl: profileData?.avatar_url || undefined
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
      version: 2,
      // Não persiste pontuação e nível - sempre vem do servidor
      partialize: (state) => ({
        user: state.user
        // totalScore, integrityLevel, gamesProgress, badges e ranking NÃO são persistidos
        // Tudo deve vir do servidor via loadUserData
      })
    }
  )
);
