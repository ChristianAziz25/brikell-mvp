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
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Plus, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { RentRollUnit, RentStatus } from "../type/rent-roll";

const rentStatusVariants: Record<RentStatus, string> = {
  occupied: "bg-foreground text-background border-0",
  vacant: "bg-background text-foreground border border-border",
  terminated: "bg-muted text-muted-foreground border border-border",
};

async function fetchRentRollData(): Promise<RentRollUnit[]> {
  const response = await fetch("/api/rent-roll");

  if (!response.ok) {
    throw new Error(`Failed to fetch rent roll data: ${response.statusText}`);
  }

  const data = await response.json();

  // Type assertion with validation
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format");
  }

  return data as RentRollUnit[];
}

export default function Page() {
  const queryClient = useQueryClient();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // <- new state

  const { data: rentRollData = [], isLoading } = useQuery<RentRollUnit[]>({
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

  const columns = useMemo<ColumnDef<RentRollUnit>[]>(
    () => [
      {
        accessorKey: "unit_id",
        header: "Unit ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue<string>()}
          </span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "property_build_year",
        header: "Property Year",
        enableColumnFilter: true,
      },
      {
        accessorKey: "property_name",
        header: "Property Name",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unit_address",
        header: "Unit Address",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unit_zipcode",
        header: "Zipcode",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unit_door",
        header: "Unit Door",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unit_floor",
        header: "Floor",
        enableColumnFilter: true,
      },
      {
        accessorKey: "utilites_cost",
        header: "Utilities Cost",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unit_type",
        header: "Unit Type",
        enableColumnFilter: true,
      },
      {
        accessorKey: "size_sqm",
        header: "Size (sqm)",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rooms_amount",
        header: "Rooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "bedrooms_amount",
        header: "Bedrooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "bathrooms_amount",
        header: "Bathrooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rent_current_gri",
        header: "Rent Current",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rent_budget_tri",
        header: "Rent Budget",
        enableColumnFilter: true,
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
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "lease_start",
        header: "Lease Start",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "lease_end",
        header: "Lease End",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_name1",
        header: "Tenant Name",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_name2",
        header: "Tenant Name 2",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_number1",
        header: "Tenant Number 1",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_number2",
        header: "Tenant Number 2",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_mail1",
        header: "Tenant Mail 1",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenant_mail2",
        header: "Tenant Mail 2",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "property_id",
        header: "Property ID",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
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
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
    globalFilterFn: "includesString",
  });

  const { rows } = table.getRowModel();

  console.log(rentRollData, rows);

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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Rent Roll
          </h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive unit and lease data
          </p>
        </div>
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
      </div>

      <div className="space-y-4">
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
          <button
            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
            onClick={() => setShowFilter(!showFilter)}
            aria-label={showFilter ? "Hide filters" : "Show filters"}
          >
            <ChevronDown
              className={cn(
                "size-5 transition-transform duration-300",
                showFilter && "rotate-180"
              )}
            />
          </button>
        </div>

        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows] duration-1000",
            showFilter ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div
            className="min-h-0 transition-[visibility] duration-1000"
            style={{ visibility: showFilter ? "visible" : "hidden" }}
          >
            <div className="flex flex-wrap gap-2 p-2 pb-0 mb-4">
              {table.getAllColumns().map((column) => {
                if (!column.getCanFilter() || column.id === "units_status")
                  return null;

                const filterValue = (column.getFilterValue() as string) ?? "";

                return (
                  <div key={column.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`Filter ${column.id}...`}
                      value={filterValue}
                      onChange={(e) =>
                        column.setFilterValue(e.target.value || undefined)
                      }
                      className="h-8 w-[140px]"
                    />
                  </div>
                );
              })}

              {/* {table.getColumn("propertyName") && (
                <div className="flex items-center gap-2">
                  {properties.map((property) => (
                    <Button
                      key={property}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        table
                          .getColumn("propertyName")
                          ?.setFilterValue(property)
                      }
                    >
                      {property}
                    </Button>
                  ))}
                </div>
              )} */}

              {table.getColumn("units_status") && (
                <div className="flex items-center gap-2">
                  <select
                    value={
                      (
                        table
                          .getColumn("units_status")
                          ?.getFilterValue() as string[]
                      )?.join(",") || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      table
                        .getColumn("units_status")
                        ?.setFilterValue(value ? value.split(",") : undefined);
                    }}
                    className="h-8 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              )}
            </div>
          </div>
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
                <tr
                  key={headerGroup.id}
                  className="border-b bg-muted/50 transition-colors hover:bg-muted data-[state=selected]:bg-muted"
                >
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
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
  );
}
