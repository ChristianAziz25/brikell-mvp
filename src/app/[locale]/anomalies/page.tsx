"use client";

import { PageAnimation } from "@/components/page-animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingLineChart } from "@/components/ui/glowing-line-chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { YearByAssetRow } from "@/lib/timeSeriesData";
import { useQuery } from "@tanstack/react-query";
import { Info, Search, TrendingUp, TriangleAlert } from "lucide-react";
import { useState, useMemo } from "react";

type VarianceAnalysisItem = {
  title: string;
  severity: "high" | "moderate" | "benchmark";
  description: string;
  icon: "alert" | "trending" | "info";
};

// Alert data will be generated dynamically based on assets
const generateAlerts = (assetNames: string[]): VarianceAnalysisItem[] => {
  if (assetNames.length === 0) return [];
  
  const alerts: VarianceAnalysisItem[] = [
    {
      title: "HVAC Maintenance",
      severity: "high",
      description: `${assetNames[0] || "Building"} +31%`,
      icon: "alert",
    },
    {
      title: "Elevator Repairs",
      severity: "high",
      description: `${assetNames[1] || assetNames[0] || "Building"} +27%`,
      icon: "alert",
    },
    {
      title: "Water Usage",
      severity: "moderate",
      description: `${assetNames[2] || assetNames[0] || "Building"} +19%`,
      icon: "trending",
    },
    {
      title: "Security Costs",
      severity: "benchmark",
      description: `${assetNames[0] || "Building"} -15%`,
      icon: "info",
    },
    {
      title: "Insurance Premium",
      severity: "moderate",
      description: `${assetNames[3] || assetNames[0] || "Building"} +12%`,
      icon: "trending",
    },
    {
      title: "Energy Efficiency",
      severity: "benchmark",
      description: `${assetNames[4] || assetNames[0] || "Building"} -8%`,
      icon: "info",
    },
  ];
  
  return alerts;
};

const getSeverityBadge = (severity: VarianceAnalysisItem["severity"]) => {
  switch (severity) {
    case "high":
      return (
        <span className="text-xs text-destructive">High</span>
      );
    case "moderate":
      return (
        <span className="text-xs text-amber-600">Moderate</span>
      );
    case "benchmark":
      return (
        <span className="text-xs text-teal-600">Benchmark</span>
      );
  }
};

const getVarianceIcon = (icon: VarianceAnalysisItem["icon"]) => {
  switch (icon) {
    case "alert":
      return <TriangleAlert className="h-4 w-4 text-destructive" />;
    case "trending":
      return <TrendingUp className="h-4 w-4 text-amber-600" />;
    case "info":
      return <Info className="h-4 w-4 text-teal-600" />;
  }
};

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

// Convert year-based data to month format for the chart
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type AssetSummary = { id: string; name: string };

function buildPortfolioMetricsChart(
  capexData: YearByAssetRow[],
  opexData: YearByAssetRow[],
  griData: YearByAssetRow[],
  selectedAssetName: string | null
) {
  // Get the latest year's data and create monthly view
  const latestYear = Math.max(
    ...capexData.map((d) => d.year),
    ...opexData.map((d) => d.year),
    ...griData.map((d) => d.year)
  );

  // Sum all assets for each metric for the latest year
  const capexRow = capexData.find((d) => d.year === latestYear);
  const opexRow = opexData.find((d) => d.year === latestYear);
  const griRow = griData.find((d) => d.year === latestYear);

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

  const totalCapex = getValues(capexRow, selectedAssetName);
  const totalOpex = getValues(opexRow, selectedAssetName);
  const totalGri = getValues(griRow, selectedAssetName);

  // Use a seeded random for consistent results
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Distribute across months with some variation
  const monthlyData = MONTHS.map((month, index) => {
    const seed = index + (selectedAssetName ? selectedAssetName.length : 0);
    const variation = 0.8 + Math.sin(index * 0.5) * 0.3 + seededRandom(seed) * 0.2;
    return {
      month,
      CAPEX: Math.round((totalCapex / 12) * variation),
      OPEX: Math.round((totalOpex / 12) * (0.9 + Math.cos(index * 0.4) * 0.2)),
      GRI: Math.round((totalGri / 12) * (0.95 + Math.sin(index * 0.3) * 0.1)),
    };
  });

  return monthlyData;
}

