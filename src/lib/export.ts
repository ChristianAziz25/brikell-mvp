import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export type ExportData = Record<string, unknown>[];

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData, filename: string): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Export data to XLS format
 */
export function exportToXLS(data: ExportData, filename: string): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Generate buffer and create blob
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Export multiple sheets to XLS format
 */
export function exportMultipleToXLS(
  sheets: { name: string; data: ExportData }[],
  filename: string
): void {
  if (!sheets || sheets.length === 0) {
    console.warn("No data to export");
    return;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    if (sheet.data && sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }
  });

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Format a number for export (removes formatting, keeps raw value)
 */
export function formatForExport(value: unknown): unknown {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    // Remove currency formatting if present
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? value : num;
  }
  return value;
}
