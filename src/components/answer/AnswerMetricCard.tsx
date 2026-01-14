import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricItem {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
}

interface AnswerMetricCardProps {
  items: MetricItem[];
  className?: string;
}

/**
 * Displays key metrics in a scannable card format.
 * Each metric shows label, value, and optional trend indicator.
 */
export function AnswerMetricCard({ items, className }: AnswerMetricCardProps) {
  return (
    <div
      className={cn(
        "bg-zinc-50 rounded-lg p-4 divide-y divide-zinc-100",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between py-2",
            index === 0 && "pt-0",
            index === items.length - 1 && "pb-0"
          )}
        >
          <span className="text-sm text-zinc-500">{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
            {item.trend && <TrendIcon trend={item.trend} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    case "down":
      return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    case "neutral":
      return <Minus className="h-3.5 w-3.5 text-zinc-400" />;
  }
}
