import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RankingPlayer } from '../types';
import { Trophy, Medal, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface RankingPanelProps {
  ranking: RankingPlayer[];
  currentUserName: string;
}

/**
 * Painel de ranking dos jogadores com paginação
 */
export const RankingPanel = ({ ranking, currentUserName }: RankingPanelProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(ranking.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRanking = ranking.slice(startIndex, endIndex);

  const getMedalIcon = (position: number) => {
    switch(position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Ranking ({ranking.length} colaboradores)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de paginação superior */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Página {currentPage} de {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de ranking */}
        <div className="space-y-3">
          {currentRanking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            currentRanking.map((player, index) => {
              const position = startIndex + index + 1;
              const isCurrentUser = player.name === currentUserName;

              return (
                <div
                  key={`${player.name}-${position}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isCurrentUser
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getMedalIcon(position)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{player.name}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">Você</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{player.level}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">{player.totalScore} XP</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info de posição do usuário atual */}
        {ranking.length > 0 && (
          <div className="pt-2 border-t text-center text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, ranking.length)} de {ranking.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
