"use client";

import { PageAnimation } from "@/components/page-animation";
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
} from "../../../generated/client";
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

  const timeSeries = useMemo(() => buildAssetTimeSeries(assets), [assets]);

  const capexTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.capex.find(
        (c) => c.year === CURRENT_YEAR
      )?.totalCapexActual;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const opexTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.opex.find(
        (c) => c.year === CURRENT_YEAR
      )?.totalOpexActual;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const griTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.gri.find((c) => c.year === CURRENT_YEAR)?.gri;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const noiTotal = griTotal - opexTotal;

  // For all years, aggregate NOI (GRI - OPEX) per year across assets
  const chartData = useMemo(() => {
    const noiByYear = new Map<number, number>();

    timeSeries.forEach((asset) => {
      const opexByYear = new Map<number, number>();
      asset.opex.forEach((opex) => {
        opexByYear.set(opex.year, opex.totalOpexActual);
      });

      asset.gri.forEach((gri) => {
        const opexForYear = opexByYear.get(gri.year) ?? 0;
        const noi = gri.gri - opexForYear;
        const current = noiByYear.get(gri.year) ?? 0;
        noiByYear.set(gri.year, current + noi);
      });
    });

    return Array.from(noiByYear.entries())
      .map(([year, noi]) => ({ year, value: noi }))
      .sort((a, b) => a.year - b.year);
  }, [timeSeries]);

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

  const vacancyRateTotal = useMemo(() => {
    const validRates = timeSeries
      .map(
        (asset) =>
          asset.occupancy.find((c) => c.year === CURRENT_YEAR)?.occupancyRate
      )
      .filter((rate): rate is number => rate !== undefined);

    if (validRates.length === 0) return 0;
    const avgOccupancy =
      validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;
    return (1 - avgOccupancy) * 100;
  }, [timeSeries]);

  const totalUnits = useMemo(() => {
    return assets.reduce((sum, asset) => {
      return sum + asset.rentRoll.length;
    }, 0);
  }, [assets]);

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
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
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
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
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
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
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
    [router]
  );

  const portfolioTable = useReactTable({
    data: portfolioRows,
    columns: portfolioColumns,
    getCoreRowModel: getCoreRowModel(),
  });

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
    <PageAnimation>
      <div className="space-y-6">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4">
        {cardConfig.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5 overflow-hidden">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold">
                {dollarStringify({ value: card.data, format: "text" })}{" "}
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
    </PageAnimation>
  );
}
