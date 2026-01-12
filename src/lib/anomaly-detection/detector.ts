import { prisma } from "@/lib/prisma";
import type { ExtractedData } from "@/app/api/parse-pdf/route";
import { generateMockBBRData, generateMockOISData, generateMockEJFData } from "@/lib/mock-data/generators";

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

/**
 * Extract property address from extracted PDF data
 */
function extractAddress(data: ExtractedData): { address?: string; zipCode?: string } {
  const address = data.keyTerms?.find(
    (term) =>
      term.term.toLowerCase().includes("address") ||
      term.term.toLowerCase().includes("location")
  )?.value;

  const zipCode = data.keyTerms?.find(
    (term) =>
      term.term.toLowerCase().includes("zip") ||
      term.term.toLowerCase().includes("postal")
  )?.value;

  return { address, zipCode };
}

/**
 * Extract property value from financials
 */
function extractPropertyValue(data: ExtractedData): number | null {
  // Look for asking price, sale price, or property value
  const priceTerm = data.keyTerms?.find(
    (term) =>
      term.term.toLowerCase().includes("price") ||
      term.term.toLowerCase().includes("value") ||
      term.term.toLowerCase().includes("asking")
  );

  if (priceTerm?.value) {
    // Extract number from string (remove currency symbols, commas, etc.)
    const match = priceTerm.value.match(/[\d,]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ""));
    }
  }

  // Check financials
  if (data.financials?.otherMetrics) {
    for (const metric of data.financials.otherMetrics) {
      if (
        metric.label.toLowerCase().includes("price") ||
        metric.label.toLowerCase().includes("value")
      ) {
        const match = metric.value.match(/[\d,]+/);
        if (match) {
          return parseFloat(match[0].replace(/,/g, ""));
        }
      }
    }
  }

  return null;
}

/**
 * Extract building year from document
 */
function extractBuildingYear(data: ExtractedData): number | null {
  const yearTerm = data.keyTerms?.find(
    (term) =>
      term.term.toLowerCase().includes("year") ||
      term.term.toLowerCase().includes("built") ||
      term.term.toLowerCase().includes("construction")
  );

  if (yearTerm?.value) {
    const match = yearTerm.value.match(/\d{4}/);
    if (match) {
      return parseInt(match[0]);
    }
  }

  // Check dates
  if (data.dates) {
    for (const date of data.dates) {
      if (date.label.toLowerCase().includes("built") || date.label.toLowerCase().includes("construction")) {
        const match = date.date.match(/\d{4}/);
        if (match) {
          return parseInt(match[0]);
        }
      }
    }
  }

  return null;
}

/**
 * Extract total area from document
 */
function extractTotalArea(data: ExtractedData): number | null {
  const areaTerm = data.keyTerms?.find(
    (term) =>
      term.term.toLowerCase().includes("area") ||
      term.term.toLowerCase().includes("size") ||
      term.term.toLowerCase().includes("sqm") ||
      term.term.toLowerCase().includes("m²")
  );

  if (areaTerm?.value) {
    const match = areaTerm.value.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ""));
    }
  }

  // Check financials metrics
  if (data.financials?.otherMetrics) {
    for (const metric of data.financials.otherMetrics) {
      if (
        metric.label.toLowerCase().includes("area") ||
        metric.label.toLowerCase().includes("size") ||
        metric.label.toLowerCase().includes("sqm")
      ) {
        const match = metric.value.match(/[\d,]+\.?\d*/);
        if (match) {
          return parseFloat(match[0].replace(/,/g, ""));
        }
      }
    }
  }

  return null;
}

/**
 * Detect anomalies by cross-referencing PDF data with public data sources
 */
