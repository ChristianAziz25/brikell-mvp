"use client";

import { PageAnimation } from "@/components/page-animation";
import { Badge } from "@/components/ui/badge";
import {
  BudgetVsActualChart,
  type BudgetVsActualData,
} from "@/components/ui/budget-vs-actual-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/ui/export-button";
import { GlowingLineChart } from "@/components/ui/glowing-line-chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { buildAssetTimeSeries, type YearByAssetRow } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Capex,
  Opex,
  RentRollUnit,
  TheoreticalRentalIncome,
} from "../../../generated/client";
import { MyAssetsSkeleton } from "./components/skeleton";
import { Table } from "./Table";
import { dollarStringify } from "./util/dollarStringify";

const CURRENT_YEAR = new Date().getFullYear();

// Convert year-based data to month format for the chart
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Category breakdown data type
type CategoryRow = {
  category: string;
  [year: string]: string | number;
  totalYTD: number;
  variance: string;
};

const OPEX_CATEGORIES = [
  "Delinquency",
  "Property Management Fee",
  "Leasing Fee",
  "Property Taxes",
  "Refuse Collection",
  "Insurance",
  "Cleaning",
  "Facility Management",
  "Service Subscriptions",
  "Common Consumption",
  "Home Owner Association",
];

// Format number to compact form (e.g., 1234567 -> 1234K)
const formatCompact = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toString();
};

function buildPortfolioMetricsChart(
  griData: YearByAssetRow[],
  opexData: YearByAssetRow[],
  occupancyData: YearByAssetRow[],
  capexData: YearByAssetRow[],
  totalUnits: number,
  selectedAssetName?: string | null
) {
  // Get the latest year's data
  const latestYear = Math.max(
    ...griData.map((d) => d.year),
    ...opexData.map((d) => d.year),
    ...occupancyData.map((d) => d.year),
    ...capexData.map((d) => d.year)
  );

  // Sum all assets for each metric for the latest year
  const griRow = griData.find((d) => d.year === latestYear);
  const opexRow = opexData.find((d) => d.year === latestYear);
  const occupancyRow = occupancyData.find((d) => d.year === latestYear);
  const capexRow = capexData.find((d) => d.year === latestYear);

  const getValues = (row: YearByAssetRow | undefined, assetName: string | null) => {
    if (!row) return 0;
    if (assetName) {
      // Get specific asset value
      const value = row[assetName];
      return typeof value === "number" ? value : 0;
    }
    // Sum all assets
    return Object.entries(row)
      .filter(([key]) => key !== "year")
      .reduce((sum, [, value]) => sum + (typeof value === "number" ? value : 0), 0);
  };

  const getAvgValues = (row: YearByAssetRow | undefined, assetName: string | null) => {
    if (!row) return 0;
    if (assetName) {
      // Get specific asset value
      const value = row[assetName];
      return typeof value === "number" ? value : 0;
    }
    // Average all assets
    const entries = Object.entries(row).filter(([key]) => key !== "year");
    if (entries.length === 0) return 0;
    const sum = entries.reduce((sum, [, value]) => sum + (typeof value === "number" ? value : 0), 0);
    return sum / entries.length;
  };

  const totalGri = getValues(griRow, selectedAssetName);
  const totalOpex = getValues(opexRow, selectedAssetName);
  const totalCapex = getValues(capexRow, selectedAssetName);
  const avgOccupancy = getAvgValues(occupancyRow, selectedAssetName);
  const baseVacancyRate = (1 - avgOccupancy) * 100;
  const baseOpexPerUnit = totalUnits > 0 ? totalOpex / totalUnits : 0;
  const noi = totalGri - totalOpex;
  const baseNoiMargin = totalGri !== 0 ? (noi / totalGri) * 100 : 0;

  // Use a seeded random for consistent results
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Distribute across months with realistic variations
  const monthlyData = MONTHS.map((month, index) => {
    const seed = index + (selectedAssetName ? selectedAssetName.length : 0);
    
    // GRI: Monthly variation with seasonal patterns (higher in summer months)
    const griSeasonal = 0.9 + (Math.sin((index - 2) * Math.PI / 6) * 0.15); // Peak around May/June
    const griVariation = griSeasonal + seededRandom(seed) * 0.05;
    const monthlyGri = Math.round((totalGri / 12) * griVariation);
    
    // Vacancy Rate: Realistic variation between 3-8% with some fluctuation
    const vacancyBase = baseVacancyRate || 5; // Default to 5% if not available
    const vacancyVariation = 0.85 + Math.sin(index * 0.4) * 0.2 + Math.cos(index * 0.6) * 0.15 + seededRandom(seed + 100) * 0.1;
    const monthlyVacancy = Number((Math.max(2, Math.min(10, vacancyBase * vacancyVariation))).toFixed(2));
    
    // OPEX/Unit: Realistic variation with seasonal patterns (higher in winter)
    const opexBase = baseOpexPerUnit || 50000; // Default to 50K if not available
    const opexSeasonal = 0.95 + (Math.cos((index - 2) * Math.PI / 6) * 0.1); // Higher in winter
    const opexVariation = opexSeasonal + Math.sin(index * 0.5) * 0.1 + seededRandom(seed + 200) * 0.08;
    const monthlyOpexPerUnit = Math.round(opexBase * opexVariation);
    
    // NOI%: Realistic variation between 55-75% with correlation to GRI
    const noiBase = baseNoiMargin || 65; // Default to 65% if not available
    // NOI% should be inversely correlated with OPEX/Unit and positively with GRI
    const noiVariation = 0.92 + (griVariation - 1) * 0.3 - (opexVariation - 1) * 0.2 + seededRandom(seed + 300) * 0.05;
    const monthlyNoiMargin = Number((Math.max(50, Math.min(80, noiBase * noiVariation))).toFixed(2));
    
    // CAPEX: Monthly variation with some spikes (maintenance/improvements)
    const capexBase = totalCapex || 0;
    const capexSpike = seededRandom(seed + 400) < 0.15 ? 1.5 : 1.0; // Occasional spikes
    const capexVariation = (0.7 + Math.sin(index * 0.7) * 0.3 + seededRandom(seed + 400) * 0.2) * capexSpike;
    const monthlyCapex = Math.round((capexBase / 12) * capexVariation);
    
    // Total OPEX: Monthly variation (higher in winter)
    const opexTotalVariation = opexSeasonal + Math.sin(index * 0.4) * 0.12 + seededRandom(seed + 500) * 0.08;
    const monthlyOpexTotal = Math.round((totalOpex / 12) * opexTotalVariation);
    
    return {
      month,
      GRI: monthlyGri,
      "Vacancy Rate": monthlyVacancy,
      "OPEX/Unit": monthlyOpexPerUnit,
      "NOI %": monthlyNoiMargin,
      CAPEX: monthlyCapex,
      OPEX: monthlyOpexTotal,
    };
  });

  return monthlyData;
}

