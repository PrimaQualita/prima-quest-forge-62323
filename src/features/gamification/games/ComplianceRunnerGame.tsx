import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trophy, Star, AlertCircle } from 'lucide-react';
import { useGamificationStore } from '../store/useGamificationStore';
import { toast } from 'sonner';
import { regulamentosQuestions } from '../data/expandedQuestions';

interface ComplianceRunnerGameProps {
  onExit: () => void;
}

interface Challenge {
  id: number;
  position: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PHASES = [
  { id: 1, name: 'Iniciante', challenges: 5, xpPerChallenge: 20, color: 'from-blue-500 to-blue-600' },
  { id: 2, name: 'Intermediário', challenges: 7, xpPerChallenge: 30, color: 'from-purple-500 to-purple-600' },
  { id: 3, name: 'Avançado', challenges: 10, xpPerChallenge: 50, color: 'from-orange-500 to-orange-600' },
  { id: 4, name: 'Mestre', challenges: 12, xpPerChallenge: 75, color: 'from-red-500 to-red-600' }
];

export const ComplianceRunnerGame = ({ onExit }: ComplianceRunnerGameProps) => {
  const { updateScore, gamesProgress } = useGamificationStore();
  const [currentPhase, setCurrentPhase] = useState(1);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [score, setScore] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const phase = PHASES.find(p => p.id === currentPhase)!;
  const totalDistance = 100;
  const challengePositions = Array.from({ length: phase.challenges }, (_, i) => 
    ((i + 1) * totalDistance) / (phase.challenges + 1)
  );

  // Inicializa desafios da fase
  useEffect(() => {
    const availableQuestions = regulamentosQuestions.filter((_, idx) => !usedQuestions.has(idx));
    
    if (availableQuestions.length < phase.challenges) {
      // Se não houver perguntas suficientes, reinicia o pool
      setUsedQuestions(new Set());
    }

    const selectedQuestions = availableQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, phase.challenges);

    const newChallenges: Challenge[] = selectedQuestions.map((q, i) => ({
      id: i,
      position: challengePositions[i],
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    }));

    setChallenges(newChallenges);
  }, [currentPhase]);

  const movePlayer = () => {
    if (isMoving || gameCompleted) return;

    const nextChallenge = challenges.find(c => c.position > playerPosition);
    if (nextChallenge) {
      setIsMoving(true);
      setPlayerPosition(nextChallenge.position);
      
      setTimeout(() => {
        setCurrentChallenge(nextChallenge);
        setShowQuestion(true);
        setIsMoving(false);
      }, 800);
    }
  };

  const handleAnswer = async (selectedIndex: number) => {
    if (!currentChallenge) return;

    const isCorrect = selectedIndex === currentChallenge.correctIndex;
    
    if (isCorrect) {
      const earnedXP = phase.xpPerChallenge;
      setScore(score + earnedXP);
      setCompletedChallenges(completedChallenges + 1);
      
      toast.success(`Correto! +${earnedXP} XP`, {
        description: currentChallenge.explanation
      });

      // Marca a pergunta como usada
      const questionIndex = regulamentosQuestions.findIndex(
        q => q.question === currentChallenge.question
      );
      if (questionIndex !== -1) {
        setUsedQuestions(prev => new Set([...prev, questionIndex]));
      }

      setShowQuestion(false);
      setCurrentChallenge(null);

      // Verifica se completou a fase
      if (completedChallenges + 1 >= phase.challenges) {
        await updateScore('compliance-runner', score + earnedXP);
        
        if (currentPhase < PHASES.length) {
          toast.success(`Fase ${currentPhase} completa!`, {
            description: `Próxima fase desbloqueada!`
          });
          setTimeout(() => {
            setCurrentPhase(currentPhase + 1);
            setPlayerPosition(0);
            setCompletedChallenges(0);
          }, 2000);
        } else {
          setGameCompleted(true);
          toast.success('Parabéns! Você completou todas as fases!', {
            description: `Total: ${score + earnedXP} XP`
          });
        }
      }
    } else {
      toast.error('Resposta incorreta!', {
        description: currentChallenge.explanation
      });
      setShowQuestion(false);
      setCurrentChallenge(null);
    }
  };

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">Parabéns!</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Você completou todas as fases!
          </p>
          <div className="text-3xl font-bold text-primary mb-8">
            Total: {score} XP
          </div>
          <Button onClick={onExit} size="lg">
            Voltar ao Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Fase</div>
              <div className="text-2xl font-bold">{currentPhase}/{PHASES.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Desafios</div>
              <div className="text-2xl font-bold">{completedChallenges}/{phase.challenges}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">XP Total</div>
              <div className="text-2xl font-bold text-primary">{score}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <Card className="max-w-6xl mx-auto p-8">
        <div className={`bg-gradient-to-r ${phase.color} text-white rounded-lg p-4 mb-6 text-center`}>
          <h2 className="text-2xl font-bold">{phase.name}</h2>
          <p className="text-sm opacity-90">+{phase.xpPerChallenge} XP por desafio</p>
        </div>

        {/* Track */}
        <div className="relative h-40 bg-muted rounded-lg mb-6 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute h-full w-px bg-foreground"
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </div>

          {/* Challenges */}
          {challenges.map((challenge, idx) => (
            <motion.div
              key={challenge.id}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${challenge.position}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                challenge.position <= playerPosition 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {challenge.position <= playerPosition ? '✓' : '?'}
              </div>
            </motion.div>
          ))}

          {/* Player */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            animate={{ left: `${playerPosition}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="text-4xl">🏃</div>
          </motion.div>

          {/* Finish line */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-green-500" />
        </div>

        {/* Controls */}
        {!showQuestion && (
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={movePlayer}
              disabled={isMoving || completedChallenges >= phase.challenges}
              className="px-8"
            >
              {isMoving ? 'Correndo...' : 'Avançar'}
            </Button>
          </div>
        )}
      </Card>

      {/* Question Modal */}
      <AnimatePresence>
        {showQuestion && currentChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Card className="max-w-2xl w-full p-6">
                <div className="flex items-start gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Desafio de Compliance</h3>
                    <p className="text-lg">{currentChallenge.question}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentChallenge.options.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-4 px-4"
                      onClick={() => handleAnswer(idx)}
                    >
                      <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                      <span>{option}</span>
                    </Button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
