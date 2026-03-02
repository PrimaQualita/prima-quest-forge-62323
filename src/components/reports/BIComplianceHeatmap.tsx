import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapItem {
  name: string;
  docsAccepted: number;
  docsPending: number;
  trainingsCompleted: number;
  trainingsPending: number;
}

interface BIComplianceHeatmapProps {
  data: HeatmapItem[];
  totalDocs: number;
  totalTrainings: number;
}

const getHeatColor = (percentage: number): string => {
  if (percentage >= 100) return "bg-secondary/80";
  if (percentage >= 75) return "bg-secondary/50";
  if (percentage >= 50) return "bg-amber-500/50";
  if (percentage >= 25) return "bg-orange-500/50";
  return "bg-destructive/50";
};

export const BIComplianceHeatmap = ({ data, totalDocs, totalTrainings }: BIComplianceHeatmapProps) => {
  const totalActions = totalDocs + totalTrainings;
  if (totalActions === 0) return null;

  // Calculate distribution buckets
  const buckets = [
    { label: "100%", count: 0, color: "bg-secondary/80" },
    { label: "75-99%", count: 0, color: "bg-secondary/50" },
    { label: "50-74%", count: 0, color: "bg-amber-500/50" },
    { label: "25-49%", count: 0, color: "bg-orange-500/50" },
    { label: "0-24%", count: 0, color: "bg-destructive/50" },
  ];

  data.forEach(emp => {
    const done = emp.docsAccepted + emp.trainingsCompleted;
    const pct = (done / totalActions) * 100;
    if (pct >= 100) buckets[0].count++;
    else if (pct >= 75) buckets[1].count++;
    else if (pct >= 50) buckets[2].count++;
    else if (pct >= 25) buckets[3].count++;
    else buckets[4].count++;
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Distribuição de Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {buckets.map((bucket, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 text-right font-mono">{bucket.label}</span>
                <div className="flex-1 h-8 bg-muted/50 rounded-md overflow-hidden relative">
                  <motion.div
                    className={`h-full ${bucket.color} rounded-md flex items-center px-2`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(bucket.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    {bucket.count > 0 && (
                      <span className="text-xs font-bold text-foreground">{bucket.count}</span>
                    )}
                  </motion.div>
                </div>
                <span className="text-xs text-muted-foreground w-20">
                  {data.length > 0 ? ((bucket.count / data.length) * 100).toFixed(0) : 0}% do total
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
            <span>Total de colaboradores: {data.length}</span>
            <span>Ações por colaborador: {totalActions}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
