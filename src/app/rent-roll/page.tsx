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
import { useQuery } from "@tanstack/react-query";
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

type RentStatus = "occupied" | "vacant" | "terminated";

interface RentRollUnit {
  unitId: string;
  propertyYear: number;
  propertyName: string;
  unitAddress: string;
  zipcode: string;
  floor: string;
  unitType: string;
  size: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  rentCurrent: number;
  rentBudget: number;
  status: RentStatus;
  leaseStart: string;
  leaseEnd: string;
  tenantName: string;
}

const fakeRentRollData: RentRollUnit[] = [
  {
    unitId: "149",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 41,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 9850,
    rentBudget: 10050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Christian Azzi",
  },
  {
    unitId: "148",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 42,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 9850,
    rentBudget: 10050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Niels Christian",
  },
  {
    unitId: "147",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 42,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 9850,
    rentBudget: 10050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Magnus Larsen",
  },
  {
    unitId: "146",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 43,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 9850,
    rentBudget: 10050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Kristoffer Møller",
  },
  {
    unitId: "145",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 43,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 9850,
    rentBudget: 10050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Christian Azzi",
  },
  {
    unitId: "6",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Ørestad Boulevard",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 53,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 10150,
    rentBudget: 10450,
    status: "vacant",
    leaseStart: "01-03-2023",
    leaseEnd: "01-05-2025",
    tenantName: "Niels Christian",
  },
  {
    unitId: "125",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 53,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    rentCurrent: 10150,
    rentBudget: 10450,
    status: "terminated",
    leaseStart: "01-03-2023",
    leaseEnd: "01-03-2026",
    tenantName: "Magnus Larsen",
  },
  {
    unitId: "121",
    propertyYear: 2020,
    propertyName: "Gertrudehus",
    unitAddress: "Gertrude Steins Vej",
    zipcode: "2300",
    floor: "—",
    unitType: "Apartment",
    size: 55,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    rentCurrent: 11750,
    rentBudget: 12050,
    status: "occupied",
    leaseStart: "01-03-2023",
    leaseEnd: "na",
    tenantName: "Oliver Larsen",
  },
];

const rentStatusVariants: Record<RentStatus, string> = {
  occupied: "bg-foreground text-background border-0",
  vacant: "bg-background text-foreground border border-border",
  terminated: "bg-muted text-muted-foreground border border-border",
};

function fetchRentRollData(): Promise<RentRollUnit[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fakeRentRollData);
    }, 500);
  });
}

export default function Page() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { data: rentRollData = [], isLoading } = useQuery({
    queryKey: ["rentRollData"],
    queryFn: fetchRentRollData,
  });

  const handleFileUpload = (file: File) => {
    console.log("File selected:", file.name);
  };

  const columns = useMemo<ColumnDef<RentRollUnit>[]>(
    () => [
      {
        accessorKey: "unitId",
        header: "Unit ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue<string>()}
          </span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "propertyYear",
        header: "Property Year",
        enableColumnFilter: true,
      },
      {
        accessorKey: "propertyName",
        header: "Property Name",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unitAddress",
        header: "Unit Address",
        enableColumnFilter: true,
      },
      {
        accessorKey: "zipcode",
        header: "Zipcode",
        enableColumnFilter: true,
      },
      {
        accessorKey: "floor",
        header: "Floor",
        enableColumnFilter: true,
      },
      {
        accessorKey: "unitType",
        header: "Unit Type",
        enableColumnFilter: true,
      },
      {
        accessorKey: "size",
        header: "Size (sqm)",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rooms",
        header: "Rooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "bedrooms",
        header: "Bedrooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "bathrooms",
        header: "Bathrooms",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rentCurrent",
        header: "Rent Current",
        enableColumnFilter: true,
      },
      {
        accessorKey: "rentBudget",
        header: "Rent Budget",
        enableColumnFilter: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as RentStatus;
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
        accessorKey: "leaseStart",
        header: "Lease Start",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "leaseEnd",
        header: "Lease End",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: "tenantName",
        header: "Tenant Name",
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
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
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
                    handleFileUpload(file);
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
                if (!column.getCanFilter() || column.id === "status")
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
              {table.getColumn("status") && (
                <div className="flex items-center gap-2">
                  <select
                    value={
                      (
                        table.getColumn("status")?.getFilterValue() as string[]
                      )?.join(",") || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      table
                        .getColumn("status")
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
