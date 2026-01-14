import { cn } from "@/lib/utils";

interface AnswerSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable section component for structured answer display.
 * Uses uppercase muted headers with subtle divider line.
 */
export function AnswerSection({
  title,
  description,
  children,
  className,
}: AnswerSectionProps) {
  return (
    <section className={cn("mb-6 last:mb-0", className)}>
      <header className="border-b border-zinc-100 pb-2 mb-3">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        )}
      </header>
      <div className="text-sm text-zinc-700">{children}</div>
    </section>
  );
}
