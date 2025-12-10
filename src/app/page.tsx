"use client";

import { Chat } from "@/components";
import { Button } from "@/components/ui/button";
import { ChartLineMultiple } from "@/components/ui/multi-line-chart";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  buildYearByAssetForMetric,
  type AssetWithRelations,
} from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// TODO: add models for different data types
export default function Home() {
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<
    AssetWithRelations[]
  >({
    // Use a distinct key from other asset queries so we don't get mismatched cached data
    queryKey: ["assets", "detailed"],
    queryFn: async () => {
      const res = await fetch(`/api/assets?detailed=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch detailed assets");
      }
      const data = await res.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const capexData = useMemo(
    () => buildYearByAssetForMetric(assets, "capex"),
    [assets]
  );

  const opexData = useMemo(
    () => buildYearByAssetForMetric(assets, "opex"),
    [assets]
  );

  const griData = useMemo(
    () => buildYearByAssetForMetric(assets, "gri"),
    [assets]
  );

  const occupancyData = useMemo(
    () => buildYearByAssetForMetric(assets, "occupancy"),
    [assets]
  );

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

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
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
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl"
        >
          Show me all vacant units
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl"
        >
          Generate rent roll report
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl"
        >
          Calculate portfolio ROI
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 rounded-xl"
        >
          Find expiring leases
        </Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          My Dashboards
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
          {dashboards.map(({ key, title, description, Chart, data }) => (
            <div key={key} className="mt-2">
              <Chart title={title} description={description} data={data} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
