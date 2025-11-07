import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { complianceActions } from '../data/gameData';
import { ArrowLeft, DollarSign, Clock } from 'lucide-react';

export const ComplianceTycoonGame = ({ onExit }: { onExit: () => void }) => {
  const [round, setRound] = useState(1);
  const [budget, setBudget] = useState(100);
  const [time, setTime] = useState(100);
  const [metrics, setMetrics] = useState({ compliance: 20, reputation: 20, engagement: 20, maturity: 20 });
  const [gameOver, setGameOver] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();

  const maxRounds = 5;

  const handleAction = (action: typeof complianceActions[0]) => {
    if (budget < action.budgetCost || time < action.timeCost) return;

    setBudget(b => b - action.budgetCost);
    setTime(t => t - action.timeCost);
    setMetrics(m => ({
      compliance: Math.min(100, m.compliance + action.effects.compliance),
      reputation: Math.min(100, m.reputation + action.effects.reputation),
      engagement: Math.min(100, m.engagement + action.effects.engagement),
      maturity: Math.min(100, m.maturity + action.effects.maturity)
    }));
  };

  const nextRound = () => {
    if (round >= maxRounds) {
      const avgMetric = (metrics.compliance + metrics.reputation + metrics.engagement + metrics.maturity) / 4;
      const score = Math.round(avgMetric * 2);
      updateScore('compliance-tycoon', score);
      if (avgMetric >= 70) unlockBadge('estrategista_compliance');
      setGameOver(true);
    } else {
      setRound(round + 1);
      setBudget(100);
      setTime(100);
    }
  };

  if (gameOver) {
    const avg = (metrics.compliance + metrics.reputation + metrics.engagement + metrics.maturity) / 4;
    const level = avg >= 80 ? 'Avançada' : avg >= 50 ? 'Intermediária' : 'Inicial';
    
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center"><div className="text-6xl mb-4">💼</div><CardTitle>Resultado Final</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center"><p className="text-4xl font-bold text-primary">Maturidade: {level}</p></div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} className="p-3 bg-muted rounded-lg"><Progress value={val} className="h-2 mb-2" /><p className="text-sm capitalize">{key}: {val}</p></div>
              ))}
            </div>
            <Button onClick={onExit} className="w-full">Voltar ao Menu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onExit}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
          <Badge>Rodada {round}/{maxRounds}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics).map(([key, val]) => (
            <Card key={key}><CardContent className="p-4"><Progress value={val} className="h-2 mb-2" /><p className="text-sm capitalize">{key}: {val}</p></CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-2"><DollarSign className="w-5 h-5" /><span className="font-bold">Orçamento: {budget}</span></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-2"><Clock className="w-5 h-5" /><span className="font-bold">Tempo: {time}</span></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complianceActions.map(action => (
            <Card key={action.id} className={budget < action.budgetCost || time < action.timeCost ? 'opacity-50' : ''}>
              <CardHeader><CardTitle className="text-lg">{action.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <div className="flex gap-2 text-sm"><Badge variant="outline">💰 {action.budgetCost}</Badge><Badge variant="outline">⏰ {action.timeCost}</Badge></div>
                <Button onClick={() => handleAction(action)} disabled={budget < action.budgetCost || time < action.timeCost} className="w-full" size="sm">Executar</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={nextRound} className="w-full" size="lg">Próxima Rodada</Button>
      </div>
    </div>
  );
};
