"use client";

import { dollarStringify } from "@/app/properties/util/dollarStringify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig } from "@/components/ui/chart";
import { ChartBarMultiple } from "@/components/ui/multiple-bar-chart";
import { buildAssetTimeSeries } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown } from "lucide-react";
import { useMemo } from "react";

const CURRENT_YEAR = new Date().getFullYear();

export default function Capex() {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", "capex"],
    queryFn: async () => {
      const res = await fetch("/api/assets?detailed=true");
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const timeSeries = useMemo(() => buildAssetTimeSeries(assets), [assets]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    let capexYtd = 0;
    let fiveYearForecast = 0;
    let reserveFund = 0;

    // Aggregate CAPEX data
    const capexByYear = new Map<number, { actual: number; budget: number }>();

    for (const series of timeSeries) {
      // Current year CAPEX
      const currentCapex = series.capex.find((c) => c.year === CURRENT_YEAR);
      if (currentCapex) {
        capexYtd += currentCapex.totalCapexActual;
      }

      // 5-year forecast (next 5 years budget)
      for (let year = CURRENT_YEAR + 1; year <= CURRENT_YEAR + 5; year++) {
        const yearCapex = series.capex.find((c) => c.year === year);
        if (yearCapex) {
          fiveYearForecast += yearCapex.totalCapexBudget;
        }
      }

      // Reserve fund (simplified: sum of all future budgets)
      series.capex.forEach((c) => {
        if (c.year > CURRENT_YEAR) {
          reserveFund += c.totalCapexBudget;
        }
      });

      // Aggregate by year for chart
      series.capex.forEach((c) => {
        const existing = capexByYear.get(c.year) || { actual: 0, budget: 0 };
        capexByYear.set(c.year, {
          actual: existing.actual + c.totalCapexActual,
          budget: existing.budget + c.totalCapexBudget,
        });
      });
    }

    // Calculate budget percentage for YTD
    const currentYearData = capexByYear.get(CURRENT_YEAR);
    const currentYearBudget = currentYearData?.budget ?? 0;
    const budgetPercentage =
      currentYearBudget > 0
        ? Math.round((capexYtd / currentYearBudget) * 100)
        : 0;

    return {
      capexYtd,
      fiveYearForecast,
      reserveFund,
      budgetPercentage,
      capexByYear: Array.from(capexByYear.entries())
        .map(([year, values]) => ({ year, ...values }))
        .sort((a, b) => a.year - b.year),
    };
  }, [timeSeries]);

  // Chart data for Budget vs Actuals
  const chartData = kpis.capexByYear.map((d) => ({
    year: d.year.toString(),
    budget: d.budget,
    actual: d.actual,
  }));

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "hsl(220, 13%, 13%)",
    },
    actual: {
      label: "Actual",
      color: "hsl(220, 9%, 70%)",
    },
  } satisfies ChartConfig;

  // Replacement timeline data (mock data for now)
  const replacementTimeline = [
    {
      name: "HVAC Systems",
      details: "3 buildings • 2025-2027",
      amount: 2400000,
    },
    {
      name: "Roof Replacements",
      details: "2 buildings • 2026-2028",
      amount: 1800000,
    },
    {
      name: "Façade Renovation",
      details: "1 building • 2027-2028",
      amount: 950000,
    },
    {
      name: "Boiler Systems",
      details: "4 buildings • 2025-2026",
      amount: 1200000,
    },
    {
      name: "Elevator Modernization",
      details: "2 buildings • 2028-2029",
      amount: 800000,
    },
  ];

  if (isLoading) {
    return <div className="space-y-6 animate-fade-in">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-lg shadow-sm border-border">
          <CardContent className="p-5">
            <p className="kpi-label mb-2">CAPEX YTD</p>
            <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
              {dollarStringify({ value: kpis.capexYtd, format: "text" })} DKK
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="trend-pill trend-down">
                <span>On budget</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {kpis.budgetPercentage}% of annual budget
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-border">
          <CardContent className="p-5">
            <p className="kpi-label mb-2">5-Year Forecast</p>
            <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
              {dollarStringify({
                value: kpis.fiveYearForecast,
                format: "text",
              })}{" "}
              DKK
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Total projected spend
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-border">
          <CardContent className="p-5">
            <p className="kpi-label mb-2">Projects Active</p>
            <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
              3
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-border">
          <CardContent className="p-5">
            <p className="kpi-label mb-2">Reserve Fund</p>
            <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
              {dollarStringify({ value: kpis.reserveFund, format: "text" })} DKK
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="trend-pill trend-down">
                <TrendingDown className="w-3 h-3" />
                <span>-15%</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Below recommended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actuals Chart */}
        <ChartBarMultiple
          data={chartData}
          config={chartConfig}
          title="Budget vs Actuals"
          className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card"
          valueKey="budget"
          categoryKey="year"
        />

        {/* Replacement Timeline */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
          <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
            <CardTitle className="tracking-tight text-base font-medium">
              Replacement Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="space-y-3">
              {replacementTimeline.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.details}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {dollarStringify({ value: item.amount, format: "text" })}{" "}
                    DKK
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
