"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  formatCompactNumber,
} from "@/components/ui/chart";

export const description = "A horizontal bar chart comparing budget vs actual";

export type BudgetVsActualData = {
  category: string;
  actual: number;
  budget: number;
};

const chartConfig = {
  actual: {
    label: "Actual",
    color: "hsl(0 0% 15%)",
  },
  budget: {
    label: "Budget",
    color: "hsl(0 0% 82%)",
  },
} satisfies ChartConfig;

type BudgetVsActualChartProps = {
  data: BudgetVsActualData[];
  title?: string;
};

export function BudgetVsActualChart({
  data,
  title = "Budget vs Actual",
}: BudgetVsActualChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-zinc-800" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-zinc-300" />
            <span>Budget</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 0,
              right: 20,
              top: 10,
              bottom: 10,
            }}
            barGap={4}
            barCategoryGap={16}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={110}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="actual"
              fill="#27272a"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
            <Bar
              dataKey="budget"
              fill="#d4d4d8"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
