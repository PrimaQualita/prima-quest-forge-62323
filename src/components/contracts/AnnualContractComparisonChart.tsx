import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Contract {
  id: string;
  name: string;
}

interface AnnualContractComparisonChartProps {
  contracts: Contract[];
  year: number;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const AnnualContractComparisonChart = ({ contracts, year }: AnnualContractComparisonChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"anual" | number>("anual");

  // Fetch all docs for the year with month info
  const { data: allDocs } = useQuery({
    queryKey: ['contract-annual-comparison-monthly', contracts?.map(c => c.id), year],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const ids = contracts.map(c => c.id);
      const { data } = await supabase
        .from('contract_documents')
        .select('contract_id, month')
        .in('contract_id', ids)
        .eq('year', year);
      return data || [];
    },
    enabled: contracts && contracts.length > 0,
  });

  const chartData = useMemo(() => {
    if (!contracts || !allDocs) return [];

    const filtered = selectedPeriod === "anual"
      ? allDocs
      : allDocs.filter(d => d.month === selectedPeriod);

    const countMap = new Map<string, number>();
    filtered.forEach(d => {
      countMap.set(d.contract_id, (countMap.get(d.contract_id) || 0) + 1);
    });

    const stats = contracts.map(contract => ({
      name: contract.name.length > 22 ? contract.name.substring(0, 20) + '…' : contract.name,
      fullName: contract.name,
      count: countMap.get(contract.id) || 0,
      average: 0,
    }));

    const total = stats.reduce((s, st) => s + st.count, 0);
    const avg = stats.length > 0 ? Math.round(total / stats.length) : 0;
    stats.forEach(st => (st.average = avg));

    return stats;
  }, [contracts, allDocs, selectedPeriod]);

  const totalDocuments = chartData.reduce((sum, s) => sum + s.count, 0);
  const averagePerContract = chartData.length > 0 ? Math.round(totalDocuments / chartData.length) : 0;

  const periodLabel = selectedPeriod === "anual"
    ? `${year}`
    : `${MONTH_LABELS[(selectedPeriod as number) - 1]}/${year}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const isAbove = data.count >= data.average;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.fullName}</p>
        <p style={{ color: isAbove ? 'hsl(142, 76%, 36%)' : 'hsl(var(--destructive))' }}>
          {data.count} análise(s) em {periodLabel}
        </p>
        <p className="text-muted-foreground mt-1">
          Média geral: {data.average} análises
        </p>
        {totalDocuments > 0 && (
          <p className="text-muted-foreground">
            {((data.count / totalDocuments) * 100).toFixed(1)}% do total
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="col-span-full border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span>Comparativo Anual de Análises por Contrato</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-normal text-muted-foreground">
                  Total: {totalDocuments} análises · Média: {averagePerContract}/contrato
                </span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{periodLabel}</span>
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedPeriod("anual")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedPeriod === "anual"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Anual
                </button>
                {MONTH_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPeriod(i + 1)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedPeriod === i + 1
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!chartData || chartData.length === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Nenhum contrato cadastrado
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <defs>
                    <linearGradient id="barAbove" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="barBelow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Análises', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } 
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    name="Média"
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                    name="Análises"
                    label={({ x, y, width, value }: any) => {
                      const percentage = totalDocuments > 0 ? ((value / totalDocuments) * 100).toFixed(1) : '0';
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          fill="hsl(var(--muted-foreground))"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={500}
                        >
                          {percentage}%
                        </text>
                      );
                    }}
                  >
                    {chartData?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === 0 ? 'hsl(var(--muted))' : entry.count >= entry.average ? 'url(#barAbove)' : 'url(#barBelow)'}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(142, 76%, 36%)' }} />
                  <span className="text-muted-foreground">Acima da média</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--destructive))' }} />
                  <span className="text-muted-foreground">Abaixo da média</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 border-t-2 border-dashed border-muted-foreground" />
                  <span className="text-muted-foreground">Média geral</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
