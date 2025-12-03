// src/app/api/rent-roll/export/route.ts
import { RentRollField } from "@/app/type/rent-roll";
import { getAllRentRollUnits } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const units = await getAllRentRollUnits();
  if (!units) {
      return new NextResponse("No units found", { status: 404 });
  }
  const format = req.nextUrl.searchParams.get("format") || "csv";

  const headers = Object.values(RentRollField);

  const rows = units.map((u) => [
    u.unit_id,
    u.property_build_year,
    u.property_name,
    u.unit_address,
    u.unit_zipcode,
    u.unit_door,
    u.unit_floor,
    u.utilites_cost,
    u.unit_type,
    u.size_sqm,
    u.rooms_amount,
    u.bedrooms_amount,
    u.bathrooms_amount,
    u.rent_current_gri,
    u.rent_budget_tri,
    u.units_status,
    u.lease_start,
    u.lease_end,
    u.tenant_name1,
    u.tenant_name2,
    u.tenant_number1,
    u.tenant_number2,
    u.tenant_mail1,
    u.tenant_mail2,
  ]);

  if (format === "xlsx" || format === "xls") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rent Roll");

    const bookType = format === "xls" ? "biff8" : "xlsx";
    const buffer = XLSX.write(workbook, { type: "buffer", bookType });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          format === "xls"
            ? "application/vnd.ms-excel"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rent-roll.${format}"`,
      },
    });
  }

  const csv =
    headers.join(",") +
    "\n" +
    rows
      .map((r) =>
        r
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rent-roll.csv"',
    },
  });
}