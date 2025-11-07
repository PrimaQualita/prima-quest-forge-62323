import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { integrityScenarios } from '../data/gameData';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface IntegrityMissionGameProps {
  onExit: () => void;
}

/**
 * Jogo 1: Missão Integridade - RPG de decisões éticas
 */
export const IntegrityMissionGame = ({ onExit }: IntegrityMissionGameProps) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();

  const currentScenario = integrityScenarios[currentScenarioIndex];
  const progress = ((currentScenarioIndex + 1) / integrityScenarios.length) * 100;

  // Expressões do personagem
  const getCharacterEmoji = () => {
    if (!showFeedback) return '🤔';
    if (selectedOption === currentScenario.correctIndex) return '😊';
    return '😟';
  };

  const handleSelectOption = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === currentScenario.correctIndex;
    setAnswers([...answers, isCorrect]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentScenarioIndex < integrityScenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Finalizar jogo
      const correctAnswers = answers.filter(a => a).length;
      const score = correctAnswers * 25; // 25 pontos por acerto
      updateScore('integrity-mission', score);
      
      // Desbloquear medalha se acertar >= 75%
      if (correctAnswers >= integrityScenarios.length * 0.75) {
        unlockBadge('mestre_integridade');
      }
      
      setGameCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setAnswers([]);
    setGameCompleted(false);
  };

  if (gameCompleted) {
    const correctAnswers = answers.filter(a => a).length;
    const percentage = (correctAnswers / integrityScenarios.length) * 100;
    
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">
                {percentage >= 75 ? '🏆' : percentage >= 50 ? '👍' : '📚'}
              </div>
              <CardTitle className="text-3xl">Missão Concluída!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <p className="text-5xl font-bold text-primary mb-2">
                  {correctAnswers}/{integrityScenarios.length}
                </p>
                <p className="text-muted-foreground">Acertos</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">
                  {percentage >= 75 && 'Excelente compreensão da integridade! Você demonstra forte alinhamento com os valores éticos.'}
                  {percentage >= 50 && percentage < 75 && 'Bom trabalho! Continue estudando o Código de Ética para fortalecer suas decisões.'}
                  {percentage < 50 && 'Recomenda-se reforço em ética aplicada. Revise o Código de Ética e os treinamentos disponíveis.'}
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleRestart} variant="outline" className="flex-1">
                  Jogar Novamente
                </Button>
                <Button onClick={onExit} className="flex-1">
                  Voltar ao Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Badge variant="outline">Cenário {currentScenarioIndex + 1}/{integrityScenarios.length}</Badge>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Game Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Character */}
          <motion.div
            key={getCharacterEmoji()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <div className="text-9xl">{getCharacterEmoji()}</div>
          </motion.div>

          {/* Scenario */}
          <div className="md:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenarioIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{currentScenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{currentScenario.description}</p>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentScenario.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSelectOption(index)}
                          disabled={showFeedback}
                          whileHover={!showFeedback ? { scale: 1.02 } : {}}
                          whileTap={!showFeedback ? { scale: 0.98 } : {}}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            selectedOption === index
                              ? showFeedback
                                ? index === currentScenario.correctIndex
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-red-500 bg-red-500/10'
                                : 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          } ${showFeedback && index === currentScenario.correctIndex ? 'border-green-500 bg-green-500/10' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {showFeedback && index === currentScenario.correctIndex && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {showFeedback && selectedOption === index && index !== currentScenario.correctIndex && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-muted rounded-lg"
                        >
                          <p className="font-medium mb-2">
                            {selectedOption === currentScenario.correctIndex ? '✅ Correto!' : '❌ Incorreto'}
                          </p>
                          <p className="text-sm text-muted-foreground">{currentScenario.explanation}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {!showFeedback ? (
                        <Button
                          onClick={handleConfirm}
                          disabled={selectedOption === null}
                          className="flex-1"
                        >
                          Confirmar Resposta
                        </Button>
                      ) : (
                        <Button onClick={handleNext} className="flex-1">
                          {currentScenarioIndex < integrityScenarios.length - 1 ? 'Próximo Cenário' : 'Ver Resultado'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
