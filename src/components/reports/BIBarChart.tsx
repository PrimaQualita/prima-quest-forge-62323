import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { motion } from "framer-motion";

interface BarChartItem {
  name: string;
  completed: number;
  pending: number;
  percentage: number;
}

interface BIBarChartProps {
  title: string;
  data: BarChartItem[];
  completedLabel?: string;
  pendingLabel?: string;
  completedColor?: string;
  pendingColor?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export const BIBarChart = ({
  title,
  data,
  completedLabel = "Realizados",
  pendingLabel = "Pendentes",
  completedColor = "hsl(var(--secondary))",
  pendingColor = "hsl(var(--destructive))",
}: BIBarChartProps) => {
  // Truncate names for display
  const chartData = data.map(d => ({
    ...d,
    shortName: d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 45)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={150}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="completed" name={completedLabel} fill={completedColor} radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="pending" name={pendingLabel} fill={pendingColor} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};
