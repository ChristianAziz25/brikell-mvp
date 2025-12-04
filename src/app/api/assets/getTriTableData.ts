import { Asset, Capex, Opex, TheoreticalRentalIncome } from "@/generated/client";

interface TableRow {
    metric: string;
    [year: string]: string | number | number[];
}

const baseExcluded = ["id", "assetId", "created_at", "updated_at", "createdAt", "updatedAt"];

const triExcluded    = [...baseExcluded, "triYear"];
const capexExcluded  = [...baseExcluded, "capex_year", "asset_name"];
const opexExcluded   = [...baseExcluded, "opex_year", "asset_name"];


interface TableData {
    name: string;
    tri: TableRow[];
    capex: TableRow[];
    opex: TableRow[];
}

export async function getTableData(asset: Asset & { tri: TheoreticalRentalIncome[] } & { capex: Capex[] } & { opex: Opex[] }): Promise<TableData> {
    const triTableData: TableRow[] = [];
    const capexTableData: TableRow[] = [];
    const opexTableData: TableRow[] = [];
    const allTriKeys = Object.keys(asset.tri[0]);
    const allCapexKeys = Object.keys(asset.capex[0]);
    const allOpexKeys = Object.keys(asset.opex[0]);

    const triMetricKeys = allTriKeys.filter((key) => !triExcluded.includes(key));
    const capexMetricKeys = allCapexKeys.filter((key) => !capexExcluded.includes(key));
    const opexMetricKeys = allOpexKeys.filter((key) => !opexExcluded.includes(key));

    const parseNumber = (raw: unknown): number | undefined => {
        if (raw === undefined || raw === null) return undefined;
        if (typeof raw === "number") return raw;
        const first = String(raw).split(",")[0] ?? "";
        const parsed = Number.parseFloat(first);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    triMetricKeys.forEach((key) => {
        triTableData.push({
            metric: key,
            ...asset.tri.reduce((acc, tri) => {
                const value = tri[key as keyof TheoreticalRentalIncome];
                if (typeof value === "number") {
                    acc[tri.triYear.toString()] = value;
                }
                return acc;
            }, {} as Record<string, number>),
        });
    });

    capexMetricKeys.forEach((key) => {
        const segments = key.split("_");
        const lastSegment = segments[segments.length - 1];
        const mainKey = segments.slice(0, -1).join("_");

        // If key is not an actuals/budget metric, keep the simple scalar behaviour.
        if (lastSegment !== "actuals" && lastSegment !== "budget") {
            capexTableData.push({
                metric: key,
                ...asset.capex.reduce((acc, capex) => {
                    const yearKey = capex.capex_year.toString();
                    const value = capex[key as keyof Capex];
                    const parsed = parseNumber(value);
                    if (parsed !== undefined) {
                        acc[yearKey] = parsed;
                    }
                    return acc;
                }, {} as Record<string, number>),
            });
            return;
        }

        // Avoid creating the row twice: if we're on a "*_budget" field and there
        // is a corresponding "*_actuals" key, handle this mainKey when we see that.
        if (lastSegment === "budget") {
            const actualKeyForMain = `${mainKey}_actuals`;
            if (allCapexKeys.includes(actualKeyForMain)) {
                return;
            }
        }

        const actualKey = `${mainKey}_actuals`;
        const budgetKey = `${mainKey}_budget`;

        capexTableData.push({
            metric: mainKey,
            ...asset.capex.reduce((acc, capex) => {
                const yearKey = capex.capex_year.toString();

                const actualRaw = capex[actualKey as keyof Capex];
                const budgetRaw = capex[budgetKey as keyof Capex];

                const actualParsed = parseNumber(actualRaw);
                const budgetParsed = parseNumber(budgetRaw);

                const arr: number[] = [];

                // Ensure "actual" is always index 0 and "budget" is index 1.
                if (actualParsed !== undefined) {
                    arr[0] = actualParsed;
                }
                if (budgetParsed !== undefined) {
                    arr[1] = budgetParsed;
                }

                if (arr.length > 0) {
                    acc[yearKey] = arr;
                }

                return acc;
            }, {} as Record<string, number[]>),
        });
    });

    opexMetricKeys.forEach((key) => {
        const segment = key.split("_");
        const diffKey = segment[0];
        const mainKey = segment.slice(1).join("_");

        if (diffKey !== "actual" && diffKey !== "budget") {
            opexTableData.push({
                metric: key,
                ...asset.opex.reduce((acc, opex) => {
                    const yearKey = opex.opex_year.toString();
                    const value = opex[key as keyof Opex];
                    const parsed = parseNumber(value);
                    if (parsed !== undefined) {
                        acc[yearKey] = parsed;
                    }
                    return acc;
                }, {} as Record<string, number>),
            });
            return;
        }

        if (diffKey === "budget") {
            const actualKeyForMain = `actual_${mainKey}`;
            if (allOpexKeys.includes(actualKeyForMain)) {
                return;
            }
        }

        const actualKey = `actual_${mainKey}`;
        const budgetKey = `budget_${mainKey}`;

        opexTableData.push({
            metric: mainKey,
            ...asset.opex.reduce((acc, opex) => {
                const yearKey = opex.opex_year.toString();

                const actualRaw = opex[actualKey as keyof Opex];
                const budgetRaw = opex[budgetKey as keyof Opex];

                const actualParsed = parseNumber(actualRaw);
                const budgetParsed = parseNumber(budgetRaw);

                const arr: number[] = [];

                if (actualParsed !== undefined) {
                    arr[0] = actualParsed;
                }
                if (budgetParsed !== undefined) {
                    arr[1] = budgetParsed;
                }

                if (arr.length > 0) {
                    acc[yearKey] = arr;
                }

                return acc;
            }, {} as Record<string, number[]>),
        });
    });

    return {
        name: asset.name,
        tri: triTableData,
        capex: capexTableData,
        opex: opexTableData,
    };
}