"use client";

import type {
  RecentReport,
  ReportsData,
  ScheduledReport,
} from "@/app/api/reports/route";
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
import { Clock, Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";

export default function Reports() {
  const [recentColumnFilters, setRecentColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [scheduledColumnFilters, setScheduledColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [recentGlobalFilter, setRecentGlobalFilter] = useState("");
  const [scheduledGlobalFilter, setScheduledGlobalFilter] = useState("");

  const { data, isLoading, isError, error } = useQuery<ReportsData>({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch reports");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Recent Reports columns
  const recentColumns = useMemo<ColumnDef<RecentReport>[]>(
    () => [
      {
        id: "icon",
        header: "",
        cell: () => (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
        ),
        enableColumnFilter: false,
        size: 60,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.title}</p>
            <p className="text-sm text-muted-foreground">
              {row.original.period} • {row.original.date}
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Handle download
              console.log("Downloading report:", row.original.id);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        ),
        enableColumnFilter: false,
        size: 50,
      },
    ],
    []
  );

  // Scheduled Reports columns
  const scheduledColumns = useMemo<ColumnDef<ScheduledReport>[]>(
    () => [
      {
        id: "icon",
        header: "",
        cell: () => (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
        ),
        enableColumnFilter: false,
        size: 60,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.title}</p>
            <p className="text-sm text-muted-foreground">
              Next: {row.original.nextRun}
            </p>
          </div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ getValue }) => (
          <Badge variant="outline">{getValue<string>()}</Badge>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
    ],
    []
  );

  // Recent Reports table
  const recentTable = useReactTable({
    data: data?.recent || [],
    columns: recentColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setRecentColumnFilters,
    onGlobalFilterChange: setRecentGlobalFilter,
    state: {
      columnFilters: recentColumnFilters,
      globalFilter: recentGlobalFilter,
    },
    globalFilterFn: "includesString",
  });

  // Scheduled Reports table
  const scheduledTable = useReactTable({
    data: data?.scheduled || [],
    columns: scheduledColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setScheduledColumnFilters,
    onGlobalFilterChange: setScheduledGlobalFilter,
    state: {
      columnFilters: scheduledColumnFilters,
      globalFilter: scheduledGlobalFilter,
    },
    globalFilterFn: "includesString",
  });

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
          {error instanceof Error ? error.message : "Failed to load reports"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Recent Reports */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="tracking-tight text-base font-medium">
              Recent Reports
            </CardTitle>
            <Button variant="outline" size="sm">
              Generate New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentTable.getRowModel().rows.length > 0 ? (
              recentTable.getRowModel().rows.map((row) => (
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
                  <div className="flex items-center gap-3">
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
                No reports found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm shadow-card">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
          <CardTitle className="tracking-tight text-base font-medium">
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {scheduledTable.getRowModel().rows.length > 0 ? (
              scheduledTable.getRowModel().rows.map((row) => (
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
                No scheduled reports found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
