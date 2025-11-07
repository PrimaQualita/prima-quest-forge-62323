import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { RankingPlayer } from '../types';

interface RankingPanelProps {
  ranking: RankingPlayer[];
  currentUserName: string;
}

/**
 * Painel de ranking dos jogadores
 */
export const RankingPanel = ({ ranking, currentUserName }: RankingPanelProps) => {
  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 2) return <Award className="w-5 h-5 text-orange-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{position + 1}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.slice(0, 10).map((player, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                player.name === currentUserName
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getMedalIcon(index)}
                <div>
                  <p className={`font-medium ${player.name === currentUserName ? 'text-primary' : ''}`}>
                    {player.name}
                    {player.name === currentUserName && (
                      <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{player.level}</p>
                </div>
              </div>
              <span className="font-bold text-primary">{player.totalScore} XP</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
