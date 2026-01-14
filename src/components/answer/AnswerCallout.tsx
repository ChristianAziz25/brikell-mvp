import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, Info } from "lucide-react";

type CalloutType = "tip" | "warning" | "info";

interface AnswerCalloutProps {
  type: CalloutType;
  children: React.ReactNode;
  className?: string;
}

const calloutStyles: Record<
  CalloutType,
  { bg: string; border: string; icon: typeof Lightbulb; iconColor: string }
> = {
  tip: {
    bg: "bg-amber-50",
    border: "border-l-2 border-amber-400",
    icon: Lightbulb,
    iconColor: "text-amber-500",
  },
  warning: {
    bg: "bg-red-50",
    border: "border-l-2 border-red-400",
    icon: AlertTriangle,
    iconColor: "text-red-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-l-2 border-blue-400",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

/**
 * Callout box for tips, warnings, and informational notes.
 * Uses colored left border and icon to indicate type.
 */
export function AnswerCallout({
  type,
  children,
  className,
}: AnswerCalloutProps) {
  const style = calloutStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "rounded-r-lg p-4 flex gap-3",
        style.bg,
        style.border,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", style.iconColor)} />
      <div className="text-sm text-zinc-600 leading-relaxed">{children}</div>
    </div>
  );
}
