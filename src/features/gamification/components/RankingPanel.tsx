import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RankingPlayer } from '../types';
import { useGamificationStore } from '../store/useGamificationStore';
import { Trophy, Medal, Award, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface RankingPanelProps {
  ranking: RankingPlayer[];
  currentUserName: string;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/**
 * Painel de ranking dos jogadores com filtros mensal/anual e paginação
 */
export const RankingPanel = ({ ranking, currentUserName }: RankingPanelProps) => {
  const { loadRankingByPeriod } = useGamificationStore();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Default to current month/year
  const defaultMonth = currentMonth;
  const defaultYear = currentYear;

  const [viewMode, setViewMode] = useState<'mensal' | 'anual'>('mensal');
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [filteredRanking, setFilteredRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Available years (current and 2 previous)
  const availableYears = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 2; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Load filtered ranking when filters change
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await loadRankingByPeriod(
          selectedYear,
          viewMode === 'mensal' ? selectedMonth : undefined
        );
        setFilteredRanking(data);
        setCurrentPage(1);
      } catch (e) {
        console.error('Erro ao carregar ranking filtrado:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewMode, selectedYear, selectedMonth, loadRankingByPeriod]);

  const displayRanking = filteredRanking;
  const totalPages = Math.ceil(displayRanking.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRanking = displayRanking.slice(startIndex, endIndex);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const periodLabel = viewMode === 'mensal'
    ? `${MONTH_FULL[selectedMonth - 1]} ${selectedYear}`
    : `Ano ${selectedYear}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Ranking
        </CardTitle>
        
        {/* Tabs Mensal / Anual */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'mensal' | 'anual')} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="mensal" className="flex-1 text-xs">Mensal</TabsTrigger>
            <TabsTrigger value="anual" className="flex-1 text-xs">Anual</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Year selector */}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {availableYears.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                selectedYear === y
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Month selector (only for mensal) */}
        {viewMode === 'mensal' && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {MONTH_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setSelectedMonth(i + 1)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                  selectedMonth === i + 1
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Period label */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{periodLabel} — {displayRanking.length} colaboradores</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pagination controls */}
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

        {/* Ranking list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando ranking...
            </div>
          ) : currentRanking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pontuação registrada neste período
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

        {/* Footer info */}
        {displayRanking.length > 0 && (
          <div className="pt-2 border-t text-center text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, displayRanking.length)} de {displayRanking.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
