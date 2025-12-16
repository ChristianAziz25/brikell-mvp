"use client";

import { Button } from "@/components/ui/button";
import { ChartAreaLegend } from "@/components/ui/multi-area-chart";
import type { Asset } from "@/generated/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PerformanceSkeleton } from "./components/skeleton";

type TableRow = {
  metric: string;
  [year: string]: string | number | number[] | undefined;
};

type RentRollUnitLite = {
  lease_start: string | null;
  units_status: "occupied" | "vacant" | "terminated";
};

type TableData = {
  name: string;
  tri: TableRow[];
  capex: TableRow[];
  opex: TableRow[];
  rentRoll: RentRollUnitLite[];
};

export default function Performance() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets", "detailed"],
    queryFn: async () => {
      const res = await fetch(`/api/assets`);
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

  const activeAssetName = selectedAsset || assets[0]?.name || "";

  useEffect(() => {
    setSelectedAsset(activeAssetName);
  }, [activeAssetName]);

  // Fetch pre-aggregated yearly metrics for a single asset
  const { data: yearBasedData = [], isLoading: isAssetLoading } = useQuery<
    Array<{ year: number; capex: number; opex: number; tri: number; occupancy: number }>
  >({
    queryKey: ["asset-yearly-metrics", activeAssetName],
    queryFn: async () => {
      if (!activeAssetName) return [];
      const res = await fetch(
        `/api/asset/yearly-metrics?name=${encodeURIComponent(activeAssetName)}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch asset yearly metrics");
      }
      return res.json();
    },
    enabled: !!activeAssetName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  type AvgValue = { avg: number; label: string; color: string };

  // [{ avg, label, color }, ...] for TRI, OPEX, CAPEX, OCCUPANCY
  const avgValues: AvgValue[] = useMemo(() => {
    if (yearBasedData.length === 0) {
      return [
        { avg: 0, label: "TRI", color: "red" },
        { avg: 0, label: "OPEX", color: "blue" },
        { avg: 0, label: "CAPEX", color: "green" },
        { avg: 0, label: "OCCUPANCY", color: "yellow" },
      ];
    }

    const sums = yearBasedData.reduce(
      (acc, row) => ({
        tri: acc.tri + row.tri,
        opex: acc.opex + row.opex,
        capex: acc.capex + row.capex,
        occupancy: acc.occupancy + row.occupancy,
      }),
      { tri: 0, opex: 0, capex: 0, occupancy: 0 }
    );

    const len = yearBasedData.length;

    const values: AvgValue[] = [
      { avg: sums.tri / len, label: "TRI", color: "red" },
      { avg: sums.opex / len, label: "OPEX", color: "blue" },
      { avg: sums.capex / len, label: "CAPEX", color: "green" },
      { avg: sums.occupancy / len, label: "OCCUPANCY", color: "yellow" },
    ];
    return values;
  }, [yearBasedData]);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="w-full">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Performance
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Financial performance analytics and trends
          </p>
        </div>
        {isAssetsLoading || isAssetLoading ? (
          <PerformanceSkeleton />
        ) : (
          <>
            <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
              {assets.map((asset) => (
                <Button
                  onClick={() => setSelectedAsset(asset.name)}
                  variant={selectedAsset === asset.name ? "default" : "outline"}
                  key={asset.id}
                >
                  {asset.name}
                </Button>
              ))}
            </div>
            <ChartAreaLegend assetName={activeAssetName} data={yearBasedData}>
              <div className="w-full flex flex-row gap-3 mt-4">
                {avgValues.map((value, index) => (
                  <div
                    key={index}
                    className="relative flex-1 min-w-0 flex items-center gap-2.5 rounded-lg border border-border/40 bg-card px-3 py-2"
                  >
                    <div
                      className="absolute left-0 top-1/2 w-0.5 h-12 translate-y-[-50%] rounded-full shrink-0"
                      style={{ backgroundColor: value.color, opacity: 0.5 }}
                    />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="text-sm font-medium text-muted-foreground truncate">
                        {value.label}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-md font-semibold leading-none">
                          {value.label === "OCCUPANCY"
                            ? `${(value.avg * 100).toFixed(1)}%`
                            : value.avg.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartAreaLegend>
          </>
        )}
      </div>
    </div>
  );
}
