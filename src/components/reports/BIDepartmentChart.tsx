import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DepartmentData {
  department: string;
  total: number;
  docsRate: number;
  trainingRate: number;
  overallRate: number;
}

interface BIDepartmentChartProps {
  data: DepartmentData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1).replace('.', ',')}%
        </p>
      ))}
    </div>
  );
};

export const BIDepartmentChart = ({ data }: BIDepartmentChartProps) => {
  if (!data || data.length === 0) return null;

  const sortedData = [...data].sort((a, b) => b.overallRate - a.overallRate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Taxa de Compliance por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={Math.max(300, sortedData.length * 50)}>
              <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={140}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="docsRate" name="Regulamentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="trainingRate" name="Treinamentos" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>

            {/* Detail list */}
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
              {sortedData.map((dept, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/30 bg-card/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{dept.department}</span>
                    <span className="text-xs text-muted-foreground">{dept.total} colab.</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Regulamentos</span>
                        <span className="font-semibold text-primary">{dept.docsRate.toFixed(1).replace('.', ',')}%</span>
                      </div>
                      <Progress value={dept.docsRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Treinamentos</span>
                        <span className="font-semibold text-secondary">{dept.trainingRate.toFixed(1).replace('.', ',')}%</span>
                      </div>
                      <Progress value={dept.trainingRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Geral</span>
                        <span className={`font-bold ${dept.overallRate >= 70 ? 'text-secondary' : dept.overallRate >= 40 ? 'text-amber-500' : 'text-destructive'}`}>
                          {dept.overallRate.toFixed(1).replace('.', ',')}%
                        </span>
                      </div>
                      <Progress value={dept.overallRate} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
