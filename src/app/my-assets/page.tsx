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

const COLUMN_WIDTHS = {
  metric: 220,
  year: 120,
};

type TableRow = {
  metric: string;
  [year: string]: string | number | number[];
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

  console.log(tableData);

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

  const triColumns: ColumnDef<TableRow>[] = useMemo(
    () => [
      {
        id: "metric-group",
        header: "Line Item",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        columns: [
          {
            accessorKey: "metric",
            header: "", // second-row header under Metric should be empty
            size: COLUMN_WIDTHS.metric,
            minSize: COLUMN_WIDTHS.metric,
            footer: () => <div className="text-center w-40">GRI</div>,
            cell: ({ row }) => (
              <div className="text-left w-40">{row.original.metric}</div>
            ),
          },
        ],
      },
      ...years.map((year) => ({
        id: `${year}-group`,
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
            header: () => <div className="text-center">Actual</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            footer: ({ table }: { table: TanStackTable<TableRow> }) => {
              // GRI (Gross Rental Income) = TRI - vacancyLoss
              const rows = table.getRowModel().rows as Row<TableRow>[];
              const triAmountRow = rows.find(
                (r) => r.original.metric === "triAmount"
              );
              const vacancyLossRow = rows.find(
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

              return (
                <div className="text-center max-w-40">
                  <span className="">{gri ?? "-"}</span>
                </div>
              );
            },
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              return (
                <div className="text-center max-w-40">
                  <span className="">{value ?? "-"}</span>
                </div>
              );
            },
          },
          {
            id: `${year}-budget`,
            header: () => <div className="text-center">Budget</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            footer: ({ table }: { table: TanStackTable<TableRow> }) => {
              // Show GRI in both Actual and Budget footer columns for alignment
              const rows = table.getRowModel().rows as Row<TableRow>[];
              const triAmountRow = rows.find(
                (r) => r.original.metric === "triAmount"
              );
              const vacancyLossRow = rows.find(
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

              return (
                <div className="text-center max-w-40">
                  <span className="">{gri ?? "-"}</span>
                </div>
              );
            },
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              return (
                <div className="text-center max-w-40">
                  <span className="">{value ?? "-"}</span>
                </div>
              );
            },
          },
        ],
      })),
    ],
    [years]
  );

  const capexColumns: ColumnDef<TableRow>[] = useMemo(
    () => [
      {
        id: "metric-group",
        header: "Capital Expenditures (CapEx)",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        columns: [
          {
            accessorKey: "metric",
            header: "",
            size: COLUMN_WIDTHS.metric,
            minSize: COLUMN_WIDTHS.metric,
            footer: () => <div className="text-center w-40">Total</div>,
            cell: ({ row }) => (
              <div className="text-left w-40">{row.original.metric}</div>
            ),
          },
        ],
      },
      ...years.map((year) => ({
        id: `${year}-group`,
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
            header: () => <div className="text-center">Actual</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              const actual = Array.isArray(value) ? value[0] : value;
              return (
                <div className="text-center max-w-40">
                  <span className="">{actual ?? "-"}</span>
                </div>
              );
            },
          },
          {
            id: `${year}-budget`,

            header: () => <div className="text-center">Budget</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              const budget = Array.isArray(value) ? value[1] : undefined;
              return (
                <div className="text-center max-w-40">
                  <span className="">{budget ?? "-"}</span>
                </div>
              );
            },
          },
        ],
      })),
    ],
    [years]
  );

  const opexColumns: ColumnDef<TableRow>[] = useMemo(
    () => [
      {
        id: "metric-group",
        header: "Operating Expenses (OPEX)",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        columns: [
          {
            accessorKey: "metric",
            header: "",
            size: COLUMN_WIDTHS.metric,
            minSize: COLUMN_WIDTHS.metric,
            cell: ({ row }) => (
              <div className="text-left w-40">{row.original.metric}</div>
            ),
          },
        ],
      },
      ...years.map((year) => ({
        id: `${year}-group`,
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
            header: () => <div className="text-center">Actual</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              const actual = Array.isArray(value) ? value[0] : value;
              return (
                <div className="text-right max-w-40">
                  <span className="">{actual ?? "-"}</span>
                </div>
              );
            },
          },
          {
            id: `${year}-budget`,
            header: () => <div className="text-center">Budget</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              const budget = Array.isArray(value) ? value[1] : undefined;
              return (
                <div className="text-right max-w-40">
                  <span className="">{budget ?? "-"}</span>
                </div>
              );
            },
          },
        ],
      })),
    ],
    [years]
  );
  const triTable = useReactTable({
    data: activeAsset?.tri ?? [],
    columns: triColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const capexTable = useReactTable({
    data: activeAsset?.capex ?? [],
    columns: capexColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const opexTable = useReactTable({
    data: activeAsset?.opex ?? [],
    columns: opexColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
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
              table={triTable}
              columnCount={triTable.getAllLeafColumns().length}
              isLoading={isLoading}
            />
          </section>

          <section className="space-y-3">
            <section className="space-y-3">
              <Table
                table={opexTable}
                columnCount={opexTable.getAllLeafColumns().length}
                isLoading={isLoading}
              />
            </section>
            <Table
              table={capexTable}
              columnCount={capexTable.getAllLeafColumns().length}
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
