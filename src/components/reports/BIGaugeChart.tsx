import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface BIGaugeChartProps {
  title: string;
  value: number;
  total: string;
  color: string;
  icon?: React.ReactNode;
}

export const BIGaugeChart = ({ title, value, total, color, icon }: BIGaugeChartProps) => {
  const percentage = Math.min(value, 100);
  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={color} />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center -mt-4">
              <span className="text-2xl font-bold text-foreground">{value.toFixed(1).replace('.', ',')}%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{total}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
