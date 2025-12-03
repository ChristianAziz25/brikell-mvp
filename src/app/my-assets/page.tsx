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
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

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

type AssetWithRelations = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  rentRoll: unknown[] | null;
};

function getAssetLocation(asset: AssetWithRelations): string {
  const parts = [asset.city, asset.country].filter(Boolean) as string[];
  return parts.join(", ") || "Unknown location";
}

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

export default function MyAssets() {
  const { data: assets } = useQuery<AssetWithRelations[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
  });
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
        {assets?.map((asset) => {
          const units = asset.rentRoll?.length ?? 0;
          const location = getAssetLocation(asset);
          const estimatedValue = formatCurrency(units * 1300 * 12);

          return (
            <Dialog key={asset.id}>
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
                          {location}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <AssetStat label="Units" value={units} />
                      <AssetStat label="Value" value={estimatedValue} />
                      <AssetStat label="Location" value={location} compact />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="w-[80%] max-w-2xl max-h-[90vh] rounded-2xl flex flex-col pb-0">
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {asset.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">{location}</p>
                </DialogHeader>
                <div className="overflow-y-auto min-h-0 flex-1 relative">
                  <ProfitLossStatement asset={asset} />
                  <div className="sticky bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent pointer-events-none" />
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
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
  value: string | number;
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

function ProfitLossStatement({ asset }: { asset: AssetWithRelations }) {
  const units = asset.rentRoll?.length ?? 0;
  const pl = calculateProfitLoss(units);

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
