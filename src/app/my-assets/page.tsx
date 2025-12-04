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
        id: "tri-group",
        header: "Line Item",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        footer: () => <div className="text-left w-40">GRI</div>,
        columns: [
          {
            accessorKey: "metric",
            header: "", // second-row header under Metric should be empty
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
        footer: ({ table }: { table: TanStackTable<TableRow> }) => {
          const rows = table.getRowModel().rows as Row<TableRow>[];
          const triAmountRow = rows.find(
            (r) => r.original.metric === "triAmount"
          );
          const vacancyLossRow = rows.find(
            (r) => r.original.metric === "vacancyLoss"
          );

          console.log(triAmountRow?.original[year]);
          const [triBase1, triBase2] = triAmountRow?.original[year] as number[];
          const [vacancyBase1, vacancyBase2] = vacancyLossRow?.original[
            year
          ] as number[];

          const triNumber1 =
            typeof triBase1 === "number"
              ? triBase1
              : Array.isArray(triBase1)
              ? Number(triBase1[0])
              : undefined;
          const triNumber2 =
            typeof triBase2 === "number"
              ? triBase2
              : Array.isArray(triBase2)
              ? Number(triBase2[0])
              : undefined;

          const vacancyNumber1 =
            typeof vacancyBase1 === "number"
              ? vacancyBase1
              : Array.isArray(vacancyBase1)
              ? Number(vacancyBase1[0])
              : undefined;
          const vacancyNumber2 =
            typeof vacancyBase2 === "number"
              ? vacancyBase2
              : Array.isArray(vacancyBase2)
              ? Number(vacancyBase2[0])
              : undefined;

          const gri1 =
            triNumber1 != null && vacancyNumber1 != null
              ? triNumber1 - vacancyNumber1
              : undefined;
          const gri2 =
            triNumber2 != null && vacancyNumber2 != null
              ? triNumber2 - vacancyNumber2
              : undefined;

          return (
            <div className="flex flex-row gap-8">
              <div className="text-center w-full">{gri1 ?? "-"}</div>
              <div className="text-center w-full">{gri2 ?? "-"}</div>
            </div>
          );
        },
        columns: [
          {
            id: `${year}-actual`,
            header: () => <div className="text-center">Actual</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            footer: ({ table }: { table: TanStackTable<TableRow> }) => {
              // GRI (Gross Rental Income) = TRI - vacancyLoss for Actual
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
            footer: ({ table }: { table: TanStackTable<TableRow> }) => {
              // GRI (Gross Rental Income) = TRI - vacancyLoss for Budget
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

              return (
                <div className="text-center max-w-40">
                  <span className="">{gri ?? "-"}</span>
                </div>
              );
            },
            cell: ({ row }: { row: Row<TableRow> }) => {
              const value = row.original[year];
              const budget = Array.isArray(value) ? value[1] : value;
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

  const capexColumns: ColumnDef<TableRow>[] = useMemo(
    () => [
      {
        id: "capex-group",
        header: "Capital Expenditures (CapEx)",
        size: COLUMN_WIDTHS.metric,
        minSize: COLUMN_WIDTHS.metric,
        footer: () => <div className="text-left w-40">Total</div>,
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
        id: "opex-group",
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

  const netIncomeData: TableRow[] = useMemo(() => {
    if (!activeAsset) return [];
    return [
      {
        metric: "Net Income",
        ...years.reduce((acc, year) => {
          acc[year] = [0, 0];
          return acc;
        }, {} as Record<string, number[]>),
      },
    ];
  }, [activeAsset, years]);

  const netIncomeColumns: ColumnDef<TableRow>[] = useMemo(
    () => [
      {
        id: "net-income-group",
        header: "Net Income",
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
            cell: () => {
              const triRows = triTable.getRowModel().rows as Row<TableRow>[];
              const opexRows = opexTable.getRowModel().rows as Row<TableRow>[];

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

              return (
                <div className="text-center max-w-40">
                  <span className="">{netIncome ?? "-"}</span>
                </div>
              );
            },
          },
          {
            id: `${year}-budget`,
            header: () => <div className="text-center">Budget</div>,
            size: COLUMN_WIDTHS.year,
            minSize: COLUMN_WIDTHS.year,
            cell: () => {
              const triRows = triTable.getRowModel().rows as Row<TableRow>[];
              const opexRows = opexTable.getRowModel().rows as Row<TableRow>[];

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

              return (
                <div className="text-center max-w-40">
                  <span className="">{netIncome ?? "-"}</span>
                </div>
              );
            },
          },
        ],
      })),
    ],
    [years, triTable, opexTable]
  );

  const netIncomeTable = useReactTable({
    data: netIncomeData,
    columns: netIncomeColumns,
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
            <Table
              table={opexTable}
              columnCount={opexTable.getAllLeafColumns().length}
              isLoading={isLoading}
            />
          </section>

          <section className="space-y-3">
            <Table
              table={netIncomeTable}
              columnCount={netIncomeTable.getAllLeafColumns().length}
              isLoading={isLoading}
            />
          </section>

          <section className="space-y-3">
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
