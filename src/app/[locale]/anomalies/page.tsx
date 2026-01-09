"use client";

import { PageAnimation } from "@/components/page-animation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info, TrendingUp, TriangleAlert } from "lucide-react";
import { useState } from "react";

type AnomalyRow = {
  lineItem: string;
  category: string;
  building: string;
  expected: string;
  actual: string;
  variance: string;
  severity: "high" | "moderate" | "benchmark";
  date: string;
};

type VarianceAnalysisItem = {
  title: string;
  severity: "high" | "moderate" | "benchmark";
  description: string;
  icon: "alert" | "trending" | "info";
};

const anomalyData: AnomalyRow[] = [
  {
    lineItem: "HVAC Maintenance",
    category: "Utilities",
    building: "Vesterbrogade 42",
    expected: "18,500 DKK",
    actual: "24,200 DKK",
    variance: "+31%",
    severity: "high",
    date: "Aug 2024",
  },
  {
    lineItem: "Elevator Repairs",
    category: "Repairs",
    building: "Østerbro Tower",
    expected: "14,000 DKK",
    actual: "17,800 DKK",
    variance: "+27%",
    severity: "high",
    date: "Nov 2024",
  },
  {
    lineItem: "Water Usage",
    category: "Utilities",
    building: "Nørrebro Gardens",
    expected: "8,200 DKK",
    actual: "9,800 DKK",
    variance: "+19%",
    severity: "moderate",
    date: "Oct 2024",
  },
  {
    lineItem: "Security Services",
    category: "Security",
    building: "Vesterbrogade 42",
    expected: "11,500 DKK",
    actual: "9,800 DKK",
    variance: "-15%",
    severity: "benchmark",
    date: "Sep 2024",
  },
  {
    lineItem: "Cleaning Supplies",
    category: "Cleaning",
    building: "Østerbro Tower",
    expected: "4,200 DKK",
    actual: "5,100 DKK",
    variance: "+21%",
    severity: "moderate",
    date: "Nov 2024",
  },
];

const varianceAnalysisData: VarianceAnalysisItem[] = [
  {
    title: "HVAC Emergency Repair Spike",
    severity: "high",
    description:
      "Vesterbrogade 42 experienced a 31% cost overrun on HVAC maintenance in August. Root cause: compressor failure in central cooling unit requiring emergency replacement. Recommend preventive maintenance schedule review.",
    icon: "alert",
  },
  {
    title: "Elevator Repair Costs",
    severity: "high",
    description:
      "Østerbro Tower elevator repairs exceeded budget by 27% in November. Door mechanism and control board required replacement. Consider capital reserve allocation for aging elevator units.",
    icon: "alert",
  },
  {
    title: "Water Consumption Increase",
    severity: "moderate",
    description:
      "Nørrebro Gardens shows 19% higher water usage than baseline. Pattern suggests potential leak in building B irrigation system or increased tenant occupancy. Maintenance inspection recommended.",
    icon: "trending",
  },
  {
    title: "Security Cost Optimization",
    severity: "benchmark",
    description:
      "Vesterbrogade 42 security costs are 15% below benchmark following contract renegotiation. This represents best practice for portfolio-wide vendor management.",
    icon: "info",
  },
];

const getSeverityBadge = (severity: AnomalyRow["severity"]) => {
  switch (severity) {
    case "high":
      return (
        <Badge className="rounded-full bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10">
          High variance
        </Badge>
      );
    case "moderate":
      return (
        <Badge className="rounded-full bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
          Moderate
        </Badge>
      );
    case "benchmark":
      return (
        <Badge className="rounded-full bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/10">
          Benchmark deviation
        </Badge>
      );
  }
};

const getVarianceColor = (variance: string) => {
  if (variance.startsWith("+") && parseFloat(variance) >= 25) {
    return "text-destructive";
  }
  if (variance.startsWith("+") && parseFloat(variance) >= 15) {
    return "text-amber-600";
  }
  if (variance.startsWith("-")) {
    return "text-teal-600";
  }
  return "text-foreground";
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

export default function AnomaliesPage() {
  const [period, setPeriod] = useState("Year to Date");
  const [category, setCategory] = useState("All Categories");
  const [building, setBuilding] = useState("All Buildings");
  const [severity, setSeverity] = useState("All Severity");

  return (
    <PageAnimation>
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Year to Date">Year to Date</SelectItem>
              <SelectItem value="Last Month">Last Month</SelectItem>
              <SelectItem value="Last Quarter">Last Quarter</SelectItem>
              <SelectItem value="Last Year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Repairs">Repairs</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={building} onValueChange={setBuilding}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Buildings">All Buildings</SelectItem>
              <SelectItem value="Vesterbrogade 42">Vesterbrogade 42</SelectItem>
              <SelectItem value="Østerbro Tower">Østerbro Tower</SelectItem>
              <SelectItem value="Nørrebro Gardens">Nørrebro Gardens</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Severity">All Severity</SelectItem>
              <SelectItem value="High variance">High variance</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Benchmark deviation">
                Benchmark deviation
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anomaly Line Items Table */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium tracking-tight">
                Anomaly Line Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-transparent border-border/50">
                      <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium">
                        Line Item
                      </th>
                      <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium">
                        Building
                      </th>
                      <th className="h-12 px-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium text-right">
                        Expected
                      </th>
                      <th className="h-12 px-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium text-right">
                        Actual
                      </th>
                      <th className="h-12 px-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium text-right">
                        Variance
                      </th>
                      <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium">
                        Severity
                      </th>
                      <th className="h-12 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {anomalyData.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b data-[state=selected]:bg-muted border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium text-foreground">
                          {row.lineItem}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {row.category}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {row.building}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right text-muted-foreground">
                          {row.expected}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right text-foreground font-medium">
                          {row.actual}
                        </td>
                        <td
                          className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right font-medium ${getVarianceColor(
                            row.variance
                          )}`}
                        >
                          {row.variance}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                          {getSeverityBadge(row.severity)}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {row.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Variance Analysis Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium tracking-tight">
                Variance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {varianceAnalysisData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-2">
                    {getVarianceIcon(item.icon)}
                    <div className="space-y-1.5 flex-1 leading-none">
                      <span className="text-sm font-medium text-foreground leading-none">
                        {item.title}
                      </span>
                      <div className="mt-1">
                        {getSeverityBadge(item.severity)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                    {item.description}
                  </p>
                  {index < varianceAnalysisData.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageAnimation>
  );
}