type PortfolioRow = {
  property: string;
  vacancy: number;
  opex: number;
  opexPerUnit: number;
  noi: number;
  noiMargin: number;
};

interface AssetSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  tri: TheoreticalRentalIncome[];
  capex: Capex[];
  opex: Opex[];
  rentRoll: RentRollUnit[];
  created_at: Date;
  updated_at: Date;
}

export default function MyAssets() {
  const router = useRouter();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedCategoryAssetId, setSelectedCategoryAssetId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [monthPage, setMonthPage] = useState(0);
  
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<
    AssetSummary[]
  >({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(`/api/assets?detailed=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch yearly metrics for the chart
  const { data: griData = [], isLoading: isGriLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "gri"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=gri");
      if (!res.ok) throw new Error("Failed to fetch GRI data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: opexData = [], isLoading: isOpexLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "opex"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=opex");
      if (!res.ok) throw new Error("Failed to fetch OPEX data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: occupancyData = [], isLoading: isOccupancyLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "occupancy"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=occupancy");
      if (!res.ok) throw new Error("Failed to fetch occupancy data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: capexData = [], isLoading: isCapexLoading } = useQuery<
    YearByAssetRow[]
  >({
    queryKey: ["yearly-metrics", "capex"],
    queryFn: async () => {
      const res = await fetch("/api/assets/yearly-metrics?metric=capex");
      if (!res.ok) throw new Error("Failed to fetch CAPEX data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const timeSeries = useMemo(() => buildAssetTimeSeries(assets), [assets]);

  const capexTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.capex.find(
        (c) => c.year === CURRENT_YEAR
      )?.totalCapexActual;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const opexTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.opex.find(
        (c) => c.year === CURRENT_YEAR
      )?.totalOpexActual;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const griTotal = useMemo(() => {
    return timeSeries.reduce((sum, asset) => {
      const localVal = asset.gri.find((c) => c.year === CURRENT_YEAR)?.gri;
      return sum + (localVal ?? 0);
    }, 0);
  }, [timeSeries]);

  const noiTotal = griTotal - opexTotal;

  // Map assetId -> unit count for OPEX/Unit calculations
  const unitsByAssetId = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach((asset) => {
      map.set(asset.id, asset.rentRoll.length);
    });
    return map;
  }, [assets]);

  // Build table rows for current year portfolio snapshot
  const portfolioRows: PortfolioRow[] = useMemo(() => {
    return timeSeries.map((series) => {
      const currentOpex =
        series.opex.find((o) => o.year === CURRENT_YEAR)?.totalOpexActual ?? 0;
      const currentGri =
        series.gri.find((g) => g.year === CURRENT_YEAR)?.gri ?? 0;
      const currentOccupancy =
        series.occupancy.find((o) => o.year === CURRENT_YEAR)?.occupancyRate ??
        0;
      const unitCount = unitsByAssetId.get(series.assetId) ?? 0;

      const noi = currentGri - currentOpex;
      const noiMargin = currentGri !== 0 ? (noi / currentGri) * 100 : 0;
      const vacancy = (1 - currentOccupancy) * 100;
      const opexPerUnit = unitCount > 0 ? currentOpex / unitCount : 0;

      return {
        property: series.assetName,
        vacancy,
        opex: currentOpex,
        opexPerUnit,
        noi,
        noiMargin,
      };
    });
  }, [timeSeries, unitsByAssetId]);

  const vacancyRateTotal = useMemo(() => {
    // Fixed value as requested
    return 1.7;
  }, []);

  const totalUnits = useMemo(() => {
    return assets.reduce((sum, asset) => {
      return sum + asset.rentRoll.length;
    }, 0);
  }, [assets]);

  const portfolioColumns: ColumnDef<PortfolioRow>[] = useMemo(
    () => [
      {
        accessorKey: "property",
        header: () => <div className="text-left">Property</div>,
        cell: ({ row }) => (
          <div
            className="text-left font-medium cursor-pointer hover:text-primary transition-colors"
            title={row.original.property}
            onClick={() => router.push(`/properties/${row.original.property}`)}
          >
            {row.original.property}
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: "vacancy",
        header: () => <div className="text-center">Vacancy</div>,
        cell: ({ row }) => {
          const value = row.original.vacancy;
          return (
            <div className="text-center">
              <Badge variant="secondary" className="tabular-nums">
                {Number.isFinite(value) ? `${value.toFixed(2)}%` : "-"}
              </Badge>
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "opex",
        header: () => <div className="text-right">OPEX</div>,
        cell: ({ row }) => {
          const value = row.original.opex;
          return (
            <div className="text-right tabular-nums">
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "opexPerUnit",
        header: () => <div className="text-right">OPEX/Unit</div>,
        cell: ({ row }) => {
          const value = row.original.opexPerUnit;
          return (
            <div className="text-right tabular-nums">
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "noi",
        header: () => <div className="text-right">NOI</div>,
        cell: ({ row }) => {
          const value = row.original.noi;
          return (
            <div className="text-right tabular-nums">
              {Number.isFinite(value)
                ? `${dollarStringify({ value, format: "text" })} DKK`
                : "-"}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "noiMargin",
        header: () => <div className="text-right">NOI Margin</div>,
        cell: ({ row }) => {
          const value = row.original.noiMargin;
          return (
            <div className="text-right tabular-nums">
              {Number.isFinite(value) ? `${value.toFixed(2)}%` : "-"}
            </div>
          );
        },
        size: 120,
      },
    ],
    [router]
  );

  const portfolioTable = useReactTable({
    data: portfolioRows,
    columns: portfolioColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const noiMarginTotal = 73; // Fixed value as requested

  // Find selected asset name from ID
  const selectedAssetName = useMemo(() => {
    if (!selectedAssetId) return null;
    const asset = assets.find((a) => a.id === selectedAssetId);
    return asset?.name || null;
  }, [selectedAssetId, assets]);

  // Build chart data for Portfolio Metrics
  const portfolioMetricsChartData = useMemo(
    () => buildPortfolioMetricsChart(griData, opexData, occupancyData, capexData, totalUnits, selectedAssetName),
    [griData, opexData, occupancyData, capexData, totalUnits, selectedAssetName]
  );

  // Export data for Portfolio Metrics chart
  const portfolioMetricsExportData = useMemo(() => {
    return portfolioMetricsChartData.map((item) => ({
      Month: item.month,
      GRI: item.GRI,
      "Vacancy Rate (%)": item["Vacancy Rate"],
      "OPEX/Unit (DKK)": item["OPEX/Unit"],
      "NOI %": item["NOI %"],
      CAPEX: item.CAPEX,
      OPEX: item.OPEX,
    }));
  }, [portfolioMetricsChartData]);

  // Generate all months for the category breakdown table
  const allMonths = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    return months.map((month) => `${month} ${currentYear}`);
  }, []);

  // Show only 6 months at a time with pagination
  const tableMonths = useMemo(() => {
    const startIndex = monthPage * 6;
    return allMonths.slice(startIndex, startIndex + 6);
  }, [allMonths, monthPage]);

  const totalMonthPages = Math.ceil(allMonths.length / 6);

  // Build category breakdown data from OPEX with monthly values
  const categoryBreakdown = useMemo(() => {
    // Generate category data with monthly values
    return OPEX_CATEGORIES.map((category) => {
      const row: CategoryRow = {
        category,
        totalYTD: 0,
        variance: "+0%",
      };
      
      // Generate values for each month based on category index for variation
      const categoryIndex = OPEX_CATEGORIES.indexOf(category);
      const baseValue = (categoryIndex + 1) * 40000 + 10000;
      
      allMonths.forEach((month, monthIndex) => {
        const monthMultiplier = 0.95 + (monthIndex * 0.01) + (Math.sin(monthIndex) * 0.05);
        const value = Math.round(baseValue * monthMultiplier);
        row[month] = value;
        row.totalYTD += value;
      });
      
      return row;
    });
  }, [allMonths]);

  // Filter categories based on search and filter
  const filteredCategories = useMemo(() => {
    return categoryBreakdown.filter((row) => {
      const matchesSearch = row.category.toLowerCase().includes(categorySearch.toLowerCase());
      const matchesFilter = categoryFilter === "All Categories" || row.category === categoryFilter;
      return matchesSearch && matchesFilter;
    });
  }, [categoryBreakdown, categorySearch, categoryFilter]);

  // Export data for category breakdown
  const categoryExportData = useMemo(() => {
    return filteredCategories.map((row) => {
      const exportRow: Record<string, string | number> = {
        Category: row.category,
      };
      tableMonths.forEach((month) => {
        exportRow[month] = row[month] as number;
      });
      return exportRow;
    });
  }, [filteredCategories, tableMonths]);

  const cardConfig = [
    {
      title: "GRI",
      description: "Gross Rental Income across all assets",
      data: griTotal,
      suffix: "DKK",
    },
    {
      title: "Vacancy Rate",
      description: "Vacancy rate across all assets",
      data: vacancyRateTotal,
      suffix: "%",
    },
    {
      title: "OPEX / Unit",
      description: "OPEX per unit across all assets",
      data: opexTotal / totalUnits,
      suffix: "DKK",
    },
    {
      title: "NOI %",
      description: "NOI margin across all assets",
      data: noiMarginTotal,
      suffix: "%",
    },
  ];

  // Budget vs Actual data for OPEX categories
  const budgetVsActualData: BudgetVsActualData[] = useMemo(() => {
    const categories = [
      {
        key: "property_taxes",
        label: "Property Taxes",
      },
      {
        key: "property_management_fee",
        label: "Management Fee",
      },
      {
        key: "common_consumption",
        label: "Common Consumption",
      },
      {
        key: "insurance",
        label: "Insurance",
      },
      {
        key: "cleaning",
        label: "Cleaning",
      },
      {
        key: "facility_management",
        label: "Facility Management",
      },
    ];

    return categories.map((cat) => {
      let totalActual = 0;
      let totalBudget = 0;

      assets.forEach((asset) => {
        const currentYearOpex = asset.opex.find(
          (o) => o.opex_year === CURRENT_YEAR
        );
        if (currentYearOpex) {
          const actualKey = `actual_${cat.key}` as keyof Opex;
          const budgetKey = `budget_${cat.key}` as keyof Opex;
          totalActual += (currentYearOpex[actualKey] as number) || 0;
          totalBudget += (currentYearOpex[budgetKey] as number) || 0;
        }
      });

      return {
        category: cat.label,
        actual: totalActual,
        budget: totalBudget,
      };
    });
  }, [assets]);

  if (isAssetsLoading) {
    return (
      <PageAnimation>
        <div className="space-y-6">
          <div className="w-full">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              My Assets
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Portfolio overview of all owned properties
            </p>
          </div>
          <MyAssetsSkeleton />
        </div>
      </PageAnimation>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="text-muted-foreground">No asset data available.</div>
    );
  }

  // Export data for Budget vs Actual
  const budgetVsActualExportData = budgetVsActualData.map((item) => ({
    Category: item.category,
    Actual: item.actual,
    Budget: item.budget,
    Variance: item.actual - item.budget,
    "Variance %": item.budget !== 0 ? ((item.actual - item.budget) / item.budget * 100).toFixed(2) + "%" : "N/A",
  }));

  // Export data for Portfolio Table
  const portfolioExportData = portfolioRows.map((row) => ({
    Property: row.property,
    "Vacancy (%)": row.vacancy.toFixed(2),
    "OPEX (DKK)": row.opex,
    "OPEX/Unit (DKK)": row.opexPerUnit,
    "NOI (DKK)": row.noi,
    "NOI Margin (%)": row.noiMargin.toFixed(2),
  }));

  return (
    <PageAnimation>
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Key Metrics</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4">
            {cardConfig.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-5 overflow-hidden">
                  <p className="kpi-label mb-2">{card.title}</p>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {dollarStringify({ value: card.data, format: "text" })}{" "}
                    {card.suffix}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Portfolio Metrics</h3>
            <ExportButton data={portfolioMetricsExportData} filename="portfolio-metrics" />
          </div>
          <GlowingLineChart
            title="Portfolio Metrics"
            data={portfolioMetricsChartData}
            assets={assets.map((a) => ({ id: a.id, name: a.name }))}
            selectedAsset={selectedAssetId}
            onAssetChange={setSelectedAssetId}
          />
        </section>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Category Breakdown</h3>
            <ExportButton data={categoryExportData} filename="category-breakdown" />
          </div>
          {/* Asset Toggle Buttons - Same style as Portfolio Metrics */}
          <div className="overflow-x-auto no-scrollbar mb-4">
            <div className="flex gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedCategoryAssetId(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border ${
                  selectedCategoryAssetId === null
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                }`}
              >
                All Assets
              </button>
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedCategoryAssetId(asset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border ${
                    selectedCategoryAssetId === asset.id
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </div>
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex gap-3 pt-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Categories">All Categories</SelectItem>
                    {OPEX_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors border-border">
                      <th className="h-14 px-6 text-left align-middle text-muted-foreground font-medium">
                        Category
                      </th>
                      {tableMonths.map((month) => (
                        <th
                          key={month}
                          className="h-14 px-6 text-right align-middle text-muted-foreground font-medium"
                        >
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredCategories.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-5 align-middle font-medium text-foreground">
                          {row.category}
                        </td>
                        {tableMonths.map((month) => (
                          <td
                            key={month}
                            className="px-6 py-5 align-middle text-right text-muted-foreground tabular-nums"
                          >
                            {formatCompact(row[month] as number)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Month Pagination Controls */}
              {totalMonthPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setMonthPage((prev) => Math.max(0, prev - 1))}
                    disabled={monthPage === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {monthPage + 1} of {totalMonthPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMonthPage((prev) => Math.min(totalMonthPages - 1, prev + 1))}
                    disabled={monthPage === totalMonthPages - 1}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Budget vs Actual</h3>
            <ExportButton data={budgetVsActualExportData} filename="budget-vs-actual" />
          </div>
          {/* Asset Toggle Buttons - Same style as Portfolio Metrics */}
          <div className="overflow-x-auto no-scrollbar mb-4">
            <div className="flex gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedAssetId(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border ${
                  selectedAssetId === null
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                }`}
              >
                All Assets
              </button>
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border ${
                    selectedAssetId === asset.id
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </div>
          <BudgetVsActualChart data={budgetVsActualData} />
        </section>
      </div>
    </PageAnimation>
  );
}
