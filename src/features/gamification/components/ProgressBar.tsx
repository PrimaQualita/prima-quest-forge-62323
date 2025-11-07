import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  showPercentage?: boolean;
  color?: string;
}

/**
 * Barra de progresso customizável
 */
export const ProgressBar = ({ 
  label, 
  value, 
  max = 100, 
  showPercentage = true,
  color = 'bg-primary'
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
        )}
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
