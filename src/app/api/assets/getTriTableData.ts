import { Asset, Capex, Opex, TheoreticalRentalIncome } from "@/generated/client";

interface TableRow {
    metric: string;
    [year: string]: string | number;
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
        capexTableData.push({
            metric: key,
            ...asset.capex.reduce((acc, capex) => {
                const value = capex[key as keyof Capex];
                if (typeof value === "number") {
                    acc[capex.capex_year.toString()] = value;
                }
                return acc;
            }, {} as Record<string, number>),
        });
    });

    opexMetricKeys.forEach((key) => {
        opexTableData.push({
            metric: key,
            ...asset.opex.reduce((acc, opex) => {
                const value = opex[key as keyof Opex];
                if (typeof value === "number") {
                    acc[opex.opex_year.toString()] = value;
                }
                return acc;
            }, {} as Record<string, number>),
        });
    });
    return {
        name: asset.name,
        tri: triTableData,
        capex: capexTableData,
        opex: opexTableData,
    };
}