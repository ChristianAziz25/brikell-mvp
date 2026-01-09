"use client";

import type {
  DataLibraryData,
  DataSource,
  RecentUpdate,
} from "@/app/api/data-library/route";
import { PageAnimation } from "@/components/page-animation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Calendar, Database, RefreshCw, Table } from "lucide-react";
import { useMemo, useState } from "react";
import DataLibraryLoading from "./loading";

export default function DataLibrary() {
  const [dataSourceColumnFilters, setDataSourceColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [recentUpdateColumnFilters, setRecentUpdateColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [dataSourceGlobalFilter, setDataSourceGlobalFilter] = useState("");
  const [recentUpdateGlobalFilter, setRecentUpdateGlobalFilter] = useState("");

  const { data, isLoading, isError, error } = useQuery<DataLibraryData>({
    queryKey: ["data-library"],
    queryFn: async () => {
      const res = await fetch("/api/data-library");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch data library");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Data Sources columns
  const dataSourceColumns = useMemo<ColumnDef<DataSource>[]>(
    () => [
      {
        id: "icon",
        header: "",
        cell: () => (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Database className="w-5 h-5 text-muted-foreground" />
          </div>
        ),
        enableColumnFilter: false,
        size: 60,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.original.recordCount.toLocaleString()} records • Last sync:{" "}
              {row.original.lastSync}
            </p>
          </div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue<string>()}</Badge>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
    ],
    []
  );

  // Recent Updates columns
  const recentUpdateColumns = useMemo<ColumnDef<RecentUpdate>[]>(
    () => [
      {
        id: "icon",
        header: "",
        cell: () => (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Table className="w-5 h-5 text-muted-foreground" />
          </div>
        ),
        enableColumnFilter: false,
        size: 60,
      },
      {
        accessorKey: "tableName",
        header: "Table",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground font-mono text-sm">
              {row.original.tableName}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.action} {row.original.recordCount} records
            </p>
          </div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        id: "timestamp",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {row.original.timestamp}
          </div>
        ),
        enableColumnFilter: false,
      },
    ],
    []
  );

  // Data Sources table
  const dataSourceTable = useReactTable({
    data: data?.dataSources || [],
    columns: dataSourceColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setDataSourceColumnFilters,
    onGlobalFilterChange: setDataSourceGlobalFilter,
    state: {
      columnFilters: dataSourceColumnFilters,
      globalFilter: dataSourceGlobalFilter,
    },
    globalFilterFn: "includesString",
  });

  // Recent Updates table
  const recentUpdateTable = useReactTable({
    data: data?.recentUpdates || [],
    columns: recentUpdateColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setRecentUpdateColumnFilters,
    onGlobalFilterChange: setRecentUpdateGlobalFilter,
    state: {
      columnFilters: recentUpdateColumnFilters,
      globalFilter: recentUpdateGlobalFilter,
    },
    globalFilterFn: "includesString",
  });

  const handleSyncAll = () => {
    // Handle sync all action
    console.log("Syncing all data sources...");
  };

  if (isLoading) {
    return (
      <PageAnimation>
        <DataLibraryLoading />
      </PageAnimation>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">
          Error:{" "}
          {error instanceof Error
            ? error.message
            : "Failed to load data library"}
        </div>
      </div>
    );
  }

  return (
    <PageAnimation>
      <div className="space-y-6 animate-fade-in">
      {/* Data Sources */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="tracking-tight text-base font-medium">
              Data Sources
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSyncAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {dataSourceTable.getRowModel().rows.length > 0 ? (
              dataSourceTable.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {row
                      .getVisibleCells()
                      .slice(0, 2)
                      .map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}
                  </div>
                  <div>
                    {row
                      .getVisibleCells()
                      .slice(2)
                      .map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No data sources found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
          <CardTitle className="tracking-tight text-base font-medium">
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentUpdateTable.getRowModel().rows.length > 0 ? (
              recentUpdateTable.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    {row
                      .getVisibleCells()
                      .slice(0, 2)
                      .map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}
                  </div>
                  <div>
                    {row
                      .getVisibleCells()
                      .slice(2)
                      .map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No recent updates found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </PageAnimation>
  );
}
