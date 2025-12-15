"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RentRollUnitModel } from "@/generated/models/RentRollUnit";
import { cn } from "@/lib/utils";
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
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DownloadIcon, Plus, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { RentStatus } from "../type/rent-roll";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // <- new state

  const { data: rentRollData = [], isLoading } = useQuery<RentRollUnitModel[]>({
    queryKey: ["rentRollData"],
    queryFn: fetchRentRollData,
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      await result.json();
      await queryClient.invalidateQueries({ queryKey: ["rentRollData"] });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const columns = useMemo<ColumnDef<RentRollUnitModel>[]>(
    () => [
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
        enableColumnFilter: false,
      },
      {
        accessorKey: "bathrooms_amount",
        header: "Bathrooms",
        enableColumnFilter: false,
      },
      {
        accessorKey: "rent_current_gri",
        header: "Rent Current",
        enableColumnFilter: false,
      },
      {
        accessorKey: "rent_budget_tri",
        header: "Rent Budget",
        enableColumnFilter: false,
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
    ],
    []
  );

  // React Compiler can't memoize TanStack Table yet; suppress lint until upstream fix.
  // eslint-disable-next-line react-hooks/incompatible-library
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

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter("");
  };

  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className="w-full">
      {isLoading ? (
        <RentRollSkeleton />
      ) : (
        <div className="relative flex flex-col md:flex-row gap-4">
          {/* Filter toggle pill */}
          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className="self-start mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-xs font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {showFilter ? <X className="h-3 w-3" /> : "F"}
          </button>

          {/* Collapsible filter panel */}
          <div
            className={cn(
              "relative overflow-hidden transition-all duration-200",
              showFilter
                ? "w-full md:w-50 opacity-100"
                : "w-0 md:w-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="space-y-4 min-h-0 px-0 md:pr-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="relative rounded-md flex items-center justify-end gap-2">
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

              <div className="grid overflow-hidden transition-[grid-template-rows] duration-200">
                <div className="min-h-0">
                  <div className="flex flex-wrap gap-2 p-2 pb-0 mb-4">
                    {table.getAllColumns().map((column) => {
                      if (
                        !column.getCanFilter() ||
                        column.id === "units_status"
                      )
                        return null;

                      if (column.id === "property_name") {
                        const propertyUniqueValues = Array.from(
                          column?.getFacetedUniqueValues().keys()
                        ).sort();
                        return (
                          <div
                            key={column.id}
                            className="flex items-center gap-2"
                          >
                            {propertyUniqueValues.map((property) => (
                              <Button
                                key={property}
                                variant="secondary"
                                size="sm"
                                onClick={() => column.setFilterValue(property)}
                              >
                                {property}
                              </Button>
                            ))}
                          </div>
                        );
                      }
                    })}

                    {table.getColumn("units_status") && (
                      <div className="flex items-center gap-2">
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
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="vacant">Vacant</SelectItem>
                            <SelectItem value="terminated">
                              Terminated
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto no-scrollbar overscroll-x-contain">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Rent Roll
                </h2>
                <p className="text-muted-foreground mt-2">
                  Comprehensive unit and lease data
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full gap-2 md:w-fit">
                      <Plus className="h-4 w-4" />
                      Add Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload CSV File</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload CSV"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="csv"
                        type="file"
                        accept=".csv, .xlsx, .xls, .pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleFileUpload(file);
                            // Optional: allow re‑uploading the same file
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2 md:w-fit"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export as</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Button
                        size="lg"
                        className="w-full gap-2 md:w-fit"
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
                        <DownloadIcon className="h-4 w-4" />
                        Download csv
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full gap-2 md:w-fit"
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
                        <DownloadIcon className="h-4 w-4" />
                        Download xlsx
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div
                ref={tableContainerRef}
                className="relative w-full overflow-x-auto no-scrollbar"
              >
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
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
      )}
    </div>
  );
}