export async function detectAnomalies(
  extractedData: ExtractedData,
  address?: string,
  zipCode?: string
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  // Extract address if not provided
  if (!address || !zipCode) {
    const extracted = extractAddress(extractedData);
    address = extracted.address || address;
    zipCode = extracted.zipCode || zipCode;
  }

  if (!address || !zipCode) {
    // Can't do cross-referencing without address
    return anomalies;
  }

  // Try to match property in database
  const property = await prisma.asset.findFirst({
    where: {
      OR: [
        { address: { contains: address, mode: "insensitive" } },
        { name: { contains: address, mode: "insensitive" } },
      ],
    },
  });

  // Fetch public data sources (or generate mock data if not found)
  let [bbrData, oisData, ejfData] = await Promise.all([
    prisma.bBRData.findFirst({
      where: {
        OR: [
          { address: { contains: address, mode: "insensitive" }, zipCode },
          { zipCode },
        ],
      },
      orderBy: { lastUpdated: "desc" },
    }),
    prisma.oISData.findFirst({
      where: {
        OR: [
          { address: { contains: address, mode: "insensitive" }, zipCode },
          { zipCode },
        ],
      },
      orderBy: { lastUpdated: "desc" },
    }),
    prisma.eJFData.findFirst({
      where: {
        OR: [
          { address: { contains: address, mode: "insensitive" }, zipCode },
          { zipCode },
        ],
      },
      orderBy: { year: "desc" },
    }),
  ]);

  // If no data exists, generate mock data on-the-fly for MVP demo
  if (!bbrData && address && zipCode) {
    const mockBBR = generateMockBBRData(address, zipCode);
    bbrData = await prisma.bBRData.create({
      data: mockBBR,
    });
  }

  if (!oisData && address && zipCode) {
    const mockOIS = generateMockOISData(address, zipCode);
    oisData = await prisma.oISData.create({
      data: mockOIS,
    });
  }

  if (!ejfData && address && zipCode) {
    const currentYear = new Date().getFullYear();
    const mockEJF = generateMockEJFData(address, zipCode, currentYear);
    ejfData = await prisma.eJFData.create({
      data: mockEJF,
    });
  }

  // Cross-reference property values
  const extractedValue = extractPropertyValue(extractedData);
  if (bbrData?.propertyValue && extractedValue) {
    const variance = Math.abs(
      (extractedValue - bbrData.propertyValue) / bbrData.propertyValue
    );
    if (variance > 0.1) {
      // 10% variance threshold
      anomalies.push({
        type: "value_mismatch",
        severity: variance > 0.2 ? "high" : "medium",
        field: "property_value",
        expectedValue: bbrData.propertyValue.toLocaleString("da-DK"),
        actualValue: extractedValue.toLocaleString("da-DK"),
        source: "BBR",
        description: `Property value differs by ${(variance * 100).toFixed(1)}% from BBR records`,
      });
    }
  }

  // Cross-reference building year
  const extractedYear = extractBuildingYear(extractedData);
  if (bbrData?.buildingYear && extractedYear) {
    const yearDiff = Math.abs(extractedYear - bbrData.buildingYear);
    if (yearDiff > 2) {
      anomalies.push({
        type: "date_mismatch",
        severity: yearDiff > 5 ? "high" : "medium",
        field: "building_year",
        expectedValue: bbrData.buildingYear.toString(),
        actualValue: extractedYear.toString(),
        source: "BBR",
        description: `Building year mismatch: ${yearDiff} years difference from BBR records`,
      });
    }
  }

  // Cross-reference area measurements
  const extractedArea = extractTotalArea(extractedData);
  if (bbrData?.totalArea && extractedArea) {
    const variance = Math.abs((extractedArea - bbrData.totalArea) / bbrData.totalArea);
    if (variance > 0.15) {
      // 15% variance threshold for area
      anomalies.push({
        type: "discrepancy",
        severity: variance > 0.25 ? "high" : "medium",
        field: "total_area",
        expectedValue: `${bbrData.totalArea.toFixed(2)} m²`,
        actualValue: `${extractedArea.toFixed(2)} m²`,
        source: "BBR",
        description: `Total area differs by ${(variance * 100).toFixed(1)}% from BBR records`,
      });
    }
  }

  // Check property taxes against EJF data
  if (extractedData.financials?.otherMetrics) {
    const propertyTaxMetric = extractedData.financials.otherMetrics.find(
      (m) =>
        m.label.toLowerCase().includes("tax") ||
        m.label.toLowerCase().includes("ejendomsskat")
    );

    if (propertyTaxMetric && ejfData?.propertyTax) {
      const extractedTax = parseFloat(
        propertyTaxMetric.value.replace(/[^\d,.-]/g, "").replace(/,/g, "")
      );
      if (!isNaN(extractedTax)) {
        const variance = Math.abs((extractedTax - ejfData.propertyTax) / ejfData.propertyTax);
        if (variance > 0.1) {
          anomalies.push({
            type: "value_mismatch",
            severity: variance > 0.2 ? "high" : "medium",
            field: "property_tax",
            expectedValue: ejfData.propertyTax.toLocaleString("da-DK"),
            actualValue: extractedTax.toLocaleString("da-DK"),
            source: "EJF",
            description: `Property tax differs by ${(variance * 100).toFixed(1)}% from EJF records`,
          });
        }
      }
    }
  }

  // Check for missing critical data
  if (!bbrData && address) {
    anomalies.push({
      type: "missing_data",
      severity: "low",
      field: "bbr_registration",
      source: "BBR",
      description: "Property not found in BBR database - may indicate unregistered property",
    });
  }

  if (!oisData && address) {
    anomalies.push({
      type: "missing_data",
      severity: "low",
      field: "ois_registration",
      source: "OIS",
      description: "Property not found in OIS database",
    });
  }

  return anomalies;
}

/**
 * Calculate risk flags based on detected anomalies
 */
export function calculateRiskFlags(anomalies: Anomaly[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const highSeverityCount = anomalies.filter((a) => a.severity === "high").length;
  const valueMismatches = anomalies.filter((a) => a.type === "value_mismatch");
  const missingDataCount = anomalies.filter((a) => a.type === "missing_data").length;

  if (highSeverityCount >= 3) {
    flags.push({
      type: "multiple_discrepancies",
      level: "critical",
      message: `Multiple high-severity discrepancies detected (${highSeverityCount} issues)`,
    });
  }

  if (valueMismatches.length >= 2) {
    flags.push({
      type: "value_inconsistency",
      level: "high",
      message: "Property values inconsistent across multiple sources",
    });
  }

  if (missingDataCount >= 2) {
    flags.push({
      type: "missing_registrations",
      level: "medium",
      message: "Property missing from multiple public databases",
    });
  }

  // Check for critical value mismatches
  const criticalValueMismatch = anomalies.find(
    (a) => a.type === "value_mismatch" && a.severity === "high"
  );
  if (criticalValueMismatch) {
    flags.push({
      type: "critical_value_mismatch",
      level: "critical",
      message: `Critical value discrepancy: ${criticalValueMismatch.description}`,
    });
  }

  return flags;
}
