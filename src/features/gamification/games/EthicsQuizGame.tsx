import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { expandedQuizQuestions, shuffleArray, shuffleQuestionOptions } from '../data/expandedQuestions';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

interface EthicsQuizGameProps {
  onExit: () => void;
}

/**
 * Jogo 3: Quiz da Ética - Perguntas sobre ética, integridade e LGPD
 * Perguntas e alternativas embaralhadas para evitar repetição
 */
export const EthicsQuizGame = ({ onExit }: EthicsQuizGameProps) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameCompleted, setGameCompleted] = useState(false);
  const { updateScore } = useGamificationStore();

  // Embaralha perguntas ao iniciar o jogo
  useEffect(() => {
    const questionsToUse = shuffleArray([...expandedQuizQuestions]).slice(0, 4);
    const questionsWithShuffledOptions = questionsToUse.map(q => shuffleQuestionOptions(q));
    setShuffledQuestions(questionsWithShuffledOptions);
  }, []);

  // Timer - MOVIDO PARA ANTES DO RETURN CONDICIONAL
  useEffect(() => {
    if (showFeedback || gameCompleted || shuffledQuestions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Tempo esgotado
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showFeedback, gameCompleted, shuffledQuestions.length]);

  const handleTimeout = () => {
    setAnswers([...answers, false]);
    setShowFeedback(true);
    setSelectedAnswer(null);
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = shuffledQuestions.length > 0 ? ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100 : 0;

  // Se ainda não carregou as perguntas
  if (shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }
    if (showFeedback || gameCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Tempo esgotado
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.shuffledCorrectIndex;
    setAnswers([...answers, isCorrect]);
    setShowFeedback(true);
    
    if (isCorrect) {
      const bonusPoints = timeLeft > 15 ? 10 : 0;
      updateScore('ethics-quiz', 15 + bonusPoints);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(30);
    } else {
      setGameCompleted(true);
    }
  };

  const handleRestart = () => {
    // Embaralha novamente ao reiniciar
    const questionsToUse = shuffleArray([...expandedQuizQuestions]).slice(0, 4);
    const questionsWithShuffledOptions = questionsToUse.map(q => shuffleQuestionOptions(q));
    setShuffledQuestions(questionsWithShuffledOptions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setTimeLeft(30);
    setGameCompleted(false);
  };

  const getCharacterEmoji = () => {
    if (gameCompleted) {
      const correctAnswers = answers.filter(a => a).length;
      const percentage = (correctAnswers / shuffledQuestions.length) * 100;
      if (percentage >= 80) return '🌟';
      if (percentage >= 60) return '😊';
      return '🤔';
    }
    if (!showFeedback) return '🧠';
    if (selectedAnswer === currentQuestion.shuffledCorrectIndex) return '🎉';
    return '💭';
  };

  if (gameCompleted) {
    const correctAnswers = answers.filter(a => a).length;
    const percentage = (correctAnswers / shuffledQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">{getCharacterEmoji()}</div>
              <CardTitle className="text-3xl">Quiz Finalizado!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <p className="text-5xl font-bold text-primary mb-2">
                  {correctAnswers}/{shuffledQuestions.length}
                </p>
                <p className="text-muted-foreground">Acertos ({Math.round(percentage)}%)</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {percentage >= 80 && '🏆 Excelente! Você domina os conceitos de ética e compliance!'}
                  {percentage >= 60 && percentage < 80 && '👍 Bom trabalho! Continue estudando para aprimorar ainda mais.'}
                  {percentage < 60 && '📚 Continue praticando! Revise os materiais de ética e LGPD.'}
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
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Pergunta {currentQuestionIndex + 1}/{shuffledQuestions.length}
            </Badge>
            <Badge variant={timeLeft <= 10 ? 'destructive' : 'default'}>
              <Clock className="w-4 h-4 mr-1" />
              {timeLeft}s
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Timer visual */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-primary'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 30) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Game Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Character */}
          <motion.div
            key={getCharacterEmoji()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <div className="text-8xl">{getCharacterEmoji()}</div>
          </motion.div>

          {/* Question */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Alternatives */}
                    <div className="space-y-3">
                      {currentQuestion.alternatives.map((alternative: string, index: number) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSelectAnswer(index)}
                          disabled={showFeedback}
                          whileHover={!showFeedback ? { scale: 1.02 } : {}}
                          whileTap={!showFeedback ? { scale: 0.98 } : {}}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            selectedAnswer === index
                              ? showFeedback
                                ? index === currentQuestion.shuffledCorrectIndex
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-red-500 bg-red-500/10'
                                : 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          } ${showFeedback && index === currentQuestion.shuffledCorrectIndex ? 'border-green-500 bg-green-500/10' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1 pt-1">{alternative}</span>
                            {showFeedback && index === currentQuestion.shuffledCorrectIndex && (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                            {showFeedback && selectedAnswer === index && index !== currentQuestion.shuffledCorrectIndex && (
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
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
                            {selectedAnswer === currentQuestion.shuffledCorrectIndex ? '✅ Correto!' : '❌ Incorreto'}
                          </p>
                          <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {!showFeedback ? (
                        <Button
                          onClick={handleConfirm}
                          disabled={selectedAnswer === null}
                          className="flex-1"
                        >
                          Confirmar Resposta
                        </Button>
                      ) : (
                        <Button onClick={handleNext} className="flex-1">
                          {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado'}
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
