"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  Row,
  useReactTable,
  type ColumnDef,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Table } from "./Table";
import { dollarStringify } from "./util/dollarStringify";

const COLUMN_WIDTHS = {
  metric: 220,
  year: 120,
};

type TableRow = {
  metric: string;
  [year: string]: string | number | number[] | boolean | undefined;
};

type UnifiedTableRow = TableRow & {
  section: "tri" | "capex" | "opex" | "noi";
  isSectionHeader?: boolean;
  isFooterRow?: boolean;
};

interface TableData {
  name: string;
  tri: TableRow[];
  capex: TableRow[];
  opex: TableRow[];
}

export default function MyAssets() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const { data: tableData = [], isLoading } = useQuery<TableData[]>({
    queryKey: ["asset-table-data"],
    queryFn: async () => {
      const res = await fetch(`/api/assets`);
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const activeAsset = useMemo(() => {
    if (!tableData.length) return undefined;
    if (!selectedAsset) return tableData[0];
    return (
      tableData.find((asset) => asset.name === selectedAsset) ?? tableData[0]
    );
  }, [selectedAsset, tableData]);

  const years = useMemo(() => {
    if (!activeAsset) return [] as string[];

    const yearSet = new Set<string>();
    const collectYears = (rows: TableRow[]) => {
      rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key !== "metric") {
            yearSet.add(key);
          }
        });
      });
    };

    collectYears(activeAsset.tri);
    collectYears(activeAsset.capex);
    collectYears(activeAsset.opex);

    return Array.from(yearSet).sort(
      (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)
    );
  }, [activeAsset]);

  // Unified data combining all sections
  const unifiedData: UnifiedTableRow[] = useMemo(() => {
    if (!activeAsset) return [];

    const data: UnifiedTableRow[] = [];

    // TRI Section
    data.push({
      metric: "TRI",
      section: "tri",
      isSectionHeader: true,
      ...years.reduce((acc, year) => {
        acc[year] = [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });
    data.push(
      ...activeAsset.tri.map((row) => ({
        ...row,
        section: "tri" as const,
      }))
    );

    // TRI Footer: GRI
    const triAmountRow = activeAsset.tri.find((r) => r.metric === "triAmount");
    const vacancyLossRow = activeAsset.tri.find(
      (r) => r.metric === "vacancyLoss"
    );
    data.push({
      metric: "GRI",
      section: "tri",
      isFooterRow: true,
      ...years.reduce((acc, year) => {
        const triBase = triAmountRow?.[year];
        const vacancyBase = vacancyLossRow?.[year];

        const triNumberActual =
          typeof triBase === "number"
            ? triBase
            : Array.isArray(triBase)
            ? Number(triBase[0])
            : undefined;
        const triNumberBudget =
          typeof triBase === "number"
            ? triBase
            : Array.isArray(triBase)
            ? Number(triBase[1])
            : undefined;

        const vacancyNumberActual =
          typeof vacancyBase === "number"
            ? vacancyBase
            : Array.isArray(vacancyBase)
            ? Number(vacancyBase[0])
            : undefined;
        const vacancyNumberBudget =
          typeof vacancyBase === "number"
            ? vacancyBase
            : Array.isArray(vacancyBase)
            ? Number(vacancyBase[1])
            : undefined;

        const griActual =
          triNumberActual != null && vacancyNumberActual != null
            ? triNumberActual - vacancyNumberActual
            : undefined;
        const griBudget =
          triNumberBudget != null && vacancyNumberBudget != null
            ? triNumberBudget - vacancyNumberBudget
            : undefined;

        acc[year] =
          griActual != null && griBudget != null
            ? [griActual, griBudget]
            : [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });

    // OPEX Section
    data.push({
      metric: "Operating Expenses (OPEX)",
      section: "opex",
      isSectionHeader: true,
      ...years.reduce((acc, year) => {
        acc[year] = [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });
    data.push(
      ...activeAsset.opex.map((row) => ({
        ...row,
        section: "opex" as const,
      }))
    );

    // OPEX Footer: Total
    data.push({
      metric: "Total",
      section: "opex",
      isFooterRow: true,
      ...years.reduce((acc, year) => {
        const totalActual = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const actual = Array.isArray(value) ? value[0] : value;
          const numValue =
            typeof actual === "number" ? actual : Number(actual) || 0;
          return sum + numValue;
        }, 0);

        const totalBudget = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const budget = Array.isArray(value) ? value[1] : value;
          const numValue =
            typeof budget === "number" ? budget : Number(budget) || 0;
          return sum + numValue;
        }, 0);

        acc[year] = [totalActual, totalBudget];
        return acc;
      }, {} as Record<string, number[]>),
    });

    // NOI Section
    data.push({
      metric: "NOI",
      section: "noi",
      isSectionHeader: true,
      ...years.reduce((acc, year) => {
        acc[year] = [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });

    // Calculate NOI values
    const noiRow: UnifiedTableRow = {
      metric: "NOI",
      section: "noi",
      ...years.reduce((acc, year) => {
        const triAmountRow = activeAsset.tri.find(
          (r) => r.metric === "triAmount"
        );
        const vacancyLossRow = activeAsset.tri.find(
          (r) => r.metric === "vacancyLoss"
        );

        const triBaseActual = triAmountRow?.[year];
        const vacancyBaseActual = vacancyLossRow?.[year];
        const triBaseBudget = triAmountRow?.[year];
        const vacancyBaseBudget = vacancyLossRow?.[year];

        const triNumberActual =
          typeof triBaseActual === "number"
            ? triBaseActual
            : Array.isArray(triBaseActual)
            ? Number(triBaseActual[0])
            : undefined;

        const vacancyNumberActual =
          typeof vacancyBaseActual === "number"
            ? vacancyBaseActual
            : Array.isArray(vacancyBaseActual)
            ? Number(vacancyBaseActual[0])
            : undefined;

        const triNumberBudget =
          typeof triBaseBudget === "number"
            ? triBaseBudget
            : Array.isArray(triBaseBudget)
            ? Number(triBaseBudget[1])
            : undefined;

        const vacancyNumberBudget =
          typeof vacancyBaseBudget === "number"
            ? vacancyBaseBudget
            : Array.isArray(vacancyBaseBudget)
            ? Number(vacancyBaseBudget[1])
            : undefined;

        const griActual =
          triNumberActual != null && vacancyNumberActual != null
            ? triNumberActual - vacancyNumberActual
            : undefined;

        const griBudget =
          triNumberBudget != null && vacancyNumberBudget != null
            ? triNumberBudget - vacancyNumberBudget
            : undefined;

        const totalOpexActual = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const actual = Array.isArray(value) ? value[0] : value;
          const numValue =
            typeof actual === "number" ? actual : Number(actual) || 0;
          return sum + numValue;
        }, 0);

        const totalOpexBudget = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const budget = Array.isArray(value) ? value[1] : value;
          const numValue =
            typeof budget === "number" ? budget : Number(budget) || 0;
          return sum + numValue;
        }, 0);

        const noiActual =
          griActual != null ? griActual - totalOpexActual : undefined;
        const noiBudget =
          griBudget != null ? griBudget - totalOpexBudget : undefined;

        acc[year] =
          noiActual != null && noiBudget != null
            ? [noiActual, noiBudget]
            : [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    };
    data.push(noiRow);

    // NOI Footer: NOI Margin
    data.push({
      metric: "NOI Margin",
      section: "noi",
      isFooterRow: true,
      ...years.reduce((acc, year) => {
        const triAmountRow = activeAsset.tri.find(
          (r) => r.metric === "triAmount"
        );
        const vacancyLossRow = activeAsset.tri.find(
          (r) => r.metric === "vacancyLoss"
        );

        const triBaseActual = triAmountRow?.[year];
        const vacancyBaseActual = vacancyLossRow?.[year];
        const triBaseBudget = triAmountRow?.[year];
        const vacancyBaseBudget = vacancyLossRow?.[year];

        const triNumberActual =
          typeof triBaseActual === "number"
            ? triBaseActual
            : Array.isArray(triBaseActual)
            ? Number(triBaseActual[0])
            : undefined;

        const vacancyNumberActual =
          typeof vacancyBaseActual === "number"
            ? vacancyBaseActual
            : Array.isArray(vacancyBaseActual)
            ? Number(vacancyBaseActual[0])
            : undefined;

        const triNumberBudget =
          typeof triBaseBudget === "number"
            ? triBaseBudget
            : Array.isArray(triBaseBudget)
            ? Number(triBaseBudget[1])
            : undefined;

        const vacancyNumberBudget =
          typeof vacancyBaseBudget === "number"
            ? vacancyBaseBudget
            : Array.isArray(vacancyBaseBudget)
            ? Number(vacancyBaseBudget[1])
            : undefined;

        const griActual =
          triNumberActual != null && vacancyNumberActual != null
            ? triNumberActual - vacancyNumberActual
            : undefined;

        const griBudget =
          triNumberBudget != null && vacancyNumberBudget != null
            ? triNumberBudget - vacancyNumberBudget
            : undefined;

        const totalOpexActual = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const actual = Array.isArray(value) ? value[0] : value;
          const numValue =
            typeof actual === "number" ? actual : Number(actual) || 0;
          return sum + numValue;
        }, 0);

        const totalOpexBudget = activeAsset.opex.reduce((sum, row) => {
          const value = row[year];
          const budget = Array.isArray(value) ? value[1] : value;
          const numValue =
            typeof budget === "number" ? budget : Number(budget) || 0;
          return sum + numValue;
        }, 0);

        const noiActual =
          griActual != null ? griActual - totalOpexActual : undefined;
        const noiBudget =
          griBudget != null ? griBudget - totalOpexBudget : undefined;

        const noiMarginActual =
          griActual != null && griActual !== 0 && noiActual != null
            ? (noiActual / griActual) * 100
            : undefined;
        const noiMarginBudget =
          griBudget != null && griBudget !== 0 && noiBudget != null
            ? (noiBudget / griBudget) * 100
            : undefined;

        acc[year] =
          noiMarginActual != null && noiMarginBudget != null
            ? [noiMarginActual, noiMarginBudget]
            : [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });

    // CAPEX Section
    data.push({
      metric: "Capital Expenditures (CapEx)",
      section: "capex",
      isSectionHeader: true,
      ...years.reduce((acc, year) => {
        acc[year] = [0, 0];
        return acc;
      }, {} as Record<string, number[]>),
    });
    data.push(
      ...activeAsset.capex.map((row) => ({
        ...row,
        section: "capex" as const,
      }))
    );

    // CAPEX Footer: Total
    data.push({
      metric: "Total",
      section: "capex",
      isFooterRow: true,
      ...years.reduce((acc, year) => {
        const totalActual = activeAsset.capex.reduce((sum, row) => {
          const value = row[year];
          const actual = Array.isArray(value) ? value[0] : value;
          const numValue =
            typeof actual === "number" ? actual : Number(actual) || 0;
          return sum + numValue;
        }, 0);

        const totalBudget = activeAsset.capex.reduce((sum, row) => {
          const value = row[year];
          const budget = Array.isArray(value) ? value[1] : value;
          const numValue =
            typeof budget === "number" ? budget : Number(budget) || 0;
          return sum + numValue;
        }, 0);

        acc[year] = [totalActual, totalBudget];
        return acc;
      }, {} as Record<string, number[]>),
    });

    return data;
  }, [activeAsset, years]);

  // Unified columns for all sections
  const unifiedColumns: ColumnDef<UnifiedTableRow>[] = useMemo(
    () => [
      {
        id: "metric-group",
        header: "Metric",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        columns: [
          {
            accessorKey: "metric",
            header: "",
            size: COLUMN_WIDTHS.metric,
            minSize: COLUMN_WIDTHS.metric,
            cell: ({ row }) => {
              const metric =
                row.original.metric === "triAmount"
                  ? "TRI"
                  : row.original.metric === "vacancyLoss"
                  ? "Vacancy Loss"
                  : row.original.metric
                      .split("_")
                      .join(" ")
                      .charAt(0)
                      .toUpperCase() +
                    row.original.metric.split("_").join(" ").slice(1);
              if (row.original.isSectionHeader) {
                return (
                  <div className="text-left w-40 font-semibold py-2">
                    {row.original.metric}
                  </div>
                );
              }
              if (row.original.isFooterRow) {
                return (
                  <div className="text-left w-40 font-semibold">
                    {row.original.metric}
                  </div>
                );
              }
              return <div className="text-left w-40">{metric}</div>;
            },
          },
        ],
      },
      ...years.map((year, yearIndex) => ({
        id: `${year}-group`,
        meta: { isYearGroup: true, yearIndex },
        header: () => {
          return (
            <div className="flex flex-row gap-8">
              <div className="text-center w-full">{year}</div>
              <div className="text-center w-full">{year}</div>
            </div>
          );
        },
        size: COLUMN_WIDTHS.year * 2,
        minSize: COLUMN_WIDTHS.year * 2,
        columns: [
          {
            id: `${year}-actual`,
            meta: { isYearGroup: true, yearIndex, isFirstInGroup: true },
            header: () => <div className="text-center">Actual</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({
              row,
              table,
            }: {
              row: Row<UnifiedTableRow>;
              table: TanStackTable<UnifiedTableRow>;
            }) => {
              if (row.original.isSectionHeader) {
                return <div className="text-center max-w-40"></div>;
              }

              if (row.original.isFooterRow) {
                const value = row.original[year];
                const actual = Array.isArray(value) ? value[0] : value;

                // NOI Margin footer should display as percentage
                if (
                  row.original.section === "noi" &&
                  row.original.metric === "NOI Margin"
                ) {
                  const displayValue =
                    typeof actual === "number" && actual !== 0
                      ? `${actual.toFixed(2)}%`
                      : "-";
                  return (
                    <div className="text-center max-w-40 font-semibold">
                      <span className="">{displayValue}</span>
                    </div>
                  );
                }

                const displayValue =
                  typeof actual === "number" ? dollarStringify(actual) : "-";
                return (
                  <div className="text-center max-w-40 font-semibold">
                    <span className="">{displayValue}</span>
                  </div>
                );
              }

              if (
                row.original.section === "noi" &&
                !row.original.isSectionHeader
              ) {
                const allRows = table.getRowModel()
                  .rows as Row<UnifiedTableRow>[];
                const triRows = allRows.filter(
                  (r) =>
                    r.original.section === "tri" &&
                    !r.original.isSectionHeader &&
                    !r.original.isFooterRow
                );
                const opexRows = allRows.filter(
                  (r) =>
                    r.original.section === "opex" &&
                    !r.original.isSectionHeader &&
                    !r.original.isFooterRow
                );

                const triAmountRow = triRows.find(
                  (r) => r.original.metric === "triAmount"
                );
                const vacancyLossRow = triRows.find(
                  (r) => r.original.metric === "vacancyLoss"
                );

                const triBase = triAmountRow?.original[year];
                const vacancyBase = vacancyLossRow?.original[year];

                const triNumber =
                  typeof triBase === "number"
                    ? triBase
                    : Array.isArray(triBase)
                    ? Number(triBase[0])
                    : undefined;

                const vacancyNumber =
                  typeof vacancyBase === "number"
                    ? vacancyBase
                    : Array.isArray(vacancyBase)
                    ? Number(vacancyBase[0])
                    : undefined;

                const gri =
                  triNumber != null && vacancyNumber != null
                    ? triNumber - vacancyNumber
                    : undefined;

                const totalOpex = opexRows.reduce((sum, row) => {
                  const value = row.original[year];
                  const actual = Array.isArray(value) ? value[0] : value;
                  const numValue =
                    typeof actual === "number" ? actual : Number(actual) || 0;
                  return sum + numValue;
                }, 0);

                const netIncome = gri != null ? gri - totalOpex : undefined;

                const displayValue =
                  typeof netIncome === "number"
                    ? dollarStringify(netIncome)
                    : "-";
                return (
                  <div className="text-center max-w-40">
                    <span className="">{displayValue}</span>
                  </div>
                );
              }

              const value = row.original[year];
              const actual = Array.isArray(value) ? value[0] : value;
              const displayValue =
                typeof actual === "number" ? dollarStringify(actual) : "-";
              return (
                <div className="text-center max-w-40">
                  <span className="">{displayValue}</span>
                </div>
              );
            },
          },
          {
            id: `${year}-budget`,
            header: () => <div className="text-center">Budget</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({
              row,
              table,
            }: {
              row: Row<UnifiedTableRow>;
              table: TanStackTable<UnifiedTableRow>;
            }) => {
              if (row.original.isSectionHeader) {
                return <div className="text-center max-w-40"></div>;
              }

              if (row.original.isFooterRow) {
                const value = row.original[year];
                const budget = Array.isArray(value) ? value[1] : value;

                // NOI Margin footer should display as percentage
                if (
                  row.original.section === "noi" &&
                  row.original.metric === "NOI Margin"
                ) {
                  const displayValue =
                    typeof budget === "number" && budget !== 0
                      ? `${budget.toFixed(2)}%`
                      : "-";
                  return (
                    <div className="text-center max-w-40 font-semibold">
                      <span className="">{displayValue}</span>
                    </div>
                  );
                }

                const displayValue =
                  typeof budget === "number" ? dollarStringify(budget) : "-";
                return (
                  <div className="text-center max-w-40 font-semibold">
                    <span className="">{displayValue}</span>
                  </div>
                );
              }

              if (
                row.original.section === "noi" &&
                !row.original.isSectionHeader
              ) {
                const allRows = table.getRowModel()
                  .rows as Row<UnifiedTableRow>[];
                const triRows = allRows.filter(
                  (r) =>
                    r.original.section === "tri" &&
                    !r.original.isSectionHeader &&
                    !r.original.isFooterRow
                );
                const opexRows = allRows.filter(
                  (r) =>
                    r.original.section === "opex" &&
                    !r.original.isSectionHeader &&
                    !r.original.isFooterRow
                );

                const triAmountRow = triRows.find(
                  (r) => r.original.metric === "triAmount"
                );
                const vacancyLossRow = triRows.find(
                  (r) => r.original.metric === "vacancyLoss"
                );

                const triBase = triAmountRow?.original[year];
                const vacancyBase = vacancyLossRow?.original[year];

                const triNumber =
                  typeof triBase === "number"
                    ? triBase
                    : Array.isArray(triBase)
                    ? Number(triBase[1])
                    : undefined;

                const vacancyNumber =
                  typeof vacancyBase === "number"
                    ? vacancyBase
                    : Array.isArray(vacancyBase)
                    ? Number(vacancyBase[1])
                    : undefined;

                const gri =
                  triNumber != null && vacancyNumber != null
                    ? triNumber - vacancyNumber
                    : undefined;

                const totalOpex = opexRows.reduce((sum, row) => {
                  const value = row.original[year];
                  const budget = Array.isArray(value) ? value[1] : value;
                  const numValue =
                    typeof budget === "number" ? budget : Number(budget) || 0;
                  return sum + numValue;
                }, 0);

                const netIncome = gri != null ? gri - totalOpex : undefined;

                const displayValue =
                  typeof netIncome === "number"
                    ? dollarStringify(netIncome)
                    : "-";
                return (
                  <div className="text-center max-w-40">
                    <span className="">{displayValue}</span>
                  </div>
                );
              }

              const value = row.original[year];
              const budget = Array.isArray(value) ? value[1] : value;
              const displayValue =
                typeof budget === "number" ? dollarStringify(budget) : "-";
              return (
                <div className="text-center max-w-40">
                  <span className="">{displayValue}</span>
                </div>
              );
            },
          },
        ],
      })),
    ],
    [years]
  );

  // Unified table instance
  const unifiedTable = useReactTable({
    data: unifiedData,
    columns: unifiedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="w-full">
        <h2 className="text-2xl font-medium tracking-tight text-foreground">
          My Assets
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Portfolio overview of all owned properties
        </p>
      </div>
      <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
        {tableData.map((asset) => (
          <Button
            key={asset.name}
            variant={asset.name === activeAsset?.name ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setSelectedAsset(asset.name)}
          >
            <span className="font-medium">{asset.name}</span>
          </Button>
        ))}
      </div>

      {activeAsset ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <Table
              table={unifiedTable}
              columnCount={unifiedTable.getAllLeafColumns().length}
              isLoading={isLoading}
            />
          </section>
        </div>
      ) : (
        <div className="text-muted-foreground">No asset data available.</div>
      )}
    </div>
  );
}
