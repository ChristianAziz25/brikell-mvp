"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

type GlowingLineChartProps = {
  title: string;
  subtitle?: string;
  percentageChange?: number;
  data: { month: string; [key: string]: string | number }[];
  assets?: { id: string; name: string }[];
  selectedAsset?: string | null;
  onAssetChange?: (assetId: string | null) => void;
  className?: string;
};

// Format number for display
const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString();
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl shadow-lg p-3 min-w-[140px]">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            // Format percentages for Vacancy Rate and NOI %
            const isPercentage = entry.name.includes("Rate") || entry.name.includes("NOI %");
            const displayValue = isPercentage 
              ? `${entry.value.toFixed(2)}%`
              : formatValue(entry.value);
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function GlowingLineChart({
  title,
  subtitle,
  percentageChange,
  data,
  assets = [],
  selectedAsset,
  onAssetChange,
  className,
}: GlowingLineChartProps) {
  const seriesKeys = data.length > 0
    ? Object.keys(data[0]).filter((key) => key !== "month")
    : [];

  // Monochrome grayscale palette - extended for more lines
  const colors = [
    "#18181b", // zinc-900 - black
    "#3f3f46", // zinc-700 - dark grey
    "#71717a", // zinc-500 - medium grey
    "#a1a1aa", // zinc-400 - light grey
    "#d4d4d8", // zinc-300 - very light grey
    "#52525b", // zinc-600 - medium dark grey
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Asset Toggle Buttons - Above the graph */}
      {assets.length > 0 && (
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            <button
              type="button"
              onClick={() => onAssetChange?.(null)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border",
                selectedAsset === null
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
              )}
            >
              All Assets
            </button>
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onAssetChange?.(asset.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border",
                  selectedAsset === asset.id
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                )}
              >
                {asset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="border-border h-[560px]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-medium tracking-tight">
              {title}
            </CardTitle>
            {percentageChange !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {percentageChange >= 0 ? "↗" : "↘"}
                {Math.abs(percentageChange).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {/* Legend - on the left side */}
            <div className="flex gap-5">
              {seriesKeys.map((key, index) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>
            {subtitle && (
              <CardDescription className="mt-0">{subtitle}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Chart */}
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
                  dx={-10}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                />
                {seriesKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: colors[index % colors.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
