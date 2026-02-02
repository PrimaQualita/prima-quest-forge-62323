import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGamificationStore } from '../store/useGamificationStore';
import { getShuffledWhistleblowerCases } from '../data/whistleblowerExpandedCases';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { WhistleblowerCase } from '../types';

type ShuffledCase = WhistleblowerCase & { correctIndex: number };

export const WhistleblowerGame = ({ onExit }: { onExit: () => void }) => {
  const [shuffledCases, setShuffledCases] = useState<ShuffledCase[]>([]);
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [metrics, setMetrics] = useState({ trust: 50, risk: 50, reputation: 50 });
  const [gameOver, setGameOver] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();
  
  // Ref para evitar múltiplas chamadas de finalização
  const hasFinalized = useRef(false);

  // Carrega casos embaralhados ao iniciar - sempre diferentes a cada sessão
  useEffect(() => {
    const cases = getShuffledWhistleblowerCases(10);
    setShuffledCases(cases);
  }, []);

  // Se ainda não carregou os casos
  if (shuffledCases.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando casos...</p>
      </div>
    );
  }

  const currentCase = shuffledCases[caseIndex];
  
  // Verifica se a resposta selecionada é a correta
  const isCorrectAnswer = selectedOption === currentCase.correctIndex;

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    // Aplica impactos baseados na resposta correta
    if (isCorrectAnswer) {
      setCorrectAnswers(prev => prev + 1);
      setMetrics(prev => ({
        trust: Math.max(0, Math.min(100, prev.trust + Math.abs(currentCase.impacts.trust))),
        risk: Math.max(0, Math.min(100, prev.risk + currentCase.impacts.risk)),
        reputation: Math.max(0, Math.min(100, prev.reputation + Math.abs(currentCase.impacts.reputation)))
      }));
    } else {
      // Resposta errada: impacto negativo
      setMetrics(prev => ({
        trust: Math.max(0, Math.min(100, prev.trust - 10)),
        risk: Math.max(0, Math.min(100, prev.risk + 15)),
        reputation: Math.max(0, Math.min(100, prev.reputation - 10))
      }));
    }
    setShowFeedback(true);
  };

  const handleNext = async () => {
    if (caseIndex < shuffledCases.length - 1) {
      setCaseIndex(caseIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Evita múltiplas finalizações
      if (hasFinalized.current) return;
      hasFinalized.current = true;
      
      setIsLoading(true);
      
      // Calcula score baseado em acertos
      const score = Math.round((correctAnswers / shuffledCases.length) * 100);
      
      try {
        await updateScore('whistleblower-decision', score);
        if (score >= 70) {
          unlockBadge('guardiao_canal_denuncias');
        }
      } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        // Continua mesmo com erro
      } finally {
        setIsLoading(false);
        setGameOver(true);
      }
    }
  };

  if (gameOver) {
    const finalScore = Math.round((correctAnswers / shuffledCases.length) * 100);
    
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📢</div>
            <CardTitle>Avaliação Final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-primary">{correctAnswers}/{shuffledCases.length}</p>
              <p className="text-muted-foreground">Decisões corretas</p>
            </div>
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
            <p className="text-center">
              {finalScore >= 70 
                ? 'Parabéns! Sua atuação fortalece a cultura de denúncia responsável!' 
                : 'Continue praticando! Revise os procedimentos do canal de denúncias.'}
            </p>
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
              {currentCase.options.map((opt, i) => {
                let buttonClass = 'w-full p-4 rounded-lg border-2 text-left transition-colors ';
                
                if (showFeedback) {
                  if (i === currentCase.correctIndex) {
                    buttonClass += 'border-secondary bg-secondary/20';
                  } else if (i === selectedOption && i !== currentCase.correctIndex) {
                    buttonClass += 'border-destructive bg-destructive/10';
                  } else {
                    buttonClass += 'border-border opacity-50';
                  }
                } else {
                  buttonClass += selectedOption === i ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50';
                }
                
                return (
                  <button 
                    key={i} 
                    onClick={() => !showFeedback && setSelectedOption(i)}
                    disabled={showFeedback}
                    className={buttonClass}
                  >
                    <div className="flex items-start gap-3">
                      {showFeedback && i === currentCase.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      )}
                      {showFeedback && i === selectedOption && i !== currentCase.correctIndex && (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`p-4 rounded-lg ${isCorrectAnswer ? 'bg-secondary/20 border border-secondary' : 'bg-destructive/10 border border-destructive/30'}`}
              >
                <p className="font-semibold mb-2">
                  {isCorrectAnswer ? '✅ Resposta Correta!' : '❌ Resposta Incorreta'}
                </p>
                <p className="text-sm">{currentCase.explanation}</p>
              </motion.div>
            )}
            {!showFeedback ? (
              <Button onClick={handleConfirm} disabled={selectedOption === null} className="w-full">Confirmar</Button>
            ) : (
              <Button onClick={handleNext} disabled={isLoading} className="w-full">
                {isLoading ? 'Salvando...' : caseIndex < shuffledCases.length - 1 ? 'Próximo Caso' : 'Finalizar'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};