import { Card as CardUI } from "../ui/card";

export function Card({
  title,
  content,
  children,
  className,
}: {
  title: string;
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardUI className={className}>
      <div className="text-card-foreground shadow-sm p-5">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
            {children}
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{content}</p>
          </div>
        </div>
      </div>
    </CardUI>
  );
}
