"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const description = "A multiple bar chart";

export function ChartBarMultiple<T>({
  data,
  config,
  title,
  description,
  categoryKey = "category",
  valueKey = "value",
  interactive = true,
  className,
}: {
  data: T[];
  config: ChartConfig;
  title: string;
  description?: string;
  categoryKey?: string;
  valueKey?: string;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data} layout="vertical">
            <CartesianGrid vertical={false} />
            <XAxis
              type="number"
              dataKey={valueKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              dataKey={categoryKey}
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            {interactive && (
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
            )}
            {Object.keys(config).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
