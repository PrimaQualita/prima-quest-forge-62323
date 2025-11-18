import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGamificationStore } from '../store/useGamificationStore';
import { ArrowLeft, Heart, Shield, AlertTriangle, Database, Lock } from 'lucide-react';

interface FallingObject {
  id: string;
  type: 'data' | 'hacker' | 'bonus';
  x: number;
  y: number;
  icon: string;
  speed: number;
}

export const DataGuardianGame = ({ onExit }: { onExit: () => void }) => {
  const [guardianX, setGuardianX] = useState(50);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const { updateScore, unlockBadge } = useGamificationStore();

  const dataIcons = ['📄', '💾', '🔐', '📊', '🗄️'];
  const hackerIcons = ['🦹', '💣', '🔓', '⚠️', '🚨'];
  const bonusIcons = ['🛡️', '⭐', '💎'];

  const moveGuardian = useCallback((direction: 'left' | 'right') => {
    setGuardianX(prev => {
      if (direction === 'left') return Math.max(5, prev - 8);
      return Math.min(95, prev + 8);
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

    const spawnRate = Math.max(400, 1000 - (level * 50));
    const spawnInterval = setInterval(() => {
      const rand = Math.random();
      let type: 'data' | 'hacker' | 'bonus';
      let icon: string;
      let speed: number;

      if (rand > 0.95) {
        type = 'bonus';
        icon = bonusIcons[Math.floor(Math.random() * bonusIcons.length)];
        speed = 3 + (level * 0.5);
      } else if (rand > 0.4) {
        type = 'data';
        icon = dataIcons[Math.floor(Math.random() * dataIcons.length)];
        speed = 4 + (level * 0.3);
      } else {
        type = 'hacker';
        icon = hackerIcons[Math.floor(Math.random() * hackerIcons.length)];
        speed = 5 + (level * 0.4);
      }

      const newObject: FallingObject = {
        id: Math.random().toString(),
        type,
        x: Math.random() * 85 + 5,
        y: 0,
        icon,
        speed
      };
      setObjects(prev => [...prev, newObject]);
    }, spawnRate);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, level]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      setObjects(prev => {
        const updated = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));
        
        updated.forEach(obj => {
          if (obj.y >= 82 && obj.y <= 95 && Math.abs(obj.x - guardianX) < 10) {
            if (obj.type === 'data') {
              const points = 10 + (combo * 2);
              setScore(s => s + points);
              setCombo(c => c + 1);
              setShowCombo(true);
              setTimeout(() => setShowCombo(false), 500);
            } else if (obj.type === 'bonus') {
              setScore(s => s + 50);
              setLives(l => Math.min(5, l + 1));
            } else {
              setLives(l => l - 1);
              setCombo(0);
            }
            obj.y = 100;
          } else if (obj.y > 95) {
            if (obj.type === 'data') {
              setCombo(0);
            }
          }
        });

        return updated.filter(obj => obj.y < 100);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, guardianX, combo]);

  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      updateScore('data-guardian', score);
      if (score >= 100) unlockBadge('guardiao_dados');
    }
  }, [lives]);

  useEffect(() => {
    if (score > 0 && score % 200 === 0) {
      setLevel(l => l + 1);
    }
  }, [score]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setLives(3);
    setObjects([]);
    setGameOver(false);
    setLevel(1);
    setCombo(0);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-background to-green-950 p-4 flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <Card className="max-w-2xl w-full border-2 border-primary/20 shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-green-500/10">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">
                🛡️
              </motion.div>
              <CardTitle className="text-3xl">Guardião dos Dados</CardTitle>
              <p className="text-muted-foreground mt-2">Proteja informações sensíveis de ataques cibernéticos</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-gradient-to-br from-primary/5 to-green-500/5 p-6 rounded-lg border border-primary/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Como Jogar:
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2"><span className="text-xl">⌨️</span><span>Use as <strong>setas ← →</strong> do teclado para mover o guardião</span></li>
                  <li className="flex items-start gap-2"><span className="text-xl">📄</span><span><strong>Colete dados protegidos</strong> para ganhar pontos (10+ pts com combo!)</span></li>
                  <li className="flex items-start gap-2"><span className="text-xl">🦹</span><span><strong>Evite hackers e ameaças</strong> para não perder vidas</span></li>
                  <li className="flex items-start gap-2"><span className="text-xl">⭐</span><span><strong>Itens bônus raros</strong> restauram vida e dão 50 pontos!</span></li>
                  <li className="flex items-start gap-2"><Heart className="h-5 w-5 text-red-500 mt-0.5" /><span>Você tem <strong>3 vidas</strong>. A dificuldade aumenta a cada nível!</span></li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onExit} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-primary to-green-600"><Shield className="h-4 w-4 mr-2" />Iniciar Missão</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-background to-green-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onExit} className="hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4 mr-2" />Sair
          </Button>
          <div className="flex gap-4 items-center">
            <Badge variant="outline" className="text-lg px-4 py-2 bg-primary/10 border-primary/30">
              <Database className="h-4 w-4 mr-2" />{score} pts
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-blue-500/10 border-blue-500/30">Nível {level}</Badge>
            <div className="flex gap-1">
              {Array.from({ length: lives }).map((_, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>
                  <Heart className="h-6 w-6 fill-red-500 text-red-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-b from-blue-900/30 via-blue-800/20 to-green-900/30 border-2 border-primary/20 shadow-2xl" style={{ height: '600px' }}>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          
          <AnimatePresence>
            {showCombo && combo > 1 && (
              <motion.div initial={{ scale: 0, y: -20, opacity: 0 }} animate={{ scale: 1.5, y: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                <Badge className="text-2xl px-6 py-2 bg-yellow-500 text-black font-bold shadow-lg">🔥 COMBO x{combo}!</Badge>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0">
            <AnimatePresence>
              {objects.map(obj => (
                <motion.div key={obj.id} className={`absolute text-4xl ${obj.type === 'bonus' ? 'animate-pulse' : ''}`}
                  style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%, -50%)', filter: obj.type === 'bonus' ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' : 'none' }}
                  initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} transition={{ duration: 0.3 }}>
                  {obj.icon}
                </motion.div>
              ))}
            </AnimatePresence>
            
            <motion.div className="absolute bottom-4 text-6xl drop-shadow-2xl" style={{ left: `${guardianX}%`, transform: 'translateX(-50%)', filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))' }}
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
              🛡️
            </motion.div>
          </div>
        </Card>

        <div className="mt-4 flex gap-4 justify-center">
          <Button size="lg" variant="outline" onClick={() => moveGuardian('left')} onTouchStart={() => moveGuardian('left')} className="hover:bg-primary/20">← Esquerda</Button>
          <Button size="lg" variant="outline" onClick={() => moveGuardian('right')} onTouchStart={() => moveGuardian('right')} className="hover:bg-primary/20">Direita →</Button>
        </div>
      </div>
    </div>
  );
};
