import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface BIKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color: "primary" | "secondary" | "destructive" | "accent";
  delay?: number;
}

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    glow: "shadow-[0_0_20px_hsl(var(--primary)/0.15)]",
  },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary/20",
    glow: "shadow-[0_0_20px_hsl(var(--secondary)/0.15)]",
  },
  destructive: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    glow: "shadow-[0_0_20px_hsl(var(--destructive)/0.15)]",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/20",
    glow: "shadow-[0_0_20px_hsl(var(--accent)/0.15)]",
  },
};

export const BIKpiCard = ({ title, value, subtitle, icon: Icon, trend, color, delay = 0 }: BIKpiCardProps) => {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`relative overflow-hidden border ${colors.border} ${colors.glow} hover:scale-[1.02] transition-transform`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  <span>{trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%</span>
                  <span className="text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
