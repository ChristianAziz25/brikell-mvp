import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

export default function Capex() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4">
      <Card className="rounded-lg shadow-sm border-border">
        <CardContent className="p-5">
          <p className="kpi-label mb-2">CAPEX YTD</p>
          <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
            1.35M DKK
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="trend-pill trend-down">
              <span>On budget</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            75% of annual budget
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm border-border">
        <CardContent className="p-5">
          <p className="kpi-label mb-2">5-Year Forecast</p>
          <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
            11.5M DKK
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Total projected spend
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm border-border">
        <CardContent className="p-5">
          <p className="kpi-label mb-2">Projects Active</p>
          <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
            3
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Currently in progress
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm border-border">
        <CardContent className="p-5">
          <p className="kpi-label mb-2">Reserve Fund</p>
          <p className="text-2xl font-semibold text-foreground tracking-tight font-serif">
            4.2M DKK
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="trend-pill trend-down">
              <TrendingDown className="w-3 h-3" />
              <span>-15%</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Below recommended
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
