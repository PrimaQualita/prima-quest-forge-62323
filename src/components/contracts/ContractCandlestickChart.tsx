import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from "framer-motion";
import { Calendar, BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContractCandlestickChartProps {
  contractId: string;
  contractName: string;
  year: number;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const MONTH_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#6366f1",
  "#14b8a6", "#f43f5e", "#a855f7", "#0ea5e9"
];

type ViewType = "mensal" | "pareto" | "pizza";

export const ContractCandlestickChart = ({ contractId, contractName, year }: ContractCandlestickChartProps) => {
  const [activeView, setActiveView] = useState<ViewType>("mensal");

  const { data: monthlyData } = useQuery({
    queryKey: ['contract-monthly-docs', contractId, year],
    queryFn: async () => {
      const monthlyStats = await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          const month = index + 1;
          const { count } = await supabase
            .from('contract_documents')
            .select('*', { count: 'exact', head: true })
            .eq('contract_id', contractId)
            .eq('year', year)
            .eq('month', month);
          
          return {
            month: MONTHS[index],
            monthNumber: month,
            count: count || 0,
            average: 0,
            color: MONTH_COLORS[index],
          };
        })
      );
      
      const totalDocs = monthlyStats.reduce((sum, stat) => sum + stat.count, 0);
      const average = totalDocs / 12;
      monthlyStats.forEach(stat => stat.average = Math.round(average * 10) / 10);
      
      return monthlyStats;
    },
    enabled: !!contractId,
  });

  const totalDocs = monthlyData?.reduce((s, d) => s + d.count, 0) || 0;

  const paretoData = useMemo(() => {
    if (!monthlyData) return [];
    const sorted = [...monthlyData].sort((a, b) => b.count - a.count);
    let cumulative = 0;
    return sorted.map(d => {
      cumulative += d.count;
      return { ...d, cumPercent: totalDocs > 0 ? Math.round((cumulative / totalDocs) * 1000) / 10 : 0 };
    });
  }, [monthlyData, totalDocs]);

  const pieData = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.filter(d => d.count > 0);
  }, [monthlyData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.month}/{year}</p>
        <p style={{ color: data.color }} className="font-semibold">{data.count} análise(s)</p>
        {activeView === "pareto" && data.cumPercent !== undefined && (
          <p className="text-muted-foreground mt-0.5">Acumulado: {data.cumPercent}%</p>
        )}
        {activeView === "mensal" && (
          <p className="text-muted-foreground mt-0.5">Média mensal: {data.average}</p>
        )}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const pct = totalDocs > 0 ? Math.round((data.count / totalDocs) * 1000) / 10 : 0;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.month}/{year}</p>
        <p style={{ color: data.color }} className="font-semibold">{data.count} análise(s) ({pct}%)</p>
      </div>
    );
  };

  const CustomBar = (props: any) => {
    const { x, y, width, height, index } = props;
    const color = activeView === "pareto"
      ? paretoData[index]?.color
      : monthlyData?.[index]?.color || "hsl(var(--primary))";
    return <rect x={x} y={y} width={width} height={height} rx={3} ry={3} fill={color} fillOpacity={0.85} />;
  };

  const views: { key: ViewType; label: string; icon: React.ReactNode }[] = [
    { key: "mensal", label: "Mensal", icon: <BarChart3 className="w-3 h-3" /> },
    { key: "pareto", label: "Pareto", icon: <TrendingUp className="w-3 h-3" /> },
    { key: "pizza", label: "Pizza", icon: <PieIcon className="w-3 h-3" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{contractName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-normal text-muted-foreground mr-1">{totalDocs}</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded mr-2">{year}</span>
              {views.map(v => (
                <Button
                  key={v.key}
                  size="sm"
                  variant={activeView === v.key ? "default" : "ghost"}
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={() => setActiveView(v.key)}
                >
                  {v.icon}
                  {v.label}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeView === "mensal" && (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={`areaGrad-${contractId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" fill={`url(#areaGrad-${contractId})`} stroke="transparent" />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28} shape={<CustomBar />} />
                <Line type="monotone" dataKey="average" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {activeView === "pareto" && (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="count" maxBarSize={28} shape={<CustomBar />} />
                <Line yAxisId="right" type="monotone" dataKey="cumPercent" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {activeView === "pizza" && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="month" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} label={({ month, percent }) => `${month} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
