import { cn } from "@/lib/utils";
import { Circle, Play, CheckCircle, XCircle, RotateCcw, Target, ArrowLeft } from "lucide-react";

type TestStatus = 0 | 1 | 2 | 3 | 4 | 5 | -1;

interface TestStatusBadgeProps {
  status: TestStatus;
}

const statusConfig: Record<TestStatus, { label: string; icon: typeof Circle; className: string }> = {
  0: { label: "Idle", icon: Circle, className: "bg-secondary text-muted-foreground" },
  1: { label: "Starting", icon: Play, className: "bg-info/20 text-info" },
  2: { label: "Testing", icon: RotateCcw, className: "bg-warning/20 text-warning animate-pulse" },
  3: { label: "At Target", icon: Target, className: "bg-primary/20 text-primary" },
  4: { label: "Returning", icon: ArrowLeft, className: "bg-info/20 text-info" },
  5: { label: "Complete", icon: CheckCircle, className: "bg-success/20 text-success" },
  [-1]: { label: "Error", icon: XCircle, className: "bg-destructive/20 text-destructive" },
};

export function TestStatusBadge({ status }: TestStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[0];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-lg font-semibold",
      config.className
    )}>
      <Icon className="w-6 h-6" />
      <span>{config.label}</span>
    </div>
  );
}
