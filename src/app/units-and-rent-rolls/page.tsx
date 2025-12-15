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
import { DownloadIcon, Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
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
  const [isUploading, setIsUploading] = useState(false); // <- new state

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
          {/* Filter sidebar (always visible) */}
          <div className="sticky top-0 left-0 w-full md:w-72 md:shrink-0">
            <div className="mt-1 space-y-4 rounded-lg border bg-card/60 p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
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

              <div className="flex flex-col gap-3">
                {table.getColumn("property_name") && (
                  <div className="flex items-center gap-2">
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
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="All Properties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
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
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Rent Current range filter */}
                {table.getColumn("rent_current_gri") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Rent Current
                    </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const col = table.getColumn("rent_current_gri");
                        const value = (col?.getFilterValue() ||
                          {}) as RangeFilter;
                        return (
                          <>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="Min"
                              className="h-8 w-24"
                              value={
                                typeof value.min === "number" ? value.min : ""
                              }
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
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="Max"
                              className="h-8 w-24"
                              value={
                                typeof value.max === "number" ? value.max : ""
                              }
                              onChange={(e) => {
                                const max = e.target.value
                                  ? Number(e.target.value)
                                  : undefined;
                                const next: RangeFilter = {
                                  ...value,
                                  max,
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Rent Budget range filter */}
                {table.getColumn("rent_budget_tri") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Rent Budget
                    </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const col = table.getColumn("rent_budget_tri");
                        const value = (col?.getFilterValue() ||
                          {}) as RangeFilter;
                        return (
                          <>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="Min"
                              className="h-8 w-24"
                              value={
                                typeof value.min === "number" ? value.min : ""
                              }
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
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="Max"
                              className="h-8 w-24"
                              value={
                                typeof value.max === "number" ? value.max : ""
                              }
                              onChange={(e) => {
                                const max = e.target.value
                                  ? Number(e.target.value)
                                  : undefined;
                                const next: RangeFilter = {
                                  ...value,
                                  max,
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Bedrooms range filter */}
                {table.getColumn("bedrooms_amount") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Bedrooms
                    </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const col = table.getColumn("bedrooms_amount");
                        const value = (col?.getFilterValue() ||
                          {}) as RangeFilter;
                        return (
                          <>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="Min"
                              className="h-8 w-20"
                              value={
                                typeof value.min === "number" ? value.min : ""
                              }
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
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="Max"
                              className="h-8 w-20"
                              value={
                                typeof value.max === "number" ? value.max : ""
                              }
                              onChange={(e) => {
                                const max = e.target.value
                                  ? Number(e.target.value)
                                  : undefined;
                                const next: RangeFilter = {
                                  ...value,
                                  max,
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Bathrooms range filter */}
                {table.getColumn("bathrooms_amount") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Bathrooms
                    </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const col = table.getColumn("bathrooms_amount");
                        const value = (col?.getFilterValue() ||
                          {}) as RangeFilter;
                        return (
                          <>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="Min"
                              className="h-8 w-20"
                              value={
                                typeof value.min === "number" ? value.min : ""
                              }
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
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="Max"
                              className="h-8 w-20"
                              value={
                                typeof value.max === "number" ? value.max : ""
                              }
                              onChange={(e) => {
                                const max = e.target.value
                                  ? Number(e.target.value)
                                  : undefined;
                                const next: RangeFilter = {
                                  ...value,
                                  max,
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
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
