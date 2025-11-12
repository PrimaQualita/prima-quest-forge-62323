import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { regulamentosQuestions, shuffleArray } from '../data/expandedQuestions';
import { useGamificationStore } from '../store/useGamificationStore';
import { toast } from 'sonner';

interface ComplianceRunnerGameProps {
  onExit: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PHASES = [
  {
    name: "Escritório da Conformidade",
    background: '#e0f2fe',
    tokensRequired: 5,
    xpReward: 100,
  },
  {
    name: "Centro de Auditoria",
    background: '#dbeafe',
    tokensRequired: 8,
    xpReward: 150,
  },
  {
    name: "Proteção de Dados",
    background: '#bfdbfe',
    tokensRequired: 10,
    xpReward: 200,
  },
  {
    name: "Detecção de Fraudes",
    background: '#93c5fd',
    tokensRequired: 12,
    xpReward: 300,
  }
];

export const ComplianceRunnerGame = ({ onExit }: ComplianceRunnerGameProps) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [score, setScore] = useState(0);
  const [tokensCollected, setTokensCollected] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const { updateScore } = useGamificationStore();

  useEffect(() => {
    if (!gameContainerRef.current) return;

    class MainScene extends Phaser.Scene {
      private player?: Phaser.Physics.Arcade.Sprite;
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private platforms?: Phaser.Physics.Arcade.StaticGroup;
      private tokens?: Phaser.Physics.Arcade.Group;
      private enemies?: Phaser.Physics.Arcade.Group;
      private powerUps?: Phaser.Physics.Arcade.Group;
      private scoreText?: Phaser.GameObjects.Text;
      private phaseText?: Phaser.GameObjects.Text;
      private isPaused = false;

      constructor() {
        super({ key: 'MainScene' });
      }

      preload() {
        this.createPlayerSprite();
        this.createTokenSprite();
        this.createEnemySprite();
        this.createPowerUpSprite();
      }

      createPlayerSprite() {
        const graphics = this.make.graphics({});
        
        graphics.fillStyle(0x1e40af, 1);
        graphics.fillRect(12, 20, 24, 30);
        
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillCircle(24, 15, 12);
        
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(16, 12, 6, 4);
        graphics.fillRect(26, 12, 6, 4);
        graphics.strokeRect(15, 11, 8, 6);
        graphics.strokeRect(25, 11, 8, 6);
        
        graphics.fillStyle(0x10b981, 1);
        graphics.fillCircle(40, 30, 8);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(38, 26, 4, 8);
        graphics.fillRect(36, 28, 8, 4);
        
        graphics.generateTexture('player', 48, 64);
        graphics.destroy();
      }

      createTokenSprite() {
        const graphics = this.make.graphics({});
        
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillCircle(16, 16, 10);
        
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(10, 16);
        graphics.lineTo(14, 20);
        graphics.lineTo(22, 12);
        graphics.strokePath();
        
        graphics.generateTexture('token', 32, 32);
        graphics.destroy();
      }

      createEnemySprite() {
        const graphics = this.make.graphics({});
        
        graphics.fillStyle(0x1f2937, 1);
        graphics.fillCircle(20, 15, 12);
        graphics.fillRect(8, 25, 24, 30);
        
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(20, 10, 14);
        
        graphics.fillStyle(0xef4444, 1);
        graphics.fillCircle(15, 15, 3);
        graphics.fillCircle(25, 15, 3);
        
        graphics.fillStyle(0x374151, 1);
        graphics.fillRect(12, 40, 16, 10);
        graphics.fillStyle(0x10b981, 1);
        graphics.fillRect(14, 42, 12, 6);
        
        graphics.generateTexture('enemy', 40, 56);
        graphics.destroy();
      }

      createPowerUpSprite() {
        const graphics = this.make.graphics({});
        
        graphics.fillStyle(0x3b82f6, 1);
        graphics.beginPath();
        graphics.moveTo(16, 4);
        graphics.lineTo(28, 10);
        graphics.lineTo(28, 24);
        graphics.lineTo(16, 30);
        graphics.lineTo(4, 24);
        graphics.lineTo(4, 10);
        graphics.closePath();
        graphics.fillPath();
        
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(16, 17, 8);
        graphics.fillStyle(0x3b82f6, 1);
        graphics.fillCircle(16, 17, 6);
        
        graphics.generateTexture('powerup', 32, 34);
        graphics.destroy();
      }

      create() {
        const phase = PHASES[currentPhase];
        this.cameras.main.setBackgroundColor(phase.background);

        this.platforms = this.physics.add.staticGroup();
        
        for (let i = 0; i < 20; i++) {
          const platform = this.platforms.create(i * 64, 568, null) as Phaser.Physics.Arcade.Sprite;
          platform.setDisplaySize(64, 32);
          platform.setTint(0x059669);
          platform.refreshBody();
        }

        const platformPositions = [
          { x: 200, y: 450 }, { x: 400, y: 380 }, { x: 600, y: 320 },
          { x: 800, y: 380 }, { x: 1000, y: 450 }, { x: 300, y: 280 },
          { x: 700, y: 220 }, { x: 900, y: 280 }
        ];

        platformPositions.forEach(pos => {
          const platform = this.platforms!.create(pos.x, pos.y, null) as Phaser.Physics.Arcade.Sprite;
          platform.setDisplaySize(150, 20);
          platform.setTint(0x10b981);
          platform.refreshBody();
        });

        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.8);

        this.tokens = this.physics.add.group();
        const tokenPositions = [
          { x: 200, y: 400 }, { x: 400, y: 330 }, { x: 600, y: 270 },
          { x: 800, y: 330 }, { x: 1000, y: 400 }, { x: 300, y: 230 },
          { x: 700, y: 170 }, { x: 900, y: 230 }, { x: 150, y: 500 },
          { x: 450, y: 500 }, { x: 750, y: 500 }, { x: 1050, y: 500 }
        ];

        tokenPositions.slice(0, phase.tokensRequired).forEach(pos => {
          const token = this.tokens!.create(pos.x, pos.y, 'token') as Phaser.Physics.Arcade.Sprite;
          token.setBounce(0.3);
          token.setCollideWorldBounds(true);
          token.setVelocity(Phaser.Math.Between(-50, 50), 20);
        });

        this.enemies = this.physics.add.group();
        const enemyCount = Math.min(3 + currentPhase, 6);
        for (let i = 0; i < enemyCount; i++) {
          const x = Phaser.Math.Between(300, 1000);
          const enemy = this.enemies.create(x, 0, 'enemy') as Phaser.Physics.Arcade.Sprite;
          enemy.setBounce(0.5);
          enemy.setCollideWorldBounds(true);
          enemy.setVelocity(Phaser.Math.Between(-100, 100), 20);
          enemy.setScale(0.7);
        }

        this.powerUps = this.physics.add.group();
        const powerUpCount = Math.min(2 + currentPhase, 4);
        for (let i = 0; i < powerUpCount; i++) {
          const x = Phaser.Math.Between(200, 1000);
          const powerUp = this.powerUps.create(x, 100, 'powerup') as Phaser.Physics.Arcade.Sprite;
          powerUp.setBounce(0.4);
          powerUp.setCollideWorldBounds(true);
        }

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.tokens, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.powerUps, this.platforms);

        this.physics.add.overlap(
          this.player,
          this.tokens,
          this.collectToken as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );

        this.physics.add.overlap(
          this.player,
          this.enemies,
          this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );

        this.physics.add.overlap(
          this.player,
          this.powerUps,
          this.collectPowerUp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this
        );

        this.cursors = this.input.keyboard?.createCursorKeys();

        this.scoreText = this.add.text(16, 16, `Tokens: 0/${phase.tokensRequired}`, {
          fontSize: '20px',
          color: '#000',
          backgroundColor: '#fff',
          padding: { x: 10, y: 5 }
        });

        this.phaseText = this.add.text(16, 50, `Fase ${currentPhase + 1}: ${phase.name}`, {
          fontSize: '18px',
          color: '#000',
          backgroundColor: '#fff',
          padding: { x: 10, y: 5 }
        });

        this.cameras.main.setBounds(0, 0, 1280, 600);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      }

      collectToken(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        token: Phaser.Types.Physics.Arcade.GameObjectWithBody
      ) {
        const tokenSprite = token as Phaser.Physics.Arcade.Sprite;
        tokenSprite.disableBody(true, true);

        const newTokens = tokensCollected + 1;
        setTokensCollected(newTokens);
        setScore(prev => prev + 50);

        const phase = PHASES[currentPhase];
        this.scoreText?.setText(`Tokens: ${newTokens}/${phase.tokensRequired}`);

        this.isPaused = true;
        this.physics.pause();
        this.showRandomQuestion();
      }

      collectPowerUp(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        powerUp: Phaser.Types.Physics.Arcade.GameObjectWithBody
      ) {
        const powerUpSprite = powerUp as Phaser.Physics.Arcade.Sprite;
        powerUpSprite.disableBody(true, true);

        setScore(prev => prev + 100);

        (player as Phaser.Physics.Arcade.Sprite).setTint(0x3b82f6);
        this.time.delayedCall(5000, () => {
          (player as Phaser.Physics.Arcade.Sprite).clearTint();
        });
      }

      hitEnemy(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
      ) {
        const playerSprite = player as Phaser.Physics.Arcade.Sprite;
        
        if (playerSprite.tint !== 0x3b82f6) {
          playerSprite.setTint(0xff0000);
          playerSprite.setVelocityY(-300);
          setScore(prev => Math.max(0, prev - 25));

          this.time.delayedCall(1000, () => {
            playerSprite.clearTint();
          });
        }
      }

      showRandomQuestion() {
        const availableIndices = regulamentosQuestions
          .map((_, idx) => idx)
          .filter(idx => !usedQuestions.has(idx));

        if (availableIndices.length === 0) {
          this.resumeGame();
          return;
        }

        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const question = regulamentosQuestions[randomIndex];

        setUsedQuestions(prev => new Set([...prev, randomIndex]));
        
        // Embaralhar as opções
        const correctAnswer = question.options[question.correctIndex];
        const shuffledOptions = shuffleArray([...question.options]);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

        setCurrentQuestion({
          question: question.question,
          options: shuffledOptions,
          correctIndex: newCorrectIndex,
          explanation: question.explanation
        });
        setShowQuestion(true);
      }

      resumeGame() {
        this.isPaused = false;
        this.physics.resume();
      }

      update() {
        if (this.isPaused || !this.player || !this.cursors) return;

        const phase = PHASES[currentPhase];

        if (tokensCollected >= phase.tokensRequired) {
          this.physics.pause();
          this.time.delayedCall(1000, async () => {
            if (currentPhase < PHASES.length - 1) {
              await updateScore('compliance-runner', phase.xpReward);
              toast.success(`Fase ${currentPhase + 1} completa! +${phase.xpReward} XP`);
              setCurrentPhase(prev => prev + 1);
              setTokensCollected(0);
              this.scene.restart();
            } else {
              await updateScore('compliance-runner', phase.xpReward);
              setIsGameComplete(true);
            }
          });
          return;
        }

        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-200);
          this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(200);
          this.player.setFlipX(false);
        } else {
          this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
          this.player.setVelocityY(-400);
        }

