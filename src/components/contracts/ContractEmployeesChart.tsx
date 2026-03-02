import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, BarChart } from 'recharts';
import { motion } from "framer-motion";
import { Users, BarChart3, TrendingUp, PieChart as PieIcon, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Contract {
  id: string;
  name: string;
  is_active: boolean;
}

interface ContractEmployeesChartProps {
  contracts: Contract[];
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

type ViewType = "vela" | "horizontal" | "pareto" | "pizza";

export const ContractEmployeesChart = ({ contracts }: ContractEmployeesChartProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<"anual" | number>("anual");
  const [activeView, setActiveView] = useState<ViewType>("vela");

  const { data: availableYears } = useQuery({
    queryKey: ['employees-available-years'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('created_at')
        .eq('is_active', true);
      if (!data) return [currentYear];
      const years = [...new Set(data.map(d => new Date(d.created_at!).getFullYear()))].sort((a, b) => b - a);
      return years.length > 0 ? years : [currentYear];
    },
  });

  useEffect(() => {
    setSelectedPeriod("anual");
  }, [selectedYear]);

  const { data: employeeCounts } = useQuery({
    queryKey: ['employees-per-contract-chart', contracts?.map(c => c.id), selectedYear, selectedPeriod],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const results = await Promise.all(
        contracts.map(async (c) => {
          let query = supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('management_contract_id', c.id);

          if (selectedPeriod !== "anual") {
            const endDate = new Date(selectedYear, selectedPeriod as number, 0, 23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
          } else {
            const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
          }

          const { count } = await query;
          return {
            name: c.name.length > 22 ? c.name.substring(0, 20) + '…' : c.name,
            fullName: c.name,
            count: count || 0,
          };
        })
      );
      return results.sort((a, b) => b.count - a.count);
    },
    enabled: !!contracts && contracts.length > 0,
  });

  const totalEmployees = employeeCounts?.reduce((s, d) => s + d.count, 0) || 0;
  const average = employeeCounts && employeeCounts.length > 0 ? Math.round(totalEmployees / employeeCounts.length) : 0;

  const rankedColors = useMemo(() => {
    if (!employeeCounts?.length) return [] as string[];
    return getColorsByRank(employeeCounts);
  }, [employeeCounts]);

  const coloredData = useMemo(() => {
    if (!employeeCounts) return [];
    return employeeCounts.map((d, i) => ({ ...d, color: rankedColors[i], average }));
  }, [employeeCounts, rankedColors, average]);

  const paretoData = useMemo(() => {
    if (!coloredData.length) return [];
    const sorted = [...coloredData].sort((a, b) => b.count - a.count);
    let cumulative = 0;
    return sorted.map(d => {
      cumulative += d.count;
      return { ...d, cumPercent: totalEmployees > 0 ? Math.round((cumulative / totalEmployees) * 1000) / 10 : 0 };
    });
  }, [coloredData, totalEmployees]);

  const pieData = useMemo(() => {
    return coloredData.filter(d => d.count > 0);
  }, [coloredData]);

  const periodLabel = selectedPeriod === "anual"
    ? `${selectedYear}`
    : `${MONTH_LABELS[(selectedPeriod as number) - 1]}/${selectedYear}`;

  const yearsToShow = availableYears || [currentYear];

  const views: { key: ViewType; label: string; icon: React.ReactNode }[] = [
    { key: "vela", label: "Vela", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: "horizontal", label: "Barras", icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
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
          {data.count} colaborador(es)
        </p>
        {activeView === "pareto" && data.cumPercent !== undefined && (
          <p className="text-muted-foreground mt-0.5">Acumulado: {data.cumPercent}%</p>
        )}
        {totalEmployees > 0 && activeView !== "pareto" && (
          <p className="text-muted-foreground mt-0.5">
            {((data.count / totalEmployees) * 100).toFixed(1)}% do total
          </p>
        )}
      </div>
    );
  };

  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const pct = totalEmployees > 0 ? Math.round((data.count / totalEmployees) * 1000) / 10 : 0;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.fullName}</p>
        <p style={{ color: data.color || 'hsl(var(--primary))' }} className="font-semibold">{data.count} colaborador(es) ({pct}%)</p>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Colaboradores Ativos por Contrato</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-normal text-muted-foreground">
                  Total: {totalEmployees} · Média: {average}/contrato
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
          {(!coloredData || coloredData.length === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Nenhum dado disponível
            </div>
          ) : (
            <>
              {activeView === "vela" && (
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={coloredData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Média" />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60} name="Colaboradores"
                      label={({ x, y, width, value }: any) => {
                        const pct = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : '0';
                        return <text x={x + width / 2} y={y - 6} fill="hsl(var(--muted-foreground))" textAnchor="middle" fontSize={10} fontWeight={500}>{pct}%</text>;
                      }}
                    >
                      {coloredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count === 0 ? 'hsl(var(--muted))' : entry.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {activeView === "horizontal" && (
                <ResponsiveContainer width="100%" height={Math.max(450, coloredData.length * 35)}>
                  <BarChart data={coloredData} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24} name="Colaboradores"
                      label={({ x, y, width, height, value }: any) => (
                        <text x={x + width + 4} y={y + height / 2 + 4} fill="hsl(var(--muted-foreground))" fontSize={10} fontWeight={500}>{value}</text>
                      )}
                    >
                      {coloredData.map((entry, index) => (
                        <Cell key={`cell-h-${index}`} fill={entry.count === 0 ? 'hsl(var(--muted))' : entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeView === "pareto" && (
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" height={80} interval={0} />
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

              {activeView === "pizza" && (
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {activeView === "vela" && (
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
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
