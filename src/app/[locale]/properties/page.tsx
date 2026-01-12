"use client";

import { PageAnimation } from "@/components/page-animation";
import { Badge } from "@/components/ui/badge";
import {
  BudgetVsActualChart,
  type BudgetVsActualData,
} from "@/components/ui/budget-vs-actual-chart";
import { Card, CardContent } from "@/components/ui/card";
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

  const noiMarginTotal = griTotal !== 0 ? (noiTotal / griTotal) * 100 : 0;

  const cardConfig = [
    {
      title: "GRI",
      description: "Gross Rental Income across all assets",
      data: griTotal,
      suffix: "DKK",
    },
    {
      title: "Vacancy Rate",
      description: "Vacancy rate across all assets",
      data: vacancyRateTotal,
      suffix: "%",
    },
    {
      title: "OPEX / Unit",
      description: "OPEX per unit across all assets",
      data: opexTotal / totalUnits,
      suffix: "DKK",
    },
    {
      title: "NOI %",
      description: "NOI margin across all assets",
      data: noiMarginTotal,
      suffix: "%",
    },
  ];

  // Budget vs Actual data for OPEX categories
  const budgetVsActualData: BudgetVsActualData[] = useMemo(() => {
    const categories = [
      {
        key: "property_taxes",
        label: "Property Taxes",
      },
      {
        key: "property_management_fee",
        label: "Management Fee",
      },
      {
        key: "common_consumption",
        label: "Common Consumption",
      },
      {
        key: "insurance",
        label: "Insurance",
      },
      {
        key: "cleaning",
        label: "Cleaning",
      },
      {
        key: "facility_management",
        label: "Facility Management",
      },
    ];

    return categories.map((cat) => {
      let totalActual = 0;
      let totalBudget = 0;

      assets.forEach((asset) => {
        const currentYearOpex = asset.opex.find(
          (o) => o.opex_year === CURRENT_YEAR
        );
        if (currentYearOpex) {
          const actualKey = `actual_${cat.key}` as keyof Opex;
          const budgetKey = `budget_${cat.key}` as keyof Opex;
          totalActual += (currentYearOpex[actualKey] as number) || 0;
          totalBudget += (currentYearOpex[budgetKey] as number) || 0;
        }
      });

      return {
        category: cat.label,
        actual: totalActual,
        budget: totalBudget,
      };
    });
  }, [assets]);

  if (isAssetsLoading) {
    return (
      <PageAnimation>
        <div className="space-y-6">
          <div className="w-full">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              My Assets
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Portfolio overview of all owned properties
            </p>
          </div>
          <MyAssetsSkeleton />
        </div>
      </PageAnimation>
    );
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
                <p className="kpi-label mb-2">{card.title}</p>
                <h3 className="text-2xl font-semibold font-serif tracking-tight">
                  {dollarStringify({ value: card.data, format: "text" })}{" "}
                  {card.suffix}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
        <section>
          <BudgetVsActualChart data={budgetVsActualData} />
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
