import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "primary" | "secondary" | "accent";
}

export const StatCard = ({ title, value, icon: Icon, trend, variant = "primary" }: StatCardProps) => {
  const gradients = {
    primary: "from-primary/10 to-primary/5",
    secondary: "from-secondary/10 to-secondary/5",
    accent: "from-accent/10 to-accent/5",
  };

  const iconColors = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-card hover:shadow-elevated transition-shadow">
      <CardContent className="p-6">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradients[variant]} rounded-bl-full opacity-50`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${gradients[variant]}`}>
              <Icon className={`w-5 h-5 ${iconColors[variant]}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-sm text-muted-foreground">{trend}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
