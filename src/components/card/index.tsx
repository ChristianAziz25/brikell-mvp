import { CardContent, CardHeader, CardTitle, Card as CardUI } from "../ui/card";

export default function Card({
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
      <CardHeader>
        <CardTitle>{children}</CardTitle>
      </CardHeader>
      <CardContent>
        <h1>{title}</h1>
        <p>{content}</p>
      </CardContent>
    </CardUI>
  );
}
