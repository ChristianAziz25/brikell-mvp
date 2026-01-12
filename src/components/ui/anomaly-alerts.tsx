"use client";

import { AlertTriangle, Info, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Anomaly = {
  type: "discrepancy" | "missing_data" | "value_mismatch" | "date_mismatch";
  severity: "high" | "medium" | "low";
  field: string;
  expectedValue?: string;
  actualValue?: string;
  source: "BBR" | "OIS" | "EJF" | "internal";
  description: string;
};

export type RiskFlag = {
  type: string;
  level: "critical" | "high" | "medium" | "low";
  message: string;
};

interface AnomalyAlertsProps {
  anomalies?: Anomaly[];
  riskFlags?: RiskFlag[];
  className?: string;
}

export function AnomalyAlerts({
  anomalies = [],
  riskFlags = [],
  className,
}: AnomalyAlertsProps) {
  if (anomalies.length === 0 && riskFlags.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Risk Flags */}
      {riskFlags.map((flag, index) => {
        const isCritical = flag.level === "critical";
        const isHigh = flag.level === "high";
        
        return (
          <div
            key={index}
            className={cn(
              "rounded-xl p-4 border",
              isCritical
                ? "bg-red-50 border-red-200"
                : isHigh
                ? "bg-orange-50 border-orange-200"
                : "bg-yellow-50 border-yellow-200"
            )}
          >
            <div className="flex items-start gap-3">
              {isCritical ? (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCritical ? "text-red-900" : "text-orange-900"
                  )}
                >
                  {flag.message}
                </p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isCritical ? "text-red-700" : "text-orange-700"
                  )}
                >
                  Risk Level: {flag.level.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">
            Detected Anomalies ({anomalies.length})
          </h4>
          {anomalies.map((anomaly, index) => {
            const isHigh = anomaly.severity === "high";
            const isMedium = anomaly.severity === "medium";

            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg p-3 border text-sm",
                  isHigh
                    ? "bg-red-50/50 border-red-100"
                    : isMedium
                    ? "bg-orange-50/50 border-orange-100"
                    : "bg-yellow-50/50 border-yellow-100"
                )}
              >
                <div className="flex items-start gap-2">
                  <Info
                    className={cn(
                      "h-4 w-4 flex-shrink-0 mt-0.5",
                      isHigh ? "text-red-600" : isMedium ? "text-orange-600" : "text-yellow-600"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 mb-1">
                      {anomaly.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-600 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Field:</span>
                        {anomaly.field}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Source:</span>
                        {anomaly.source}
                      </span>
                      {anomaly.expectedValue && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Expected:</span>
                          {anomaly.expectedValue}
                        </span>
                      )}
                      {anomaly.actualValue && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Actual:</span>
                          {anomaly.actualValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
