"use client";

import { Search } from "@/components";
import { PageAnimation } from "@/components/page-animation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChartLineMultiple } from "@/components/ui/multi-line-chart";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Building2, Home as HomeIcon, Plus, TrendingUp } from "lucide-react";
import type { YearByAssetRow } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import { HomeSkeleton } from "./home-skeleton";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function Home() {
  type AssetSummary = { id: string; name: string };

  const { data: assets = [], isLoading: isAssetsListLoading } = useQuery<
    AssetSummary[]
  >({
    queryKey: ["assets", "names"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: capexData = [], isLoading: isCapexLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "capex"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=capex");
      if (!res.ok) throw new Error("Failed to fetch CAPEX data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: opexData = [], isLoading: isOpexLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "opex"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=opex");
      if (!res.ok) throw new Error("Failed to fetch OPEX data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: griData = [], isLoading: isGriLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "gri"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=gri");
      if (!res.ok) throw new Error("Failed to fetch GRI data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: occupancyData = [], isLoading: isOccupancyLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "occupancy"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=occupancy");
      if (!res.ok) throw new Error("Failed to fetch Occupancy data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isAssetsLoading =
    isCapexLoading ||
    isOpexLoading ||
    isGriLoading ||
    isOccupancyLoading ||
    isAssetsListLoading;

  const assetNames = assets.map((asset) => asset.name);

  function buildAssetMetricSeries(assetName: string) {
    const byYear: Record<number, { CAPEX?: number; OPEX?: number; GRI?: number }> =
      {};

    const addMetric = (
      rows: YearByAssetRow[],
      metricKey: "CAPEX" | "OPEX" | "GRI"
    ) => {
      for (const row of rows) {
        const value = row[assetName];
        if (typeof value !== "number") continue;
        const year = row.year;
        if (!byYear[year]) byYear[year] = {};
        byYear[year][metricKey] = value;
      }
    };

    addMetric(capexData, "CAPEX");
    addMetric(opexData, "OPEX");
    addMetric(griData, "GRI");

    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, metrics]) => ({
        year: Number(year),
        ...metrics,
      }));
  }

  const dashboards = assetNames.slice(0, 5).map((assetName) => ({
    key: assetName,
    title: assetName,
    description: "CAPEX, OPEX and GRI for this complex or building.",
    Chart: ChartLineMultiple,
    data: buildAssetMetricSeries(assetName),
  }));

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedComplexes, setSelectedComplexes] = useState<string[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>(["GRI", "CAPEX", "OPEX"]);

  const handleSelectAllComplexes = () => {
    if (selectedComplexes.length === assets.length) {
      setSelectedComplexes([]);
    } else {
      setSelectedComplexes(assets.map(asset => asset.id));
    }
  };

  const handleComplexToggle = (assetId: string) => {
    setSelectedComplexes(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleKPIToggle = (kpi: string) => {
    setSelectedKPIs(prev =>
      prev.includes(kpi)
        ? prev.filter(item => item !== kpi)
        : [...prev, kpi]
    );
  };

  const handleCreateDashboard = () => {
    console.log("Creating dashboard with:", { selectedComplexes, selectedKPIs });
    setIsCreateDialogOpen(false);
  };

  if (isAssetsLoading) {
    return <HomeSkeleton />;
  }

  return (
    <PageAnimation>
      <div className="w-full max-w-5xl mx-auto h-full space-y-16">
        <section className="max-w-2xl mx-auto space-y-6 pt-16">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground text-center">
              Welcome{" "}
              <span className="font-light text-muted-foreground">Daniel</span>
            </h2>
            <div className="text-center">
              <TextShimmer
                duration={2}
                spread={3}
                className="text-sm font-light text-muted-foreground"
              >
                Type to type a command or ask a question
              </TextShimmer>
            </div>
          </div>
          <Search />
        </section>
        <div className="space-y-6">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            My Dashboards
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            {dashboards.map(({ key, title, description, Chart, data }) => (
              <Dialog key={key}>
                <DialogTrigger
                  className="group h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  asChild
                >
                  <div className="flex h-full max-h-[200px] flex-col rounded-xl border border-border/60 bg-card text-card-foreground shadow-md overflow-hidden">
                    <div className="px-4 pt-3 pb-2.5 border-b border-border/40 flex-shrink-0">
                      <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
                        {title}
                      </h4>
                    </div>
                    <div className="flex-1 min-h-0 p-2">
                      <Chart
                        className="h-full w-full border-0 bg-transparent shadow-none [&>div]:h-full"
                        data={data}
                        interactive={false}
                      />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>{description}</DialogDescription>
                  <Chart
                    className="w-full h-full"
                    data={data}
                    fullscreen={true}
                  />
                </DialogContent>
              </Dialog>
            ))}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group flex h-full max-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/5 text-muted-foreground shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-muted-foreground/50 hover:bg-muted/10"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-muted-foreground/20 group-hover:border-muted-foreground/40 transition-colors">
                    <Plus className="h-5 w-5" />
                  </span>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Create custom dashboard
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      Build a new view from your Supabase data.
                    </p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogTitle>Create Custom Dashboard</DialogTitle>
                <DialogDescription>
                  Select complexes and KPIs to build your custom dashboard.
                </DialogDescription>
                <div className="space-y-6 py-4">
                  {/* Complex Selection */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Select Complexes</h4>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="select-all-complexes"
                        checked={selectedComplexes.length === assets.length && assets.length > 0}
                        onCheckedChange={handleSelectAllComplexes}
                      />
                      <label
                        htmlFor="select-all-complexes"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select All
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`complex-${asset.id}`}
                            checked={selectedComplexes.includes(asset.id)}
                            onCheckedChange={() => handleComplexToggle(asset.id)}
                          />
                          <label
                            htmlFor={`complex-${asset.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {asset.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPI Selection */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Select KPIs</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {["GRI", "CAPEX", "OPEX"].map(kpi => (
                        <div key={kpi} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`kpi-${kpi}`}
                            checked={selectedKPIs.includes(kpi)}
                            onCheckedChange={() => handleKPIToggle(kpi)}
                          />
                          <label
                            htmlFor={`kpi-${kpi}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            {kpi === "GRI" && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                            {kpi === "CAPEX" && <Plus className="h-4 w-4 text-muted-foreground" />}
                            {kpi === "OPEX" && <HomeIcon className="h-4 w-4 text-muted-foreground" />}
                            {kpi}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDashboard}
                    disabled={selectedComplexes.length === 0 || selectedKPIs.length === 0}
                  >
                    Create Dashboard
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
