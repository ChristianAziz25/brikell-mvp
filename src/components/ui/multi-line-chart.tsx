"use client";

import * as React from "react";
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

export const description = "A multiple line chart";

type ChartLineMultipleProps = {
  // Rows like: { year: 2024, Emmahus: 123000, Gethus: 98000, ... }
  data: { year: number; [seriesKey: string]: number }[];
  /** When false, disables hover tooltip/interaction (useful for small preview cards). */
  interactive?: boolean;
  /** When true, render bare chart without Card wrapper (for fullscreen dialog). */
  fullscreen?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function ChartLineMultiple({
  data,
  className,
  interactive = true,
  fullscreen = false,
  ...cardProps
}: ChartLineMultipleProps) {
  // Filter out any rows with invalid year; assume metric values are numeric.
  const chartData = data.filter((d) => Number.isFinite(d.year));

  const seriesKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter((key) => key !== "year")
      : [];

  // No usable series → render empty state.
  if (chartData.length === 0 || seriesKeys.length === 0) {
    return (
      <Card className={className} {...cardProps}>
        <CardHeader>
          <CardTitle>Line Chart - Multiple</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  // Build chart config dynamically so each series gets a label and color.
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

  const chartBody = (
    <ChartContainer config={chartConfig}>
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 0,
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
        {interactive && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
        )}
        {seriesKeys.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="natural"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );

  if (fullscreen) {
    return <div className="w-full h-full">{chartBody}</div>;
  }

  return (
    <Card className={className} {...cardProps}>
      <CardContent className="p-4">{chartBody}</CardContent>
    </Card>
  );
}
