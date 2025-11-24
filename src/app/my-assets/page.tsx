"use client";

import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

type Asset = {
  name: string;
  type: string;
  units: string;
  value: string;
  location: string;
};

const portfolio: Asset[] = [
  {
    name: "Maple Tower",
    type: "Residential",
    units: "24",
    value: "$2.8M",
    location: "Downtown",
  },
  {
    name: "Oak Complex",
    type: "Mixed Use",
    units: "36",
    value: "$4.2M",
    location: "Midtown",
  },
  {
    name: "Pine Apartments",
    type: "Residential",
    units: "18",
    value: "$1.9M",
    location: "Suburbs",
  },
  {
    name: "Birch Plaza",
    type: "Commercial",
    units: "12",
    value: "$3.5M",
    location: "Business District",
  },
  {
    name: "Cedar Heights",
    type: "Residential",
    units: "28",
    value: "$3.1M",
    location: "Uptown",
  },
  {
    name: "Willow Gardens",
    type: "Mixed Use",
    units: "42",
    value: "$5.2M",
    location: "East Side",
  },
  {
    name: "Spruce Residences",
    type: "Residential",
    units: "32",
    value: "$3.8M",
    location: "West End",
  },
  {
    name: "Elm Court",
    type: "Commercial",
    units: "16",
    value: "$2.6M",
    location: "Financial District",
  },
  {
    name: "Ash Boulevard",
    type: "Residential",
    units: "22",
    value: "$2.4M",
    location: "North Quarter",
  },
  {
    name: "Redwood Square",
    type: "Mixed Use",
    units: "48",
    value: "$6.1M",
    location: "City Center",
  },
];

export default function MyAssets() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          My Assets
        </h2>
        <p className="mt-2 text-muted-foreground">
          Portfolio overview of all owned properties
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {portfolio.map((asset) => (
          <article
            key={asset.name}
            className="cursor-pointer rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-muted p-2">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{asset.type}</p>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-3 gap-4">
                <AssetStat label="Units" value={asset.units} />
                <AssetStat label="Value" value={asset.value} />
                <AssetStat label="Location" value={asset.location} compact />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AssetStat({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div
        className={cn(
          compact
            ? "text-sm font-medium text-foreground"
            : "text-xl font-bold text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}
