import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
            count: count || 0
          };
        })
      );
      
      return monthlyStats;
    },
    enabled: !!contractId,
  });

  const getBarColor = (count: number) => {
    if (count === 0) return '#e5e7eb'; // gray-200
    if (count <= 5) return '#fbbf24'; // yellow-400
    if (count <= 10) return '#60a5fa'; // blue-400
    return '#34d399'; // green-400
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Documentos Mensais - {contractName} ({year})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">{payload[0].payload.month}/{year}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} documento(s) upado(s)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {monthlyData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
