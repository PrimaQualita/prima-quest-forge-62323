import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameCard } from '../components/GameCard';
import { ProgressBar } from '../components/ProgressBar';
import { RankingPanel } from '../components/RankingPanel';
import { BadgesPanel } from '../components/BadgesPanel';
import { useGamificationStore } from '../store/useGamificationStore';
import { gamesInfo } from '../data/gameData';
import { ArrowLeft } from 'lucide-react';
import { useUserType } from '@/hooks/useUserType';

interface MissionsMenuProps {
  onSelectGame: (gameId: string) => void;
  onBack: () => void;
}

/**
 * Menu principal de missões com grid de jogos e painéis de progresso
 */
export const MissionsMenu = ({ onSelectGame, onBack }: MissionsMenuProps) => {
  const { user, totalScore, integrityLevel, badges, ranking, loadUserData, loadRanking } = useGamificationStore();
  const { isSupplier, loading: userTypeLoading } = useUserType();

  // Carrega dados do usuário e ranking ao montar o componente
  useEffect(() => {
    loadUserData();
    if (!isSupplier) {
      loadRanking();
    }
  }, [loadUserData, loadRanking, isSupplier]);

  // Calcula nível textual baseado no score
  const getLevelText = (score: number): string => {
    if (score >= 700) return 'Mestre da Integridade';
    if (score >= 400) return 'Guardião de Dados e Ética';
    if (score >= 200) return 'Aliado da Integridade';
    return 'Iniciante Ético';
  };

  // Avatar com inicial do nome
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Missões de Compliance</h1>
          <p className="text-xl text-muted-foreground">Escolha sua missão e avance na jornada da integridade</p>
        </motion.div>

        {/* Perfil do usuário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {getInitials(user.name)}
                </div>

                {/* Informações */}
                <div className="flex-1 text-center md:text-left space-y-4 w-full">
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-muted-foreground">{getLevelText(totalScore)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ProgressBar
                        label="Nível de Integridade"
                        value={integrityLevel}
                        max={100}
                      />
                    </div>
                    <div className="flex items-center justify-center md:justify-end">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">{totalScore}</p>
                        <p className="text-sm text-muted-foreground">XP Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grid principal: Jogos e Painéis laterais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jogos - 2 colunas */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Escolha uma Missão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gamesInfo.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <GameCard
                          game={game}
                          onPlay={() => onSelectGame(game.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Painéis laterais - 1 coluna */}
          <div className="space-y-6">
            {/* Ranking apenas para colaboradores/gestores */}
            {!isSupplier && !userTypeLoading && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RankingPanel ranking={ranking} currentUserName={user.name} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <BadgesPanel badges={badges} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
