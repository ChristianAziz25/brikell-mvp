"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChartBarMultiple } from "@/components/ui/multiple-bar-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Opex } from "@/generated/client";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface OpexWithAssetName extends Opex {
  assetName: string;
}

type CategoryBreakdownRow = {
  category: string;
  totalYTD: number;
  variance: string;
} & Record<string, string | number>;

// Helper function to extract category name from field name
const getCategoryName = (fieldName: string): string => {
  // Remove 'actual_' or 'budget_' prefix and convert snake_case to Title Case
  const name = fieldName.replace(/^(actual_|budget_)/, "");
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to dynamically extract actual/budget field pairs from OPEX data
const extractFieldPairs = (
  opexData: OpexWithAssetName[]
): Map<
  string,
  { actualKey: keyof Opex; budgetKey: keyof Opex; categoryName: string }
> => {
  if (opexData.length === 0) return new Map();

  const fieldPairs = new Map<
    string,
    { actualKey: keyof Opex; budgetKey: keyof Opex; categoryName: string }
  >();
  const firstOpex = opexData[0];

  // Get all keys from the first Opex object
  const allKeys = Object.keys(firstOpex) as (keyof Opex)[];

  // Find all actual_* fields
  const actualFields = allKeys.filter(
    (key) => typeof key === "string" && key.startsWith("actual_")
  );

  // For each actual field, try to find its corresponding budget field
  actualFields.forEach((actualKey) => {
    const actualKeyStr = actualKey as string;
    const fieldName = actualKeyStr.replace("actual_", "");
    const budgetKey = `budget_${fieldName}` as keyof Opex;

    // Check if both actual and budget fields exist
    if (allKeys.includes(budgetKey)) {
      const categoryName = getCategoryName(actualKeyStr);
      fieldPairs.set(categoryName, {
        actualKey,
        budgetKey,
        categoryName,
      });
    }
  });

  return fieldPairs;
};

export default function Opex() {
  const [period, setPeriod] = useState("Monthly");
  const [category, setCategory] = useState("All Categories");
  const [building, setBuilding] = useState("All Buildings");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: opexData = [],
    isLoading,
    isError,
    error,
  } = useQuery<OpexWithAssetName[]>({
    queryKey: ["opex"],
    queryFn: async () => {
      const res = await fetch("/api/opex");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch OPEX data");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Get unique assets for building filter
  const assets = useMemo(
    () => Array.from(new Set(opexData.map((opex) => opex.assetName))),
    [opexData]
  );

  // Filter data based on selected building
  const filteredData = useMemo(() => {
    if (building === "All Buildings") return opexData;
    return opexData.filter((opex) => opex.assetName === building);
  }, [opexData, building]);

  // Get the latest year's data for Budget vs Actual chart
  const latestYear = useMemo(() => {
    if (filteredData.length === 0) return null;
    return Math.max(...filteredData.map((opex) => opex.opex_year));
  }, [filteredData]);

  const latestYearData = useMemo(() => {
    if (!latestYear) return [];
    return filteredData.filter((opex) => opex.opex_year === latestYear);
  }, [filteredData, latestYear]);

  // Extract field pairs dynamically
  const fieldPairs = useMemo(
    () => extractFieldPairs(filteredData),
    [filteredData]
  );

  // Get available categories for the filter
  const availableCategories = useMemo(() => {
    return Array.from(fieldPairs.keys()).sort();
  }, [fieldPairs]);

  // Aggregate by category for the latest year
  const budgetVsActualData = useMemo(() => {
    if (latestYearData.length === 0 || fieldPairs.size === 0) return [];

    const categoryTotals = Array.from(fieldPairs.values()).reduce(
      (acc, pair) => {
        acc[pair.categoryName] = {
          category: pair.categoryName,
          budget: 0,
          actual: 0,
        };
        return acc;
      },
      {} as Record<string, { category: string; budget: number; actual: number }>
    );

    latestYearData.forEach((opex) => {
      fieldPairs.forEach((pair) => {
        const actual = (opex[pair.actualKey] as number) || 0;
        const budget = (opex[pair.budgetKey] as number) || 0;

        categoryTotals[pair.categoryName].actual += actual;
        categoryTotals[pair.categoryName].budget += budget;
      });
    });

    // Filter by selected category if not "All Categories"
    let result = Object.values(categoryTotals);
    if (category !== "All Categories") {
      result = result.filter((item) => item.category === category);
    }

    return result.sort((a, b) => b.budget - a.budget);
  }, [latestYearData, category, fieldPairs]);

  // OPEX Trend data - aggregate total OPEX by year
  const opexTrendData = useMemo(() => {
    const yearTotals = new Map<number, number>();

    filteredData.forEach((opex) => {
      // Dynamically sum all actual_* fields using fieldPairs
      let total = 0;
      fieldPairs.forEach((pair) => {
        const actual = (opex[pair.actualKey] as number) || 0;
        total += actual;
      });

      yearTotals.set(
        opex.opex_year,
        (yearTotals.get(opex.opex_year) || 0) + total
      );
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [filteredData, fieldPairs]);

  // Get all unique years from filtered data
  const allYears = useMemo(() => {
    const years = new Set(filteredData.map((opex) => opex.opex_year));
    return Array.from(years).sort((a, b) => a - b);
  }, [filteredData]);

  // Category breakdown table data - time series by year
  const categoryBreakdownData = useMemo(() => {
    if (filteredData.length === 0 || fieldPairs.size === 0) return [];

    // Build time series data for each category across all years
    const categoryData = Array.from(fieldPairs.values()).map((pair) => {
      // Aggregate by year for this category
      const yearData = new Map<number, { actual: number; budget: number }>();

      filteredData.forEach((opex) => {
        const actual = (opex[pair.actualKey] as number) || 0;
        const budget = (opex[pair.budgetKey] as number) || 0;

        const existing = yearData.get(opex.opex_year) || {
          actual: 0,
          budget: 0,
        };
        yearData.set(opex.opex_year, {
          actual: existing.actual + actual,
          budget: existing.budget + budget,
        });
      });

      let totalActual = 0;
      let totalBudget = 0;
      const yearValues: Record<string, number> = {};

      allYears.forEach((year) => {
        const data = yearData.get(year) || { actual: 0, budget: 0 };
        const value = data.actual;
        yearValues[year.toString()] = Math.round(value / 1000);
        totalActual += data.actual;
        totalBudget += data.budget;
      });

      const totalVariance =
        totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

      return {
        category: pair.categoryName,
        ...yearValues,
        totalYTD: Math.round(totalActual / 1000),
        variance: `${totalVariance >= 0 ? "+" : ""}${Math.round(
          totalVariance
        )}%`,
      };
    });

    return categoryData;
  }, [filteredData, fieldPairs, allYears]);

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "hsl(220, 13%, 13%)",
    },
    actual: {
      label: "Actual",
      color: "hsl(220, 9%, 70%)",
    },
  } satisfies ChartConfig;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return value.toString();
  };

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<CategoryBreakdownRow>[]>(() => {
    const yearColumns: ColumnDef<CategoryBreakdownRow>[] = allYears.map(
      (year) => ({
        accessorKey: year.toString(),
        header: () => <div className="text-right">{year}</div>,
        cell: ({ getValue }) => (
          <div className="text-right text-foreground">
            {getValue<number>() || 0}K
          </div>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const cellValue = row.getValue(id) as number;
          if (value === undefined || value === "") return true;
          const filterValue = Number(value);
          if (Number.isNaN(filterValue)) return true;
          return cellValue >= filterValue;
        },
      })
    );

    return [
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      ...yearColumns,
      {
        accessorKey: "totalYTD",
        header: () => <div className="text-right">Total YTD</div>,
        cell: ({ getValue }) => (
          <div className="text-right font-medium text-foreground">
            {getValue<number>()}K
          </div>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const cellValue = row.getValue(id) as number;
          if (value === undefined || value === "") return true;
          const filterValue = Number(value);
          if (Number.isNaN(filterValue)) return true;
          return cellValue >= filterValue;
        },
      },
      {
        accessorKey: "variance",
        header: () => <div className="text-right">Variance</div>,
        cell: ({ getValue }) => (
          <div className="text-right text-muted-foreground">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
    ];
  }, [allYears]);

  // Create table instance
  const table = useReactTable({
    data: categoryBreakdownData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
    globalFilterFn: "includesString",
  });

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter("");
  };

  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load OPEX data"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Annual">Annual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={building} onValueChange={setBuilding}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Buildings">All Buildings</SelectItem>
            {assets.map((asset) => (
              <SelectItem key={asset} value={asset}>
                {asset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        {budgetVsActualData.length > 0 ? (
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <ChartBarMultiple
                  data={budgetVsActualData.slice(0, 3)}
                  config={chartConfig}
                  title="Budget vs Actual"
                  categoryKey="category"
                  valueKey="budget"
                  interactive={false}
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <ChartBarMultiple
                data={budgetVsActualData}
                config={chartConfig}
                title="Budget vs Actual"
                categoryKey="category"
                valueKey="budget"
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
            <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
              <CardTitle className="tracking-tight text-base font-medium">
                Budget vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            </CardContent>
          </Card>
        )}
        {/* OPEX Trend Chart */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
          <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
            <CardTitle className="tracking-tight text-base font-medium">
              OPEX Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-64">
              {opexTrendData.length > 0 ? (
                <ChartContainer
                  config={{
                    value: {
                      label: "OPEX",
                      color: "hsl(220, 13%, 13%)",
                    },
                  }}
                >
                  <LineChart
                    accessibilityLayer
                    data={opexTrendData.map((d) => ({
                      year: d.year,
                      value: d.value,
                    }))}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => String(value)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[
                        (dataMin: number) => {
                          if (!Number.isFinite(dataMin)) return 0;
                          return dataMin === 0
                            ? 0
                            : dataMin - Math.abs(dataMin) * 0.1;
                        },
                        (dataMax: number) => {
                          if (!Number.isFinite(dataMax)) return 1;
                          return dataMax === 0
                            ? 0
                            : dataMax + Math.abs(dataMax) * 0.1;
                        },
                      ]}
                      tickFormatter={(value) =>
                        typeof value === "number"
                          ? formatCurrency(value)
                          : String(value)
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                      dataKey="value"
                      type="natural"
                      stroke="hsl(220, 13%, 13%)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="tracking-tight text-base font-medium">
              Category Breakdown
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Search categories..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            {table.getColumn("category") && (
              <Select
                value={
                  (table.getColumn("category")?.getFilterValue() as string) ||
                  "all"
                }
                onValueChange={(value: string) => {
                  table
                    .getColumn("category")
                    ?.setFilterValue(value === "all" ? undefined : value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(
                    table
                      .getColumn("category")
                      ?.getFacetedUniqueValues()
                      .keys() || []
                  ).map((value) => (
                    <SelectItem key={value} value={value as string}>
                      {value as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b transition-colors hover:bg-transparent border-border"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-12 px-4 align-middle text-muted-foreground font-medium"
                        style={{
                          textAlign:
                            header.id === "category"
                              ? "left"
                              : header.id === "variance" ||
                                header.id === "totalYTD" ||
                                allYears.includes(Number(header.id))
                              ? "right"
                              : "left",
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50 border-border"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="p-4 align-middle"
                          style={{
                            textAlign:
                              cell.column.id === "category"
                                ? "left"
                                : cell.column.id === "variance" ||
                                  cell.column.id === "totalYTD" ||
                                  allYears.includes(Number(cell.column.id))
                                ? "right"
                                : "left",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
