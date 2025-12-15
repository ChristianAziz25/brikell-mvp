import type {
  Asset,
  Capex,
  Opex,
  RentRollUnit,
  TheoreticalRentalIncome,
} from "@/generated/client";

export type AssetWithRelations = Asset & {
  capex: Capex[];
  opex: Opex[];
  rentRoll: RentRollUnit[];
  tri: TheoreticalRentalIncome[];
};
  
  export type YearlyCapexPoint = {
    year: number;
    assetId: string;
    assetName: string;
    totalCapexActual: number;
    totalCapexBudget: number;
  };
  
  export type YearlyOpexPoint = {
    year: number;
    assetId: string;
    assetName: string;
    totalOpexActual: number;
    totalOpexBudget: number;
  };
  
  export type YearlyGriPoint = {
    year: number;
    assetId: string;
    assetName: string;
    gri: number; // triAmount - vacancyLoss
  };
  
  export type YearlyOccupancyPoint = {
    year: number;
    assetId: string;
    assetName: string;
    occupancyRate: number; // 0..1
  };
  
  export type AssetTimeSeries = {
    assetId: string;
    assetName: string;
    capex: YearlyCapexPoint[];
    opex: YearlyOpexPoint[];
    gri: YearlyGriPoint[];
    occupancy: YearlyOccupancyPoint[];
  };

  // Shape used for multi-series charts where each asset gets its own key per year.
  // Example:
  // { year: 2024, "Emmahus": 123_000, "Gethus": 98_000 }
  export type YearByAssetRow = {
    year: number;
    // Dynamically added keys for each assetName -> numeric value for that metric
    [assetName: string]: number;
  };
  
  /**
   * Helper to sum all numeric fields on a record that match a predicate on the key.
   */
  export function sumFields<T extends Record<string, unknown>>(
    row: T,
    predicate: (key: string) => boolean
  ): number {
    return Object.keys(row).reduce((sum, key) => {
      if (!predicate(key)) return sum;

      const raw = row[key];

      if (typeof raw === "number") {
        return Number.isFinite(raw) ? sum + raw : sum;
      }

      if (typeof raw === "string") {
        const n = Number(raw);
        return Number.isFinite(n) ? sum + n : sum;
      }

      // Ignore non-number / non-string fields (e.g. Date)
      return sum;
    }, 0);
  }
  
  export function buildAssetTimeSeries(
    assets: AssetWithRelations[]
  ): AssetTimeSeries[] {
    return assets.map((asset) => {
      const assetId = asset.id;
      const assetName = asset.name;
  
      // ----- CAPEX: sum all *_actuals / *_budget by year -----
      // Safely handle assets that may have no related CAPEX / OPEX / TRI / rentRoll rows.
      const capexRows = Array.isArray(asset.capex) ? asset.capex : [];
      const opexRows = Array.isArray(asset.opex) ? asset.opex : [];
      const triRows = Array.isArray(asset.tri) ? asset.tri : [];
      const rentRollUnits = Array.isArray(asset.rentRoll) ? asset.rentRoll : [];

      const capexByYear: Record<
        number,
        { totalActual: number; totalBudget: number }
      > = {};
  
      for (const row of capexRows) {
        const year = row.capex_year;
        const actual = sumFields(row, (k) => k.includes("actuals") || k.includes("actual"));
        const budget = sumFields(row, (k) => k.includes("budget"));
  
        if (!capexByYear[year]) {
          capexByYear[year] = { totalActual: 0, totalBudget: 0 };
        }
        capexByYear[year].totalActual += actual;
        capexByYear[year].totalBudget += budget;
      }
  
      const capexSeries: YearlyCapexPoint[] = Object.entries(capexByYear)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, v]) => ({
          year: Number(year),
          assetId,
          assetName,
          totalCapexActual: v.totalActual,
          totalCapexBudget: v.totalBudget,
        }));
  
      // ----- OPEX: sum all actual_* / budget_* by year -----
      const opexByYear: Record<
        number,
        { totalActual: number; totalBudget: number }
      > = {};
  
      for (const row of opexRows) {
        const year = row.opex_year;
        const actual = sumFields(row, (k) => k.includes("actual") || k.includes("actuals"));
        const budget = sumFields(row, (k) => k.includes("budget"));
  
        if (!opexByYear[year]) {
          opexByYear[year] = { totalActual: 0, totalBudget: 0 };
        }
        opexByYear[year].totalActual += actual;
        opexByYear[year].totalBudget += budget;
      }
  
      const opexSeries: YearlyOpexPoint[] = Object.entries(opexByYear)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, v]) => ({
          year: Number(year),
          assetId,
          assetName,
          totalOpexActual: v.totalActual,
          totalOpexBudget: v.totalBudget,
        }));
  
      // ----- TRI / GRI: triAmount - vacancyLoss by triYear -----
      const griSeries: YearlyGriPoint[] = triRows
        .slice()
        .sort((a, b) => a.triYear - b.triYear)
        .map((row) => ({
          year: row.triYear,
          assetId,
          assetName,
          gri: row.triAmount - row.vacancyLoss,
        }));
  
      // ----- Occupancy: naive per-year occupancy from rentRoll -----
      // We derive year from lease_start and compute occupied / total.
      const occupancyAgg: Record<
        number,
        { occupied: number; total: number }
      > = {};
  
      for (const unit of rentRollUnits) {
        let year: number | null = null;
        if (unit.lease_start) {
          const d = new Date(unit.lease_start);
          if (!Number.isNaN(d.getTime())) {
            year = d.getFullYear();
          }
        }
        if (year == null) continue;
  
        if (!occupancyAgg[year]) {
          occupancyAgg[year] = { occupied: 0, total: 0 };
        }
        occupancyAgg[year].total += 1;
        if (unit.units_status === "occupied") {
          occupancyAgg[year].occupied += 1;
        }
      }
  
      const occupancySeries: YearlyOccupancyPoint[] = Object.entries(
        occupancyAgg
      )
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, { occupied, total }]) => ({
          year: Number(year),
          assetId,
          assetName,
          occupancyRate: total > 0 ? occupied / total : 0,
        }));
  
      return {
        assetId,
        assetName,
        capex: capexSeries,
        opex: opexSeries,
        gri: griSeries,
        occupancy: occupancySeries,
      };
    });
  }

  /**
   * Build a "matrix" view by year and asset name for a given metric, suitable for
   * multi‑series Recharts line charts.
   *
   * Example return shape for CAPEX:
   * [
   *   { year: 2024, Emmahus: 123000, Gethus: 98000 },
   *   { year: 2025, Emmahus: 110000, Gethus: 105000 },
   * ]
   */
  export function buildYearByAssetForMetric(
    assets: AssetWithRelations[],
    metric: "capex" | "opex" | "gri" | "occupancy"
  ): YearByAssetRow[] {
    const series = buildAssetTimeSeries(assets);

    const byYear: Record<number, Record<string, number>> = {};

    for (const assetSeries of series) {
      const name = assetSeries.assetName;

      if (metric === "capex") {
        for (const row of assetSeries.capex) {
          if (!byYear[row.year]) byYear[row.year] = {};
          byYear[row.year][name] = row.totalCapexActual;
        }
      } else if (metric === "opex") {
        for (const row of assetSeries.opex) {
          if (!byYear[row.year]) byYear[row.year] = {};
          byYear[row.year][name] = row.totalOpexActual;
        }
      } else if (metric === "gri") {
        for (const row of assetSeries.gri) {
          if (!byYear[row.year]) byYear[row.year] = {};
          byYear[row.year][name] = row.gri;
        }
      } else if (metric === "occupancy") {
        for (const row of assetSeries.occupancy) {
          if (!byYear[row.year]) byYear[row.year] = {};
          byYear[row.year][name] = row.occupancyRate;
        }
      }
    }

    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, valuesByAsset]) => ({
        year: Number(year),
        ...valuesByAsset,
      }));
  }