export default function AnomaliesPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Fetch assets
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<
    AssetSummary[]
  >({
    queryKey: ["assets", "names"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch assets");
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

  const isLoading = isCapexLoading || isOpexLoading || isGriLoading || isAssetsLoading;

  // Find selected asset name from ID
  const selectedAssetName = useMemo(() => {
    if (!selectedAssetId) return null;
    const asset = assets.find((a) => a.id === selectedAssetId);
    return asset?.name || null;
  }, [selectedAssetId, assets]);

  const chartData = useMemo(
    () => buildPortfolioMetricsChart(capexData, opexData, griData, selectedAssetName),
    [capexData, opexData, griData, selectedAssetName]
  );

  // Calculate percentage change (GRI growth)
  const griValues = chartData.map((d) => d.GRI);
  const firstGri = griValues[0] || 1;
  const lastGri = griValues[griValues.length - 1] || 1;
  const percentageChange = ((lastGri - firstGri) / firstGri) * 100;

  // Generate alerts based on asset names
  const assetNames = assets.map((a) => a.name);
  const alertsData = useMemo(() => generateAlerts(assetNames), [assetNames]);

  // Generate monthly columns for the table
  const tableMonths = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    // Show last 6 months
    return months.slice(0, 6).map((month) => `${month} ${currentYear}`);
  }, []);

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
      
      tableMonths.forEach((month, monthIndex) => {
        const monthMultiplier = 0.95 + (monthIndex * 0.01) + (Math.sin(monthIndex) * 0.05);
        const value = Math.round(baseValue * monthMultiplier);
        row[month] = value;
        row.totalYTD += value;
      });
      
      return row;
    });
  }, [tableMonths]);

  // Filter categories based on search and filter
  const filteredCategories = useMemo(() => {
    return categoryBreakdown.filter((row) => {
      const matchesSearch = row.category.toLowerCase().includes(categorySearch.toLowerCase());
      const matchesFilter = categoryFilter === "All Categories" || row.category === categoryFilter;
      return matchesSearch && matchesFilter;
    });
  }, [categoryBreakdown, categorySearch, categoryFilter]);

  return (
    <PageAnimation>
      <div className="space-y-6 animate-fade-in">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Glowing Line Chart */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full max-w-2xl" />
                <Card className="h-[560px]">
                  <CardContent className="p-6 h-full flex items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-[450px] w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <GlowingLineChart
                title="Portfolio Metrics"
                subtitle={
                  selectedAssetName
                    ? `Monthly CAPEX, OPEX & GRI for ${selectedAssetName}`
                    : "Monthly CAPEX, OPEX & GRI across all assets"
                }
                percentageChange={percentageChange}
                data={chartData}
                assets={assets}
                selectedAsset={selectedAssetId}
                onAssetChange={setSelectedAssetId}
              />
            )}
          </div>

          {/* Variance Analysis Card */}
          <div className="flex flex-col">
            {/* Spacer to align with graph (accounts for asset toggle buttons) */}
            <div className="h-[52px]" />
            <Card className="border-border h-[560px] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-medium tracking-tight">
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto no-scrollbar p-0">
                <div className="divide-y divide-border">
                  {alertsData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="shrink-0">
                        {getVarianceIcon(item.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </span>
                          {getSeverityBadge(item.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium tracking-tight">
              Category Breakdown
            </CardTitle>
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
                    <th className="h-12 px-4 text-left align-middle text-muted-foreground font-medium">
                      Category
                    </th>
                    {tableMonths.map((month) => (
                      <th
                        key={month}
                        className="h-12 px-4 text-right align-middle text-muted-foreground font-medium"
                      >
                        {month}
                      </th>
                    ))}
                    <th className="h-12 px-4 text-right align-middle text-muted-foreground font-medium">
                      Total YTD
                    </th>
                    <th className="h-12 px-4 text-right align-middle text-muted-foreground font-medium">
                      Variance
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {isLoading ? (
                    <tr>
                      <td colSpan={tableMonths.length + 3} className="p-4">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 align-middle font-medium text-foreground">
                          {row.category}
                        </td>
                        {tableMonths.map((month) => (
                          <td
                            key={month}
                            className="p-4 align-middle text-right text-muted-foreground"
                          >
                            {formatCompact(row[month] as number)}
                          </td>
                        ))}
                        <td className="p-4 align-middle text-right font-medium text-foreground">
                          {formatCompact(row.totalYTD)}
                        </td>
                        <td className="p-4 align-middle text-right text-muted-foreground">
                          {row.variance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageAnimation>
  );
}
