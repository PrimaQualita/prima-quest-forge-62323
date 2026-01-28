import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeType } from '../types';
import { Award } from 'lucide-react';
import { availableBadges } from '../data/gameData';

interface BadgesPanelProps {
  badges: BadgeType[];
}

/**
 * Painel de medalhas conquistadas
 * Filtra para mostrar apenas badges que existem nos jogos atuais
 */
export const BadgesPanel = ({ badges }: BadgesPanelProps) => {
  // Filtra para mostrar apenas badges que existem na lista atual de jogos
  const validBadgeIds = availableBadges.map(b => b.id);
  
  // Mescla badges do usuário com os badges válidos atuais
  const filteredBadges = availableBadges.map(validBadge => {
    const userBadge = badges.find(b => b.id === validBadge.id);
    return {
      ...validBadge,
      unlocked: userBadge?.unlocked || false
    };
  });

  const unlockedBadges = filteredBadges.filter(b => b.unlocked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Conquistas ({unlockedBadges.length}/{filteredBadges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => (
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