        if (this.cursors.down.isDown) {
          this.player.setScale(0.8, 0.5);
        } else {
          this.player.setScale(0.8, 0.8);
        }

        this.enemies?.children.entries.forEach((enemy) => {
          const sprite = enemy as Phaser.Physics.Arcade.Sprite;
          if (sprite.body?.blocked.right || sprite.body?.blocked.left) {
            sprite.setVelocityX(-sprite.body.velocity.x);
          }
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 1280,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 800 },
          debug: false
        }
      },
      scene: MainScene,
      backgroundColor: PHASES[currentPhase].background
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
    };
  }, [currentPhase]);

  const handleAnswerQuestion = (selectedIndex: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    
    if (isCorrect) {
      setScore(prev => prev + 100);
      toast.success('Correto! +100 pontos', {
        description: currentQuestion.explanation
      });
    } else {
      setScore(prev => Math.max(0, prev - 50));
      toast.error('Resposta incorreta!', {
        description: currentQuestion.explanation
      });
    }

    setTimeout(() => {
      setShowQuestion(false);
      setCurrentQuestion(null);
      
      const scene = gameRef.current?.scene.scenes[0] as any;
      if (scene && scene.resumeGame) {
        scene.resumeGame();
      }
    }, 2000);
  };

  if (isGameComplete) {
    const totalXP = PHASES.reduce((sum, phase) => sum + phase.xpReward, 0);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="p-8 max-w-md">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Parabéns!</h2>
            <p className="text-lg mb-6">
              Você completou todas as fases da Corrida Compliance!
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-2xl font-bold text-primary">
                Pontuação Final: {score}
              </p>
              <p className="text-lg">
                XP Ganho: +{totalXP}
              </p>
            </div>
            <Button onClick={onExit} size="lg" className="w-full">
              Voltar ao Menu
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 flex items-center justify-between bg-card border-b">
        <Button variant="ghost" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sair
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-bold">Corrida Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Fase {currentPhase + 1}/{PHASES.length}: {PHASES[currentPhase].name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">Pontuação: {score}</p>
        </div>
      </div>

      <div className="flex justify-center p-4">
        <div ref={gameContainerRef} className="rounded-lg overflow-hidden shadow-2xl" />
      </div>

      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>Use as setas ← → para mover, ↑ para pular, ↓ para agachar</p>
        <p>Colete tokens de compliance e responda perguntas!</p>
      </div>

      <AnimatePresence>
        {showQuestion && currentQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <Card className="p-6 max-w-2xl">
                <h3 className="text-xl font-bold mb-4">Desafio de Compliance</h3>
                <p className="mb-6 text-lg">{currentQuestion.question}</p>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswerQuestion(index)}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-3 px-4"
                    >
                      <span className="font-bold mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
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
