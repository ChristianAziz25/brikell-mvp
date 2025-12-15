"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLineDefault } from "@/components/ui/line-chart";
import { buildAssetTimeSeries } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Capex,
  Opex,
  RentRollUnit,
  TheoreticalRentalIncome,
} from "../../generated/client";
import { MyAssetsSkeleton } from "./components/skeleton";
import { Table } from "./Table";
import { dollarStringify } from "./util/dollarStringify";

const CURRENT_YEAR = new Date().getFullYear();

type PortfolioRow = {
  property: string;
  vacancy: number;
  opex: number;
  opexPerUnit: number;
  noi: number;
  noiMargin: number;
};

interface AssetSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  tri: TheoreticalRentalIncome[];
  capex: Capex[];
  opex: Opex[];
  rentRoll: RentRollUnit[];
  created_at: Date;
  updated_at: Date;
}

export default function MyAssets() {
  const router = useRouter();
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<
    AssetSummary[]
  >({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(`/api/assets?detailed=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const timeSeries = buildAssetTimeSeries(assets);
  // Map of year -> aggregated NOI across all assets
  const noiByAsset = new Map<number, number>();
  const capexTotal = timeSeries.reduce((sum, asset) => {
    const localVal = asset.capex.find(
      (c) => c.year === CURRENT_YEAR
    )?.totalCapexActual;
    return sum + (localVal ?? 0);
  }, 0);
  // for one year, sum all the noi values
  const opexTotal = timeSeries.reduce((sum, asset) => {
    const localVal = asset.opex.find(
      (c) => c.year === CURRENT_YEAR
    )?.totalOpexActual;
    return sum + (localVal ?? 0);
  }, 0);
  const griTotal = timeSeries.reduce((sum, asset) => {
    const localVal = asset.gri.find((c) => c.year === CURRENT_YEAR)?.gri;
    return sum + (localVal ?? 0);
  }, 0);
  const noiTotal = griTotal - opexTotal;
  const noiMarginTotal = (noiTotal / griTotal) * 100;

  // For all years, aggregate NOI (GRI - OPEX) per year across assets
  timeSeries.forEach((asset) => {
    const opexArr = asset.opex.map((opex) => {
      return opex.totalOpexActual as number;
    });
    asset.gri.forEach((gri, index) => {
      noiByAsset.set(
        gri.year,
        (noiByAsset.get(gri.year) ?? 0) + (gri.gri - opexArr[index])
      );
    });
  });

  const chartData = Array.from(noiByAsset.entries()).map(([year, noi]) => ({
    year,
    value: noi,
  }));

  // Map assetId -> unit count for OPEX/Unit calculations
  const unitsByAssetId = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset) => {
      map.set(asset.id, asset.rentRoll.length);
    });
    return map;
  }, [assets]);

  // Build table rows for current year portfolio snapshot
  const portfolioRows: PortfolioRow[] = useMemo(() => {
    return timeSeries.map((series) => {
      const currentOpex =
        series.opex.find((o) => o.year === CURRENT_YEAR)?.totalOpexActual ?? 0;
      const currentGri =
        series.gri.find((g) => g.year === CURRENT_YEAR)?.gri ?? 0;
      const currentOccupancy =
        series.occupancy.find((o) => o.year === CURRENT_YEAR)?.occupancyRate ??
        0;
      const unitCount = unitsByAssetId.get(series.assetId) ?? 0;

      const noi = currentGri - currentOpex;
      const noiMargin = currentGri !== 0 ? (noi / currentGri) * 100 : 0;
      const vacancy = (1 - currentOccupancy) * 100;
      const opexPerUnit = unitCount > 0 ? currentOpex / unitCount : 0;

      return {
        property: series.assetName,
        vacancy,
        opex: currentOpex,
        opexPerUnit,
        noi,
        noiMargin,
      };
    });
  }, [timeSeries, unitsByAssetId]);

  const portfolioColumns: ColumnDef<PortfolioRow>[] = useMemo(
    () => [
      {
        accessorKey: "property",
        header: "Property",
        cell: ({ row }) => (
          <div
            className="text-left font-medium cursor-pointer"
            title={row.original.property}
            onClick={() => router.push(`/properties/${row.original.property}`)}
          >
            {row.original.property}
          </div>
        ),
      },
      {
        accessorKey: "vacancy",
        header: "Vacancy",
        cell: ({ row }) => {
          const value = row.original.vacancy;
          return (
            <div className="text-right">
              <Badge variant="secondary">
                {Number.isFinite(value) ? `${value.toFixed(2)}%` : "-"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "opex",
        header: "OPEX",
        cell: ({ row }) => {
          const value = row.original.opex;
          return (
            <div className="text-right">
              {Number.isFinite(value) ? `${dollarStringify(value)} DKK` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "opexPerUnit",
        header: "OPEX/Unit",
        cell: ({ row }) => {
          const value = row.original.opexPerUnit;
          return (
            <div className="text-right">
              {Number.isFinite(value) ? `${dollarStringify(value)} DKK` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "noi",
        header: "NOI",
        cell: ({ row }) => {
          const value = row.original.noi;
          return (
            <div className="text-right">
              {Number.isFinite(value) ? `${dollarStringify(value)} DKK` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "noiMargin",
        header: "NOI Margin",
        cell: ({ row }) => {
          const value = row.original.noiMargin;
          return (
            <div className="text-right">
              {Number.isFinite(value) ? `${value.toFixed(2)}%` : "-"}
            </div>
          );
        },
      },
    ],
    []
  );

  const portfolioTable = useReactTable({
    data: portfolioRows,
    columns: portfolioColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const vacancyRateTotal = timeSeries.reduce((sum, asset) => {
    const localVal = asset.occupancy.find(
      (c) => c.year === CURRENT_YEAR
    )?.occupancyRate;
    return sum + (localVal ?? 0);
  }, 0);
  const totalUnits = assets.reduce((sum, asset) => {
    return sum + asset.rentRoll.length;
  }, 0);

  const cardConfig = [
    {
      title: "Total NOI",
      description: "Total NOI across all assets",
      data: noiTotal,
    },
    {
      title: "Vacancy Rate",
      description: "Vacancy rate across all assets",
      data: vacancyRateTotal,
    },
    {
      title: "OPEX / Unit",
      description: "OPEX per unit across all assets",
      data: opexTotal / totalUnits,
    },
    {
      title: "CAPEX YTD",
      description: "CAPEX per unit across all assets",
      data: capexTotal,
    },
  ];

  if (isAssetsLoading) {
    return <MyAssetsSkeleton />;
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="text-muted-foreground">No asset data available.</div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {cardConfig.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold">
                {dollarStringify(card.data)}
                {card.title === "Vacancy Rate" ? "%" : "DKK"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <ChartLineDefault data={chartData} title="Total NOI" />
      </section>
      <section className="space-y-3">
        <Table
          table={portfolioTable}
          columnCount={portfolioTable.getAllLeafColumns().length}
          isLoading={isAssetsLoading}
        />
      </section>
    </div>
  );
}
