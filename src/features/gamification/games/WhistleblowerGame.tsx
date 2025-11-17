import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGamificationStore } from '../store/useGamificationStore';
import { whistleblowerCases } from '../data/gameData';
import { ArrowLeft } from 'lucide-react';
import { shuffleArray } from '../data/expandedQuestions';

export const WhistleblowerGame = ({ onExit }: { onExit: () => void }) => {
  const [shuffledCases, setShuffledCases] = useState<Array<typeof whistleblowerCases[0] & { correctIndex?: number }>>([]);
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [metrics, setMetrics] = useState({ trust: 50, risk: 50, reputation: 50 });
  const [gameOver, setGameOver] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();

  // Embaralha casos e opções ao iniciar
  useEffect(() => {
    const casesToUse = shuffleArray([...whistleblowerCases]).slice(0, 8);
    // Embaralha as opções de cada caso
    const casesWithShuffledOptions = casesToUse.map(caseItem => {
      const originalCorrectAnswer = caseItem.options[0]; // A primeira opção é sempre a correta
      const shuffledOptions = shuffleArray([...caseItem.options]);
      const newCorrectIndex = shuffledOptions.indexOf(originalCorrectAnswer);
      
      return {
        ...caseItem,
        options: shuffledOptions,
        correctIndex: newCorrectIndex
      };
    });
    setShuffledCases(casesWithShuffledOptions);
  }, []);

  // Se ainda não carregou os casos
  if (shuffledCases.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const currentCase = shuffledCases[caseIndex];

  const handleConfirm = () => {
    if (selectedOption === null) return;
    const impacts = currentCase.impacts;
    setMetrics(prev => ({
      trust: Math.max(0, Math.min(100, prev.trust + impacts.trust)),
      risk: Math.max(0, Math.min(100, prev.risk + impacts.risk)),
      reputation: Math.max(0, Math.min(100, prev.reputation + impacts.reputation))
    }));
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (caseIndex < shuffledCases.length - 1) {
      setCaseIndex(caseIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      const avgMetric = (metrics.trust + (100 - metrics.risk) + metrics.reputation) / 3;
      const score = Math.round(avgMetric);
      updateScore('whistleblower-decision', score);
      if (score >= 70) unlockBadge('guardiao_canal_denuncias');
      setGameOver(true);
    }
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📢</div>
            <CardTitle>Avaliação Final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{metrics.trust}</p>
                <p className="text-sm">Confiança</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{100 - metrics.risk}</p>
                <p className="text-sm">Segurança</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{metrics.reputation}</p>
                <p className="text-sm">Reputação</p>
              </div>
            </div>
            <p className="text-center">{metrics.trust >= 70 ? 'Sua atuação fortalece a cultura de denúncia responsável!' : 'Revise os procedimentos do canal de denúncias.'}</p>
            <Button onClick={onExit} className="w-full">Voltar ao Menu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onExit}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        
        <div className="grid grid-cols-3 gap-4">
          <div><Progress value={metrics.trust} className="h-2" /><p className="text-xs mt-1">Confiança: {metrics.trust}</p></div>
          <div><Progress value={100 - metrics.risk} className="h-2" /><p className="text-xs mt-1">Segurança: {100 - metrics.risk}</p></div>
          <div><Progress value={metrics.reputation} className="h-2" /><p className="text-xs mt-1">Reputação: {metrics.reputation}</p></div>
        </div>

        <Card>
          <CardHeader><CardTitle>Caso {caseIndex + 1} de {shuffledCases.length}: Denúncia Recebida</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="p-4 bg-muted rounded-lg">{currentCase.report}</p>
            <div className="space-y-3">
              {currentCase.options.map((opt, i) => (
                <button key={i} onClick={() => !showFeedback && setSelectedOption(i)}
                  className={`w-full p-4 rounded-lg border-2 text-left ${selectedOption === i ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  {opt}
                </button>
              ))}
            </div>
            {showFeedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{currentCase.explanation}</p>
              </motion.div>
            )}
            {!showFeedback ? (
              <Button onClick={handleConfirm} disabled={selectedOption === null} className="w-full">Confirmar</Button>
            ) : (
              <Button onClick={handleNext} className="w-full">{caseIndex < whistleblowerCases.length - 1 ? 'Próximo Caso' : 'Finalizar'}</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
