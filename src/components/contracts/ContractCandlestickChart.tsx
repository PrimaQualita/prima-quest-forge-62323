import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface ContractCandlestickChartProps {
  contractId: string;
  contractName: string;
  year: number;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export const ContractCandlestickChart = ({ contractId, contractName, year }: ContractCandlestickChartProps) => {
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
            average: 0
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-1">{data.month}/{year}</p>
        <p className="text-primary font-semibold">{data.count} análise(s)</p>
        <p className="text-muted-foreground mt-0.5">Média mensal: {data.average}</p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{contractName}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-normal text-muted-foreground">{totalDocs} análises</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{year}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`areaGrad-${contractId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                fill={`url(#areaGrad-${contractId})`}
                stroke="transparent"
              />
              <Bar 
                dataKey="count" 
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                fill="hsl(var(--primary))"
                fillOpacity={0.8}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};
