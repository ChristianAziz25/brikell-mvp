"use client";

import { Chat } from "@/components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChartLineMultiple } from "@/components/ui/multi-line-chart";
import { TextShimmer } from "@/components/ui/text-shimmer";
import type { YearByAssetRow } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import { HomeSkeleton } from "./home-skeleton";

// TODO: add models for different data types
export default function Home() {
  // Optimized: Fetch pre-aggregated data from TimescaleDB
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
    isCapexLoading || isOpexLoading || isGriLoading || isOccupancyLoading;

  const dashboards = [
    {
      key: "opex",
      title: "OPEX by Asset",
      description: "Track operating expenses across your portfolio.",
      Chart: ChartLineMultiple,
      data: opexData,
    },
    {
      key: "capex",
      title: "CAPEX by Asset",
      description: "Monitor capital expenditures for each asset.",
      Chart: ChartLineMultiple,
      data: capexData,
    },
    {
      key: "gri",
      title: "GRI by Asset",
      description: "Visualize gross rental income across assets.",
      Chart: ChartLineMultiple,
      data: griData,
    },
    {
      key: "occupancy",
      title: "Occupancy by Asset",
      description: "See occupancy trends for each property.",
      Chart: ChartLineMultiple,
      data: occupancyData,
    },
  ];

  if (isAssetsLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full h-full space-y-12">
      <section className="max-w-2xl mx-auto space-y-8 pt-12">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground text-center">
            Welcome{" "}
            <span className="font-light text-muted-foreground">Søren</span>
          </h2>
          <div className="text-center">
            <TextShimmer duration={2} spread={3} className="text-sm font-light">
              Type to type a command or ask a question
            </TextShimmer>
          </div>
        </div>
        <Chat />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl cursor-pointer"
          >
            Show me all vacant units
          </Button>
          <Button
            variant="outline"
            className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl cursor-pointer"
          >
            Generate rent roll report
          </Button>
          <Button
            variant="outline"
            className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl cursor-pointer"
          >
            Calculate portfolio ROI
          </Button>
          <Button
            variant="outline"
            className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl cursor-pointer"
          >
            Find expiring leases
          </Button>
        </div>
      </section>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          My Dashboards
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-3">
          {dashboards.map(({ key, title, description, Chart, data }) => (
            <Dialog key={key}>
              <DialogTrigger
                className="mt-2 cursor-pointer hover:bg-muted/30"
                asChild
              >
                <Chart
                  title={title}
                  // description={description}
                  data={data}
                  interactive={false}
                />
              </DialogTrigger>
              <DialogContent>
                <Chart
                  className="w-full h-full"
                  title={title}
                  description={description}
                  data={data}
                  fullscreen={true}
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}
