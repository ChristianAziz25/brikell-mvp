"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

type Asset = {
  name: string;
  type: string;
  units: string;
  value: string;
  location: string;
};

type ProfitLoss = {
  theoreticalRentalIncome: number;
  vacancyLoss: number;
  rentalIncome: number;
  operatingExpenses: {
    leasing: number;
    propertyManager: number;
    insurance: number;
    maintenance: number;
    cleaning: number;
    janitor: number;
    consumption: number;
  };
  totalOpex: number;
  cashFlow: number;
};

function calculateProfitLoss(units: number): ProfitLoss {
  const theoreticalRentalIncome = units * 1300;
  const vacancyLoss = Math.round(theoreticalRentalIncome * 0.08);
  const rentalIncome = theoreticalRentalIncome - vacancyLoss;

  const operatingExpenses = {
    leasing: Math.round(units * 50),
    propertyManager: Math.round(units * 100),
    insurance: Math.round(units * 33),
    maintenance: Math.round(units * 78),
    cleaning: Math.round(units * 61),
    janitor: Math.round(units * 67),
    consumption: Math.round(units * 72),
  };

  const totalOpex = Object.values(operatingExpenses).reduce(
    (sum, val) => sum + val,
    0
  );
  const cashFlow = rentalIncome - totalOpex;

  return {
    theoreticalRentalIncome,
    vacancyLoss,
    rentalIncome,
    operatingExpenses,
    totalOpex,
    cashFlow,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
          <Dialog key={asset.name}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer rounded-2xl transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-muted p-2">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {asset.type}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <AssetStat label="Units" value={asset.units} />
                    <AssetStat label="Value" value={asset.value} />
                    <AssetStat
                      label="Location"
                      value={asset.location}
                      compact
                    />
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl flex flex-col pb-0">
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  {asset.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {asset.type} • {asset.location}
                </p>
              </DialogHeader>
              <div className="overflow-y-auto min-h-0 flex-1 relative">
                <ProfitLossStatement asset={asset} />
                <div className="sticky bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent pointer-events-none" />
              </div>
            </DialogContent>
          </Dialog>
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

function ProfitLossStatement({ asset }: { asset: Asset }) {
  const pl = calculateProfitLoss(parseInt(asset.units));

  return (
    <div className="space-y-1 pt-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Profit & Loss Statement
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between py-2">
          <span className="text-foreground font-medium">
            Theoretical Rental Income
          </span>
          <span className="text-foreground font-medium">
            {formatCurrency(pl.theoreticalRentalIncome)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Vacancy Loss</span>
          <span className="text-destructive">
            -{formatCurrency(pl.vacancyLoss)}
          </span>
        </div>
        <div className="flex justify-between py-2 border-t">
          <span className="text-foreground font-semibold">Rental Income</span>
          <span className="text-foreground font-semibold">
            {formatCurrency(pl.rentalIncome)}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <div className="flex justify-between py-2">
          <span className="text-foreground font-medium">
            Operating Expenses (OPEX)
          </span>
          <span className="text-foreground font-medium"></span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Leasing</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.leasing)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Property Manager</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.propertyManager)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Insurance</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.insurance)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Maintenance</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.maintenance)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Cleaning</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.cleaning)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Janitor</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.janitor)}
          </span>
        </div>
        <div className="flex justify-between py-2 pl-4 text-sm">
          <span className="text-muted-foreground">Consumption</span>
          <span className="text-muted-foreground">
            {formatCurrency(pl.operatingExpenses.consumption)}
          </span>
        </div>
        <div className="flex justify-between py-2 border-t pl-4">
          <span className="text-foreground font-medium">Total OPEX</span>
          <span className="text-foreground font-medium">
            -{formatCurrency(pl.totalOpex)}
          </span>
        </div>
      </div>

      <div className="flex justify-between py-3 border-t-2 border-foreground mt-4">
        <span className="text-foreground font-bold text-lg">Cash Flow</span>
        <span className="font-bold text-lg text-foreground">
          {formatCurrency(pl.cashFlow)}
        </span>
      </div>
    </div>
  );
}
