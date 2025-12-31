"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RentRollUnitModel } from "@/generated/models/RentRollUnit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Building2Icon, FileSpreadsheet, FileText } from "lucide-react";
import { useRef, useState } from "react";
import type { RentStatus } from "../../type/rent-roll";
import { RentRollSkeleton } from "./components/skeleton";

const rentStatusVariants: Record<RentStatus, string> = {
  occupied: "bg-foreground text-background border-0",
  vacant: "bg-background text-foreground border border-border",
  terminated: "bg-muted text-muted-foreground border border-border",
};

async function fetchRentRollData(): Promise<RentRollUnitModel[]> {
  const response = await fetch("/api/rent-roll");

  if (!response.ok) {
    throw new Error(`Failed to fetch rent roll data: ${response.statusText}`);
  }

  const data = await response.json();

  // Type assertion with validation
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format");
  }

  return data as RentRollUnitModel[];
}

export default function Page() {
  const queryClient = useQueryClient();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  type RangeFilter = {
    min?: number;
    max?: number;
  };

  const rangeFilterFn: FilterFn<RentRollUnitModel> = (
    row,
    columnId,
    filterValue
  ) => {
    const value = row.getValue<number | string | null | undefined>(columnId);
    if (value == null || value === "") return false;

    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numericValue)) return false;

    const { min, max } = (filterValue || {}) as RangeFilter;

    if (typeof min === "number" && numericValue < min) return false;
    if (typeof max === "number" && numericValue > max) return false;

    return true;
  };

  const { data: rentRollData = [], isLoading } = useQuery<RentRollUnitModel[]>({
    queryKey: ["rentRollData"],
    queryFn: fetchRentRollData,
  });

  const columns: ColumnDef<RentRollUnitModel>[] = [
    {
      accessorKey: "unit_id",
      header: "Unit ID",
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">
          {getValue<string>()}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "property_build_year",
      header: "Property Year",
      enableColumnFilter: false,
    },
    {
      accessorKey: "property_name",
      header: "Property Name",
      enableColumnFilter: true,
    },
    {
      accessorKey: "unit_address",
      header: "Unit Address",
      enableColumnFilter: false,
    },
    {
      accessorKey: "unit_zipcode",
      header: "Zipcode",
      enableColumnFilter: false,
    },
    {
      accessorKey: "unit_door",
      header: "Unit Door",
      enableColumnFilter: false,
    },
    {
      accessorKey: "unit_floor",
      header: "Floor",
      enableColumnFilter: false,
    },
    {
      accessorKey: "utilites_cost",
      header: "Utilities Cost",
      enableColumnFilter: false,
    },
    {
      accessorKey: "unit_type",
      header: "Unit Type",
      enableColumnFilter: false,
    },
    {
      accessorKey: "size_sqm",
      header: "Size (sqm)",
      enableColumnFilter: false,
    },
    {
      accessorKey: "rooms_amount",
      header: "Rooms",
      enableColumnFilter: false,
    },
    {
      accessorKey: "bedrooms_amount",
      header: "Bedrooms",
      enableColumnFilter: true,
      filterFn: rangeFilterFn,
    },
    {
      accessorKey: "bathrooms_amount",
      header: "Bathrooms",
      enableColumnFilter: true,
      filterFn: rangeFilterFn,
    },
    {
      accessorKey: "rent_current_gri",
      header: "Rent Current",
      enableColumnFilter: true,
      filterFn: rangeFilterFn,
    },
    {
      accessorKey: "rent_budget_tri",
      header: "Rent Budget",
      enableColumnFilter: true,
      filterFn: rangeFilterFn,
    },
    {
      accessorKey: "units_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("units_status") as RentStatus;
        const className = rentStatusVariants[status];
        return (
          <Badge
            variant="outline"
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/80 ${className}`}
          >
            {status}
          </Badge>
        );
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "lease_start",
      header: "Lease Start",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "lease_end",
      header: "Lease End",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_name1",
      header: "Tenant Name",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_name2",
      header: "Tenant Name 2",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_number1",
      header: "Tenant Number 1",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_number2",
      header: "Tenant Number 2",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_mail1",
      header: "Tenant Mail 1",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "tenant_mail2",
      header: "Tenant Mail 2",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<string>()}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "rent_erv_tri",
      header: "ERV/TRI",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">{getValue<number>()}</span>
      ),
      enableColumnFilter: false,
    },
  ];

  const table = useReactTable({
    data: rentRollData,
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

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div className="w-full">
      {isLoading ? (
        <RentRollSkeleton />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Rent Roll
              </h2>
              <p className="text-muted-foreground mt-2">
                Comprehensive unit and lease data
              </p>
            </div>
          </div>
          <div className="relative flex flex-col md:flex-row gap-4">
            {/* Filter sidebar (always visible) */}
            <div className="sticky top-0 left-0 w-full md:w-72 md:shrink-0 border border-border rounded-lg">
              <div className="p-6 space-y-4">
                {table.getColumn("property_name") && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-muted-foreground">
                      Building
                    </label>
                    <Select
                      value={
                        (
                          table
                            .getColumn("property_name")
                            ?.getFilterValue() as string[]
                        )?.join(",") || "all"
                      }
                      onValueChange={(value: string) => {
                        table
                          .getColumn("property_name")
                          ?.setFilterValue(
                            value === "all" ? undefined : value.split(",")
                          );
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="All Buildings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex flex-row items-center gap-2">
                            <Building2Icon className="w-4 h-4" />
                            <span>All Buildings</span>
                          </div>
                        </SelectItem>
                        {Array.from(
                          table
                            .getColumn("property_name")
                            ?.getFacetedUniqueValues()
                            .keys() || []
                        ).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {table.getColumn("units_status") && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-muted-foreground">
                      Occupancy
                    </label>
                    <Select
                      value={
                        (
                          table
                            .getColumn("units_status")
                            ?.getFilterValue() as string[]
                        )?.join(",") || "all"
                      }
                      onValueChange={(value: string) => {
                        table
                          .getColumn("units_status")
                          ?.setFilterValue(
                            value === "all" ? undefined : value.split(",")
                          );
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="All Units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Units</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {table.getColumn("bedrooms_amount") && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-muted-foreground">
                      Amount of rooms
                    </label>
                    {(() => {
                      const col = table.getColumn("bedrooms_amount");
                      const value = (col?.getFilterValue() ||
                        {}) as RangeFilter;
                      return (
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="1"
                          className="h-10 w-full"
                          value={typeof value.min === "number" ? value.min : ""}
                          onChange={(e) => {
                            const min = e.target.value
                              ? Number(e.target.value)
                              : undefined;
                            const next: RangeFilter = {
                              ...value,
                              min,
                            };
                            if (
                              typeof next.min !== "number" &&
                              typeof next.max !== "number"
                            ) {
                              col?.setFilterValue(undefined);
                            } else {
                              col?.setFilterValue(next);
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                )}

                {table.getColumn("rent_current_gri") && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-muted-foreground">
                      Area
                    </label>
                    <Select>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="All Areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2"
                    onClick={() => {
                      void fetch("/api/export?format=csv", {
                        method: "GET",
                      }).then((response) => {
                        if (!response.ok) {
                          throw new Error("Failed to download CSV");
                        }
                        response.blob().then((blob) => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "rent-roll-export.csv";
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                      });
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2"
                    onClick={() => {
                      void fetch("/api/export?format=xlsx", {
                        method: "GET",
                      }).then((response) => {
                        if (!response.ok) {
                          throw new Error("Failed to download XLSX");
                        }
                        response.blob().then((blob) => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "rent-roll-export.xlsx";
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                      });
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto no-scrollbar overscroll-x-contain">
              <div className="overflow-hidden rounded-lg border bg-card">
                <div className="border-b p-4">
                  <div className="flex flex-row items-center justify-between w-full">
                    <p className="font-medium text-muted-foreground">
                      All Buildings
                    </p>
                    <p className="font-medium text-muted-foreground">
                      {table.getFilteredRowModel().rows.length} units
                    </p>
                  </div>
                </div>
                <div
                  ref={tableContainerRef}
                  className="relative w-full overflow-x-auto no-scrollbar"
                >
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      {/* Column header rows */}
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b">
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0"
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
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No units found
                          </td>
                        </tr>
                      ) : (
                        <>
                          {paddingTop > 0 && (
                            <tr>
                              <td
                                style={{ height: `${paddingTop}px` }}
                                colSpan={columns.length}
                              />
                            </tr>
                          )}
                          {virtualRows.map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                              <tr
                                key={row.id}
                                data-index={virtualRow.index}
                                className="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <td
                                    key={cell.id}
                                    className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                          {paddingBottom > 0 && (
                            <tr>
                              <td
                                style={{ height: `${paddingBottom}px` }}
                                colSpan={columns.length}
                              />
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
