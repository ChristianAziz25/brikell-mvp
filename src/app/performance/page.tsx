"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartAreaLegend } from "@/components/ui/multi-area-chart";
import type { Asset } from "@/generated/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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

  const { data: assetData, isLoading: isAssetLoading } =
    useQuery<TableData | null>({
      queryKey: ["asset", activeAssetName],
      queryFn: async () => {
        if (!activeAssetName) return null;
        const res = await fetch(
          `/api/asset?name=${encodeURIComponent(activeAssetName)}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch asset");
        }
        const data = await res.json();
        return data;
      },
      enabled: !!activeAssetName,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const yearBasedData = useMemo(() => {
    if (!assetData) return [];

    const byYear: Record<
      number,
      { capex?: number; opex?: number; tri?: number; occupancy?: number }
    > = {};

    const ensureBucket = (year: number) => {
      if (!byYear[year]) {
        byYear[year] = {};
      }
      return byYear[year]!;
    };

    const collectYears = (rows: TableRow[]) => {
      rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key === "metric") return;
          const yearNum = Number(key);
          if (Number.isFinite(yearNum)) {
            ensureBucket(yearNum);
          }
        });
      });
    };

    collectYears(assetData.capex);
    collectYears(assetData.opex);
    collectYears(assetData.tri);

    for (const [yearStr, bucket] of Object.entries(byYear)) {
      const year = Number(yearStr);
      let capexTotal = 0;
      for (const row of assetData.capex) {
        const raw = row[yearStr];
        if (Array.isArray(raw)) {
          const actual = raw[0];
          if (typeof actual === "number") capexTotal += actual;
        } else if (typeof raw === "number") {
          capexTotal += raw;
        }
      }
      bucket.capex = capexTotal;
    }

    for (const [yearStr, bucket] of Object.entries(byYear)) {
      const year = Number(yearStr);
      let opexTotal = 0;
      for (const row of assetData.opex) {
        const raw = row[yearStr];
        if (Array.isArray(raw)) {
          const actual = raw[0];
          if (typeof actual === "number") opexTotal += actual;
        } else if (typeof raw === "number") {
          opexTotal += raw;
        }
      }
      bucket.opex = opexTotal;
    }

    const triAmountRow = assetData.tri.find((r) => r.metric === "triAmount");
    const vacancyLossRow = assetData.tri.find(
      (r) => r.metric === "vacancyLoss"
    );

    for (const [yearStr, bucket] of Object.entries(byYear)) {
      const triBase = triAmountRow?.[yearStr];
      const vacancyBase = vacancyLossRow?.[yearStr];

      const triActual =
        typeof triBase === "number"
          ? triBase
          : Array.isArray(triBase)
          ? Number(triBase[0])
          : undefined;

      const vacancyActual =
        typeof vacancyBase === "number"
          ? vacancyBase
          : Array.isArray(vacancyBase)
          ? Number(vacancyBase[0])
          : undefined;

      if (triActual != null && vacancyActual != null) {
        bucket.tri = triActual - vacancyActual;
      } else {
        bucket.tri = 0;
      }
    }

    // Occupancy: for each year, occupied units / total units from rentRoll
    const occupancyAgg: Record<number, { occupied: number; total: number }> =
      {};
    const rentRoll = assetData.rentRoll ?? [];

    rentRoll.forEach((unit) => {
      if (!unit.lease_start) return;
      const d = new Date(unit.lease_start);
      const year = d.getFullYear();
      if (!Number.isFinite(year)) return;

      if (!occupancyAgg[year]) {
        occupancyAgg[year] = { occupied: 0, total: 0 };
      }
      occupancyAgg[year].total += 1;
      if (unit.units_status === "occupied") {
        occupancyAgg[year].occupied += 1;
      }
    });

    for (const [yearStr, bucket] of Object.entries(byYear)) {
      const year = Number(yearStr);
      const stats = occupancyAgg[year];
      bucket.occupancy =
        stats && stats.total > 0 ? stats.occupied / stats.total : 0;
    }

    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, v]) => ({
        year: Number(year),
        capex: v.capex ?? 0,
        opex: v.opex ?? 0,
        tri: v.tri ?? 0,
        occupancy: v.occupancy ?? 0,
      }));
  }, [assetData]);

  if (isAssetsLoading || isAssetLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Performance
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Financial performance analytics and trends
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            {assets.map((asset) => (
              <Button
                onClick={() => setSelectedAsset(asset.name)}
                variant="outline"
                key={asset.id}
              >
                {asset.name}
              </Button>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartAreaLegend data={yearBasedData} />
        </CardContent>
      </Card>
    </div>
  );
}
