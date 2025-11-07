import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { ArrowLeft, Heart } from 'lucide-react';

interface FallingObject {
  id: string;
  type: 'data' | 'hacker';
  x: number;
  y: number;
  icon: string;
}

export const DataGuardianGame = ({ onExit }: { onExit: () => void }) => {
  const [guardianX, setGuardianX] = useState(50);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();

  const moveGuardian = useCallback((direction: 'left' | 'right') => {
    setGuardianX(prev => {
      if (direction === 'left') return Math.max(10, prev - 10);
      return Math.min(90, prev + 10);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveGuardian('left');
      if (e.key === 'ArrowRight') moveGuardian('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveGuardian]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      const newObject: FallingObject = {
        id: Math.random().toString(),
        type: Math.random() > 0.3 ? 'data' : 'hacker',
        x: Math.random() * 90 + 5,
        y: 0,
        icon: Math.random() > 0.3 ? '📄' : '🦹'
      };
      setObjects(prev => [...prev, newObject]);
    }, 1000);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      setObjects(prev => {
        const updated = prev.map(obj => ({ ...obj, y: obj.y + 5 }));
        
        updated.forEach(obj => {
          if (obj.y >= 85 && obj.y <= 95 && Math.abs(obj.x - guardianX) < 8) {
            if (obj.type === 'data') {
              setScore(s => s + 10);
            } else {
              setLives(l => l - 1);
            }
            obj.y = 100;
          } else if (obj.y > 95 && obj.type === 'data') {
            setScore(s => Math.max(0, s - 5));
          }
        });

        return updated.filter(obj => obj.y < 100);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, guardianX]);

  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      updateScore('data-guardian', score);
      if (score >= 100) unlockBadge('guardiao_dados');
    }
  }, [lives]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setLives(3);
    setObjects([]);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{score >= 100 ? '🏆' : '🛡️'}</div>
            <CardTitle>Jogo Finalizado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div>
              <p className="text-5xl font-bold text-primary">{score}</p>
              <p className="text-muted-foreground">Pontos</p>
            </div>
            <p>{score >= 100 ? 'Excelente guardião de dados!' : 'Continue praticando proteção de dados!'}</p>
            <div className="flex gap-3">
              <Button onClick={startGame} variant="outline" className="flex-1">Jogar Novamente</Button>
              <Button onClick={onExit} className="flex-1">Voltar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <CardTitle>Guardião dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Proteja os dados pessoais! Use as setas ← → ou os botões para mover o guardião.</p>
            <div className="space-y-2 text-sm">
              <p>📄 Colete dados = +10 pontos</p>
              <p>🦹 Evite hackers = -1 vida</p>
              <p>📄 Dado perdido = -5 pontos</p>
            </div>
            <Button onClick={startGame} className="w-full" size="lg">Iniciar Jogo</Button>
            <Button onClick={onExit} variant="outline" className="w-full">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onExit}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
          <div className="flex gap-4">
            <Badge>Pontos: {score}</Badge>
            <Badge variant="destructive"><Heart className="w-4 h-4 mr-1" />Vidas: {lives}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative w-full h-96 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 overflow-hidden">
              {objects.map(obj => (
                <motion.div
                  key={obj.id}
                  className="absolute text-3xl"
                  style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
                >
                  {obj.icon}
                </motion.div>
              ))}
              <div className="absolute bottom-4 text-5xl transition-all duration-100" style={{ left: `${guardianX}%`, transform: 'translateX(-50%)' }}>
                🛡️
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => moveGuardian('left')}>← Esquerda</Button>
          <Button size="lg" onClick={() => moveGuardian('right')}>Direita →</Button>
        </div>
      </div>
    </div>
  );
};
