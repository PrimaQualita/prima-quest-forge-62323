import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { riskHotspots } from '../data/gameData';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RiskHuntGameProps {
  onExit: () => void;
}

/**
 * Jogo 2: Caça aos Riscos - Investigação visual de riscos de compliance
 */
export const RiskHuntGame = ({ onExit }: RiskHuntGameProps) => {
  const [foundRisks, setFoundRisks] = useState<string[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const { updateScore, unlockBadge } = useGamificationStore();

  const allRisksFound = foundRisks.length === riskHotspots.length;

  const handleHotspotClick = (riskId: string) => {
    if (foundRisks.includes(riskId)) {
      setSelectedRisk(riskId);
      return;
    }

    setFoundRisks([...foundRisks, riskId]);
    setSelectedRisk(riskId);
    const newScore = score + 20;
    setScore(newScore);

    toast({
      title: '✅ Risco Encontrado!',
      description: 'Você identificou mais um risco de compliance.',
    });

    // Verificar se todos os riscos foram encontrados
    if (foundRisks.length + 1 === riskHotspots.length) {
      setTimeout(() => {
        setGameCompleted(true);
        updateScore('risk-hunt', newScore);
        unlockBadge('cacador_riscos');
      }, 1500);
    }
  };

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      toast({
        title: '❌ Nada aqui',
        description: 'Continue procurando por riscos no ambiente.',
        variant: 'destructive'
      });
    }
  };

  const getRiskInfo = (riskId: string) => {
    return riskHotspots.find(r => r.id === riskId);
  };

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <CardTitle className="text-3xl">Parabéns, Caçador de Riscos!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{score}</p>
                <p className="text-muted-foreground">Pontos conquistados</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-4 text-center">Riscos Identificados:</p>
                <div className="space-y-2">
                  {riskHotspots.map((risk) => (
                    <div key={risk.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{risk.label}</p>
                        <p className="text-sm text-muted-foreground">{risk.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={onExit} className="w-full" size="lg">
                Voltar ao Menu
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {foundRisks.length}/{riskHotspots.length} Riscos
            </Badge>
            <Badge>
              {score} Pontos
            </Badge>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <p className="text-center text-sm text-muted-foreground">
              🔍 Clique nos pontos de risco no ambiente abaixo para identificá-los
            </p>
          </CardContent>
        </Card>

        {/* Game Scene */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scene */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ambiente de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onClick={handleSceneClick}
                  className="relative w-full aspect-video bg-gradient-to-br from-blue-50 to-gray-100 dark:from-blue-950 dark:to-gray-900 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-muted"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1), transparent), radial-gradient(circle at 80% 80%, rgba(50, 150, 255, 0.1), transparent)'
                  }}
                >
                  {/* Hotspots */}
                  {riskHotspots.map((risk) => (
                    <motion.button
                      key={risk.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHotspotClick(risk.id);
                      }}
                      className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                        foundRisks.includes(risk.id)
                          ? 'bg-green-500/80 scale-110'
                          : 'bg-red-500/80 hover:scale-125 animate-pulse'
                      }`}
                      style={{
                        left: `${risk.posX}%`,
                        top: `${risk.posY}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      whileHover={{ scale: foundRisks.includes(risk.id) ? 1.1 : 1.3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {foundRisks.includes(risk.id) ? '✓' : '!'}
                    </motion.button>
                  ))}

                  {/* Visual elements */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-300 dark:from-gray-800 to-transparent" />
                  <div className="absolute top-1/4 right-1/4 w-24 h-32 bg-gray-400/30 dark:bg-gray-700/30 rounded-lg" />
                  <div className="absolute top-1/3 left-1/4 w-32 h-24 bg-gray-400/30 dark:bg-gray-700/30 rounded" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {selectedRisk ? (
                    <motion.div
                      key={selectedRisk}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {(() => {
                        const risk = getRiskInfo(selectedRisk);
                        return risk ? (
                          <>
                            <div className="text-4xl text-center">
                              {foundRisks.includes(risk.id) ? '✅' : '⚠️'}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg mb-2">{risk.label}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm">{risk.explanation}</p>
                              </div>
                            </div>
                          </>
                        ) : null;
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-muted-foreground py-12"
                    >
                      <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Clique em um ponto de risco para ver detalhes</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
