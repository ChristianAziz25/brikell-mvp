"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { useMemo, useRef } from "react";

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

  const { data: rentRollData = [], isLoading } = useQuery({
    queryKey: ["rentRollData"],
    queryFn: fetchRentRollData,
  });

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
      },
      {
        accessorKey: "propertyYear",
        header: "Property Year",
      },
      {
        accessorKey: "propertyName",
        header: "Property Name",
      },
      {
        accessorKey: "unitAddress",
        header: "Unit Address",
      },
      {
        accessorKey: "zipcode",
        header: "Zipcode",
      },
      {
        accessorKey: "floor",
        header: "Floor",
      },
      {
        accessorKey: "unitType",
        header: "Unit Type",
      },
      {
        accessorKey: "size",
        header: "Size (sqm)",
      },
      {
        accessorKey: "rooms",
        header: "Rooms",
      },
      {
        accessorKey: "bedrooms",
        header: "Bedrooms",
      },
      {
        accessorKey: "bathrooms",
        header: "Bathrooms",
      },
      {
        accessorKey: "rentCurrent",
        header: "Rent Current",
      },
      {
        accessorKey: "rentBudget",
        header: "Rent Budget",
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
      },
      {
        accessorKey: "leaseStart",
        header: "Lease Start",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "leaseEnd",
        header: "Lease End",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "tenantName",
        header: "Tenant Name",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{getValue<string>()}</span>
        ),
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
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Rent Roll
          </h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive unit and lease data
          </p>
        </div>
        <Button size="lg" className="w-full gap-2 md:w-fit">
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div ref={tableContainerRef} className="relative max-h-[600px] w-full">
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
