"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { LayoutGrid, List, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { UnitCardView, UnitTableView } from "./components";
import type { Property, PropertyStatus } from "./types";
import { getStatusBadgeVariant } from "./utils";

const fakeProperties: Property[] = [
  {
    id: "1",
    address: "Lindé Alle 3, Nærum, Copenhagen",
    status: "No interest",
    type: "Room",
    area: "37 m2",
    rent: "5,700 kr/md",
  },
  {
    id: "2",
    address: "Porsager 92, Albertslund",
    status: "No interest",
    type: "Room",
    area: "8 m2",
    rent: "4,500 kr/md",
  },
  {
    id: "3",
    address: "skolebakken 11 2 th",
    status: "Interested",
    type: "Apartment",
    area: "88 m2",
    rent: "12,600 kr/md",
  },
  {
    id: "4",
    address: "broloftet 1 2 tv",
    status: "Rented Out",
    type: "Apartment",
    area: "68 m2",
    rent: "9,150 kr/md",
  },
  {
    id: "5",
    address: "poppelstykket 6 2 212",
    status: "No interest",
    type: "Apartment",
    area: "35 m2",
    rent: "8,350 kr/md",
  },
  {
    id: "6",
    address: "poppelstykket 6 2 204",
    status: "No interest",
    type: "Apartment",
    area: "35 m2",
    rent: "8,350 kr/md",
  },
  {
    id: "7",
    address: "bybuen 4 3 dr4",
    status: "No interest",
    type: "Apartment",
    area: "101 m2",
    rent: "14,995 kr/md",
  },
  {
    id: "8",
    address: "blokhaven 154 37",
    status: "No interest",
    type: "Apartment",
    area: "80 m2",
    rent: "13,750 kr/md",
  },
  {
    id: "9",
    address: "kamma klitgards gade 61 2 lejl 2",
    status: "Rented Out",
    type: "Apartment",
    area: "67 m2",
    rent: "8,950 kr/md",
  },
  {
    id: "10",
    address: "kamma klitgards gade 107 5 lejl 4",
    status: "No interest",
    type: "Apartment",
    area: "48 m2",
    rent: "7,950 kr/md",
  },
];

function fetchProperties(): Promise<Property[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fakeProperties);
    }, 500);
  });
}

export default function Page() {
  const [view, setView] = useState<"table" | "cards">("table");
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("address")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as PropertyStatus;
        const variant = getStatusBadgeVariant(status);
        return (
          <Badge
            variant="outline"
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/80",
              variant.className
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "area",
      header: "Area",
    },
    {
      accessorKey: "rent",
      header: "Rent",
    },
    {
      id: "actions",
      header: () => <div>Actions</div>,
      cell: () => (
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: properties,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Property Listings
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage your property portfolio
          </p>
        </div>
        <Button size="lg" className="w-full md:w-fit">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      <Tabs
        value={view}
        onValueChange={(value) => setView(value as "table" | "cards")}
        className="space-y-4"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="ml-0 w-fit">
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="table">
          <UnitTableView
            table={table}
            columnCount={columns.length}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="cards">
          <UnitCardView properties={properties} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
