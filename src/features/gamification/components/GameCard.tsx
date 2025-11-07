import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameInfo } from '../types';

interface GameCardProps {
  game: GameInfo;
  onPlay: () => void;
}

/**
 * Card de jogo com animações e informações
 */
export const GameCard = ({ game, onPlay }: GameCardProps) => {
  const difficultyColors = {
    'Fácil': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Intermediário': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'Avançado': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
            {game.icon}
          </div>
          <CardTitle className="text-xl">{game.name}</CardTitle>
          <CardDescription className="text-sm">{game.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="outline" className={difficultyColors[game.difficulty]}>
            {game.difficulty}
          </Badge>
          <Button 
            onClick={onPlay} 
            className="w-full"
            size="lg"
          >
            Jogar agora
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
