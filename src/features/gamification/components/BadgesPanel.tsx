import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeType } from '../types';
import { Award } from 'lucide-react';

interface BadgesPanelProps {
  badges: BadgeType[];
}

/**
 * Painel de medalhas conquistadas
 */
export const BadgesPanel = ({ badges }: BadgesPanelProps) => {
  const unlockedBadges = badges.filter(b => b.unlocked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Conquistas ({unlockedBadges.length}/{badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                badge.unlocked
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-muted/20 opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className={`text-sm font-medium ${badge.unlocked ? '' : 'text-muted-foreground'}`}>
                {badge.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
