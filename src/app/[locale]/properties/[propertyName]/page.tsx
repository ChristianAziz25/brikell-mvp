"use client";

import { PageAnimation } from "@/components/page-animation";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, use, useMemo, useState } from "react";
import { MyAssetsSkeleton } from "../components/skeleton";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const MONTHS_PER_VIEW = 6;

interface AssetSummary {
  id: string;
  name: string;
}

interface AssetData {
  name: string;
  tri: Array<{ metric: string; [key: string]: string | number | number[] }>;
  opex: Array<{ metric: string; [key: string]: string | number | number[] }>;
  capex: Array<{ metric: string; [key: string]: string | number | number[] }>;
}

type MetricRow = {
  category: string;
  isHeader?: boolean;
  isTotal?: boolean;
  actuals: Record<string, number>;
  budgets: Record<string, number>;
};

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

export default function PropertyPage({
  params,
}: {
  params: Promise<{ propertyName: string }>;
}) {
  const { propertyName } = use(params);
  const decodedPropertyName = decodeURIComponent(propertyName);
  const router = useRouter();

  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<AssetSummary[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(`/api/assets`);
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: assetData, isLoading: isAssetLoading } = useQuery<AssetData | null>({
    queryKey: ["asset-table-data", decodedPropertyName],
      queryFn: async () => {
      if (!decodedPropertyName) return null;
      const res = await fetch(`/api/asset?name=${encodeURIComponent(decodedPropertyName)}`);
      if (!res.ok) throw new Error("Failed to fetch asset");
        return res.json();
      },
    enabled: !!decodedPropertyName,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  // Generate monthly data with actuals and budgets
  const tableData = useMemo(() => {
    if (!assetData) return [];

    const yearKey = String(CURRENT_YEAR);
    
    // TRI values (actual and budget)
    const triRow = assetData.tri.find(r => r.metric === "triAmount");
    const vacancyRow = assetData.tri.find(r => r.metric === "vacancyLoss");
    const triValue = triRow?.[yearKey];
    const vacancyValue = vacancyRow?.[yearKey];
    
    const annualTriActual = Array.isArray(triValue) ? triValue[0] : (typeof triValue === "number" ? triValue : 0);
    const annualTriBudget = Array.isArray(triValue) ? triValue[1] : (typeof triValue === "number" ? triValue : 0);
    const annualVacancyActual = Array.isArray(vacancyValue) ? vacancyValue[0] : (typeof vacancyValue === "number" ? vacancyValue : 0);
    const annualVacancyBudget = Array.isArray(vacancyValue) ? vacancyValue[1] : (typeof vacancyValue === "number" ? vacancyValue : 0);
    
    const annualGriActual = annualTriActual - (annualTriActual * annualVacancyActual / 100);
    const annualGriBudget = annualTriBudget - (annualTriBudget * annualVacancyBudget / 100);

    // OPEX totals (actual and budget)
    let annualOpexActual = 0;
    let annualOpexBudget = 0;
    assetData.opex.forEach(row => {
      const val = row[yearKey];
      annualOpexActual += Array.isArray(val) ? val[0] : (typeof val === "number" ? val : 0);
      annualOpexBudget += Array.isArray(val) ? val[1] : (typeof val === "number" ? val : 0);
    });

    // CAPEX totals (actual and budget)
    let annualCapexActual = 0;
    let annualCapexBudget = 0;
    assetData.capex.forEach(row => {
      const val = row[yearKey];
      annualCapexActual += Array.isArray(val) ? val[0] : (typeof val === "number" ? val : 0);
      annualCapexBudget += Array.isArray(val) ? val[1] : (typeof val === "number" ? val : 0);
    });

    const rows: MetricRow[] = [];

    // Revenue Section
    rows.push({ category: "Revenue", isHeader: true, actuals: {}, budgets: {} });
    
    rows.push({
      category: "Gross Rental Income",
      actuals: MONTHS.reduce((acc, month, i) => {
        acc[month] = Math.round((annualGriActual / 12) * (0.95 + Math.sin(i * 0.5) * 0.1));
        return acc;
      }, {} as Record<string, number>),
      budgets: MONTHS.reduce((acc, month) => {
        acc[month] = Math.round(annualGriBudget / 12);
        return acc;
      }, {} as Record<string, number>),
    });

    rows.push({
      category: "Vacancy Loss",
      actuals: MONTHS.reduce((acc, month, i) => {
        acc[month] = Math.round(((annualTriActual * annualVacancyActual / 100) / 12) * (0.9 + Math.cos(i * 0.4) * 0.2));
        return acc;
      }, {} as Record<string, number>),
      budgets: MONTHS.reduce((acc, month) => {
        acc[month] = Math.round((annualTriBudget * annualVacancyBudget / 100) / 12);
        return acc;
      }, {} as Record<string, number>),
    });

    // Net Revenue Total
    const netRevenueActuals: Record<string, number> = {};
    const netRevenueBudgets: Record<string, number> = {};
    MONTHS.forEach(month => {
      netRevenueActuals[month] = (rows[1].actuals[month] || 0) - (rows[2].actuals[month] || 0);
      netRevenueBudgets[month] = (rows[1].budgets[month] || 0) - (rows[2].budgets[month] || 0);
    });
    rows.push({ category: "Net Revenue", isTotal: true, actuals: netRevenueActuals, budgets: netRevenueBudgets });

    // Operating Expenses Section (includes CAPEX)
    rows.push({ category: "Operating Expenses", isHeader: true, actuals: {}, budgets: {} });

    const expenseCategories = [
      { name: "Property Management", shareActual: 0.22, shareBudget: 0.22 },
      { name: "Property Taxes", shareActual: 0.18, shareBudget: 0.18 },
      { name: "Insurance", shareActual: 0.12, shareBudget: 0.12 },
      { name: "Utilities", shareActual: 0.12, shareBudget: 0.12 },
      { name: "Maintenance", shareActual: 0.12, shareBudget: 0.12 },
      { name: "Other Expenses", shareActual: 0.08, shareBudget: 0.08 },
      { name: "Capital Expenditures", shareActual: 0.16, shareBudget: 0.16, isCapex: true },
    ];

    const totalAnnualActual = annualOpexActual + annualCapexActual;
    const totalAnnualBudget = annualOpexBudget + annualCapexBudget;

    expenseCategories.forEach((cat, catIndex) => {
      rows.push({
        category: cat.name,
        actuals: MONTHS.reduce((acc, month, i) => {
          const factor = 0.92 + Math.sin(i * 0.3 + catIndex) * 0.16;
          acc[month] = Math.round((totalAnnualActual * cat.shareActual / 12) * factor);
          return acc;
        }, {} as Record<string, number>),
        budgets: MONTHS.reduce((acc, month) => {
          acc[month] = Math.round(totalAnnualBudget * cat.shareBudget / 12);
        return acc;
        }, {} as Record<string, number>),
      });
    });

    // Total Expenses
    const totalExpenseActuals: Record<string, number> = {};
    const totalExpenseBudgets: Record<string, number> = {};
    const expenseStartIndex = 5; // Index where expense rows start
    MONTHS.forEach(month => {
      totalExpenseActuals[month] = rows.slice(expenseStartIndex).reduce((sum, row) => sum + (row.actuals[month] || 0), 0);
      totalExpenseBudgets[month] = rows.slice(expenseStartIndex).reduce((sum, row) => sum + (row.budgets[month] || 0), 0);
    });
    rows.push({ category: "Total Expenses", isTotal: true, actuals: totalExpenseActuals, budgets: totalExpenseBudgets });

    // NOI Section
    rows.push({ category: "Net Operating Income", isHeader: true, actuals: {}, budgets: {} });
    
    const noiActuals: Record<string, number> = {};
    const noiBudgets: Record<string, number> = {};
    MONTHS.forEach(month => {
      noiActuals[month] = netRevenueActuals[month] - totalExpenseActuals[month];
      noiBudgets[month] = netRevenueBudgets[month] - totalExpenseBudgets[month];
    });
    rows.push({ category: "NOI", isTotal: true, actuals: noiActuals, budgets: noiBudgets });

    return rows;
  }, [assetData]);

  const isLoading = isAssetsLoading || isAssetLoading;

  // Month pagination state
  const [monthStartIndex, setMonthStartIndex] = useState(0);
  const visibleMonths = MONTHS.slice(monthStartIndex, monthStartIndex + MONTHS_PER_VIEW);
  const canGoBack = monthStartIndex > 0;
  const canGoForward = monthStartIndex + MONTHS_PER_VIEW < MONTHS.length;

  // Export data for financial table
  const financialExportData = useMemo(() => {
    if (!tableData.length) return [];
    
    return tableData
      .filter(row => !row.isHeader)
      .map(row => {
        const exportRow: Record<string, string | number> = {
          Category: row.category,
        };
        MONTHS.forEach(month => {
          exportRow[`${month} Actual`] = row.actuals[month] || 0;
          exportRow[`${month} Budget`] = row.budgets[month] || 0;
        });
        return exportRow;
      });
  }, [tableData]);

  return (
    <PageAnimation>
      <div className="space-y-6">
      <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {decodedPropertyName || "Property Details"}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
            Monthly Actuals vs Budget for {CURRENT_YEAR}
        </p>
      </div>

        {isLoading ? (
        <MyAssetsSkeleton />
        ) : !assetData ? (
        <div className="text-muted-foreground">No asset data available.</div>
      ) : (
        <>
            {/* Asset Tabs */}
            <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar pb-2">
            {assets.map((asset) => (
              <Button
                key={asset.id}
                  variant={asset.name === decodedPropertyName ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => router.push(`/properties/${encodeURIComponent(asset.name)}`)}
                >
                  {asset.name}
              </Button>
            ))}
          </div>

            {/* Financial Table - Actuals vs Budget */}
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {visibleMonths[0]} - {visibleMonths[visibleMonths.length - 1]} {CURRENT_YEAR}
                </div>
                <div className="flex items-center gap-2">
                  <ExportButton 
                    data={financialExportData} 
                    filename={`${decodedPropertyName}-financials-${CURRENT_YEAR}`} 
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthStartIndex(Math.max(0, monthStartIndex - MONTHS_PER_VIEW))}
                    disabled={!canGoBack}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                    {monthStartIndex === 0 ? "H1" : "H2"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthStartIndex(Math.min(MONTHS.length - MONTHS_PER_VIEW, monthStartIndex + MONTHS_PER_VIEW))}
                    disabled={!canGoForward}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    {/* Month Headers */}
                    <tr className="bg-muted/20">
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground text-xs uppercase tracking-wider w-52">
                        Category
                      </th>
                      {visibleMonths.map((month, i) => (
                        <th 
                          key={month} 
                          colSpan={2} 
                          className={`text-center py-4 px-4 font-semibold text-foreground text-sm ${
                            i < visibleMonths.length - 1 ? "border-r border-border/40" : ""
                          }`}
                        >
                          {month}
                        </th>
                      ))}
                    </tr>
                    {/* Actual/Budget Sub-headers */}
                    <tr className="border-b border-border/40 bg-muted/10">
                      <th className="py-2 px-6"></th>
                      {visibleMonths.map((month, i) => (
                        <Fragment key={month}>
                          <th
                            className="text-right py-2 px-4 font-normal text-muted-foreground text-xs uppercase tracking-wide"
                          >
                            Actual
                          </th>
                          <th
                            className={`text-right py-2 px-4 font-normal text-muted-foreground text-xs uppercase tracking-wide ${
                              i < visibleMonths.length - 1 ? "border-r border-border/40" : ""
                            }`}
                          >
                            Budget
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, rowIndex) => (
                      <tr 
                        key={`${row.category}-${rowIndex}`}
                        className={`
                          border-b border-border/30
                          ${row.isHeader ? "bg-muted/5" : ""}
                          ${row.isTotal ? "bg-muted/10" : ""}
                          hover:bg-muted/10 transition-colors
                        `}
                      >
                        <td className={`py-4 px-6 ${row.isHeader ? "font-semibold text-foreground pt-6 pb-3" : ""} ${row.isTotal ? "font-semibold" : "text-foreground/80"}`}>
                          {row.category}
                        </td>
                        {visibleMonths.map((month, i) => (
                          <>
                            <td 
                              key={`${month}-actual-${rowIndex}`} 
                              className={`text-right py-4 px-4 tabular-nums ${row.isTotal ? "font-semibold" : ""}`}
                            >
                              {row.isHeader ? "" : formatValue(row.actuals[month] || 0)}
                            </td>
                            <td 
                              key={`${month}-budget-${rowIndex}`} 
                              className={`text-right py-4 px-4 tabular-nums text-muted-foreground ${
                                i < visibleMonths.length - 1 ? "border-r border-border/40" : ""
                              } ${row.isTotal ? "font-semibold" : ""}`}
                            >
                              {row.isHeader ? "" : formatValue(row.budgets[month] || 0)}
                            </td>
                          </>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </>
      )}
    </div>
    </PageAnimation>
  );
}
