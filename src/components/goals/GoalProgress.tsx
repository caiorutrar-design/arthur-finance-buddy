import { cn } from '@/lib/utils';

interface GoalProgressProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function GoalProgress({ percentage, size = 'md', color, className }: GoalProgressProps) {
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const isComplete = clampedPct >= 100;

  return (
    <div className={cn('w-full rounded-full bg-secondary overflow-hidden', sizes[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          isComplete && 'bg-green-500'
        )}
        style={{
          width: `${clampedPct}%`,
          backgroundColor: !isComplete && color ? color : undefined,
        }}
      />
    </div>
  );
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  color,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (clampedPct / 100) * circumference;
  const isComplete = clampedPct >= 100;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? '#22c55e' : (color ?? 'currentColor')}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold">{Math.round(clampedPct)}%</span>
    </div>
  );
}
