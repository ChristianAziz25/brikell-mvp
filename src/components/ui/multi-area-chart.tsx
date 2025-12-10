"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  formatCompactNumber,
} from "@/components/ui/chart";

export const description = "An area chart with a legend";

export function ChartAreaLegend({
  data,
}: {
  // Rows like: { year: 2024, Emmahus: 123000, Gethus: 98000, ... }
  data: { year: number; [seriesKey: string]: number }[];
}) {
  // Filter out any rows with invalid year; assume metric values are numeric.
  const chartData = data.filter((d) => Number.isFinite(d.year));

  const seriesKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter((key) => key !== "year")
      : [];

  if (chartData.length === 0 || seriesKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Chart - Legend</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const chartConfig: ChartConfig = seriesKeys.reduce((cfg, key, index) => {
    cfg[key] = {
      label: key,
      color: palette[index % palette.length],
    };
    return cfg;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Legend</CardTitle>
        <CardDescription>Value over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
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
              content={<ChartTooltipContent indicator="line" />}
            />
            {seriesKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`var(--color-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
