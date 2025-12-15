"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  formatCompactNumber,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartLineDefault({
  data,
  title,
  description,
}: {
  data: { year: number; value: number }[];
  title: string;
  description?: string;
}) {
  const chartData = data
    .map((item) => ({
      year: item.year,
      value: item.value,
    }))
    // Guard against NaN / non-finite values which can break Recharts' tick calculations
    .filter(
      (d) =>
        Number.isFinite(d.year) &&
        typeof d.value === "number" &&
        Number.isFinite(d.value)
    );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Line Chart</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // Add some headroom/footroom so very large values don't get visually clipped
              domain={[
                (dataMin: number) => {
                  if (!Number.isFinite(dataMin)) return 0;
                  return dataMin === 0 ? 0 : dataMin - Math.abs(dataMin) * 0.1;
                },
                (dataMax: number) => {
                  if (!Number.isFinite(dataMax)) return 1;
                  return dataMax === 0 ? 0 : dataMax + Math.abs(dataMax) * 0.1;
                },
              ]}
              tickFormatter={(value) =>
                typeof value === "number"
                  ? formatCompactNumber(value)
                  : String(value)
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="value"
              type="natural"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
