import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Contract {
  id: string;
  name: string;
}

interface AnnualContractComparisonChartProps {
  contracts: Contract[];
  year?: number;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Dynamic color based on rank: green (highest) → blue → yellow → red (lowest)
const VALUE_GRADIENT = [
  "#16a34a", "#22c55e", "#4ade80", "#86efac",
  "#3b82f6", "#60a5fa", "#93c5fd",
  "#facc15", "#fbbf24", "#f59e0b",
  "#f87171", "#ef4444",
];

function getColorsByRank(data: { count: number }[]) {
  const uniqueValues = [...new Set(data.map(d => d.count))].sort((a, b) => b - a);
  const step = (VALUE_GRADIENT.length - 1) / Math.max(uniqueValues.length - 1, 1);
  const valueToColor = new Map<number, string>();
  uniqueValues.forEach((val, rank) => {
    const gradientIdx = Math.round(rank * step);
    valueToColor.set(val, VALUE_GRADIENT[Math.min(gradientIdx, VALUE_GRADIENT.length - 1)]);
  });
  return data.map(d => valueToColor.get(d.count) || "#94a3b8");
}

type ViewType = "mensal" | "pareto" | "pizza";

export const AnnualContractComparisonChart = ({ contracts }: AnnualContractComparisonChartProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<"anual" | number>("anual");
  const [activeView, setActiveView] = useState<ViewType>("mensal");

  const { data: availableYears } = useQuery({
    queryKey: ['contract-docs-available-years'],
    queryFn: async () => {
      const { data } = await supabase.from('contract_documents').select('year');
      if (!data) return [currentYear];
      const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
      return years.length > 0 ? years : [currentYear];
    },
  });

  useEffect(() => {
    setSelectedPeriod("anual");
  }, [selectedYear]);

  const { data: allDocs } = useQuery({
    queryKey: ['contract-annual-comparison-monthly', contracts?.map(c => c.id), selectedYear],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const ids = contracts.map(c => c.id);
      const { data } = await supabase
        .from('contract_documents')
        .select('contract_id, month')
        .in('contract_id', ids)
        .eq('year', selectedYear);
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

  const rankedColors = useMemo(() => {
    if (!chartData.length) return [] as string[];
    return getColorsByRank(chartData);
  }, [chartData]);

  const coloredData = useMemo(() => {
    return chartData.map((d, i) => ({ ...d, color: rankedColors[i] }));
  }, [chartData, rankedColors]);

  const totalDocuments = chartData.reduce((sum, s) => sum + s.count, 0);
  const averagePerContract = chartData.length > 0 ? Math.round(totalDocuments / chartData.length) : 0;

  const paretoData = useMemo(() => {
    if (!coloredData.length) return [];
    const sorted = [...coloredData].sort((a, b) => b.count - a.count);
    let cumulative = 0;
    return sorted.map(d => {
      cumulative += d.count;
      return { ...d, cumPercent: totalDocuments > 0 ? Math.round((cumulative / totalDocuments) * 1000) / 10 : 0 };
    });
  }, [coloredData, totalDocuments]);

  const pieData = useMemo(() => {
    return coloredData.filter(d => d.count > 0);
  }, [coloredData]);

  const periodLabel = selectedPeriod === "anual"
    ? `${selectedYear}`
    : `${MONTH_LABELS[(selectedPeriod as number) - 1]}/${selectedYear}`;

  const yearsToShow = availableYears || [currentYear];

  const views: { key: ViewType; label: string; icon: React.ReactNode }[] = [
    { key: "mensal", label: "Mensal", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: "pareto", label: "Pareto", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "pizza", label: "Pizza", icon: <PieIcon className="w-3.5 h-3.5" /> },
  ];

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.fullName}</p>
        <p style={{ color: data.color || 'hsl(var(--primary))' }} className="font-semibold">
          {data.count} análise(s) em {periodLabel}
        </p>
        {activeView === "pareto" && data.cumPercent !== undefined && (
          <p className="text-muted-foreground mt-0.5">Acumulado: {data.cumPercent}%</p>
        )}
        {totalDocuments > 0 && activeView !== "pareto" && (
          <p className="text-muted-foreground mt-0.5">
            {((data.count / totalDocuments) * 100).toFixed(1)}% do total
          </p>
        )}
        <p className="text-muted-foreground">Média geral: {data.average} análises</p>
      </div>
    );
  };

  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const pct = totalDocuments > 0 ? Math.round((data.count / totalDocuments) * 1000) / 10 : 0;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.fullName}</p>
        <p style={{ color: data.color || 'hsl(var(--primary))' }} className="font-semibold">{data.count} análise(s) ({pct}%)</p>
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-normal text-muted-foreground">
                  Total: {totalDocuments} · Média: {averagePerContract}/contrato
                </span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{periodLabel}</span>
                <div className="w-px h-5 bg-border mx-1" />
                {views.map(v => (
                  <Button
                    key={v.key}
                    size="sm"
                    variant={activeView === v.key ? "default" : "ghost"}
                    className="h-7 px-2.5 text-xs gap-1"
                    onClick={() => setActiveView(v.key)}
                  >
                    {v.icon}
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Year & month tabs */}
            <div className="flex items-center gap-3">
              <ScrollArea className="flex-1">
                <div className="flex items-center gap-1">
                  {yearsToShow.map(y => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedYear === y
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-border mx-1" />
                  <button
                    onClick={() => setSelectedPeriod("anual")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedPeriod === "anual"
                        ? "bg-secondary text-secondary-foreground shadow-sm"
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
                          ? "bg-secondary text-secondary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!chartData || chartData.length === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Nenhum contrato cadastrado
            </div>
          ) : (
            <>
              {/* MENSAL VIEW */}
              {activeView === "mensal" && (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={coloredData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
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
                      label={{ value: 'Análises', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Média" />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      name="Análises"
                      label={({ x, y, width, value }: any) => {
                        const percentage = totalDocuments > 0 ? ((value / totalDocuments) * 100).toFixed(1) : '0';
                        return (
                          <text x={x + width / 2} y={y - 6} fill="hsl(var(--muted-foreground))" textAnchor="middle" fontSize={10} fontWeight={500}>
                            {percentage}%
                          </text>
                        );
                      }}
                    >
                      {coloredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count === 0 ? 'hsl(var(--muted))' : entry.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* PARETO VIEW */}
              {activeView === "pareto" && (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar yAxisId="left" dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {paretoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count === 0 ? 'hsl(var(--muted))' : entry.color} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumPercent" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* PIZZA VIEW */}
              {activeView === "pizza" && (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Legend */}
              {activeView === "mensal" && (
                <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: '#16a34a' }} />
                    <span className="text-muted-foreground">Maior volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />
                    <span className="text-muted-foreground">Menor volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 border-t-2 border-dashed border-muted-foreground" />
                    <span className="text-muted-foreground">Média geral</span>
                  </div>
                </div>
              )}
              {activeView === "pareto" && (
                <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: '#16a34a' }} />
                    <span className="text-muted-foreground">Maior volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />
                    <span className="text-muted-foreground">% Acumulado</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
