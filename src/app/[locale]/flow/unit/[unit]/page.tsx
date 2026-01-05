"use client";

import { PageAnimation } from "@/components/page-animation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RentRollUnit } from "@/generated/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

type RouteParams = {
  unit: string;
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("da-DK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

// Helper function to get status badge text
function getStatusText(status: RentRollUnit["units_status"]): string {
  switch (status) {
    case "vacant":
      return "Vacant";
    case "terminated":
      return "Terminated";
    case "occupied":
      return "Occupied";
    default:
      return "Unknown";
  }
}

export default function Page({ params }: { params: Promise<RouteParams> }) {
  const router = useRouter();
  const { unit: unitId } = use(params);
  const [currentTenantIndex, setCurrentTenantIndex] = useState(1);

  const { data: unit, isLoading } = useQuery<RentRollUnit>({
    queryKey: ["unit", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/rent-roll/${unitId}`);
      if (!res.ok) {
        throw new Error("Failed to load rent roll data");
      }
      return res.json();
    },
    enabled: !!unitId,
  });

  const hasMultipleTenants = unit?.tenant_name1 && unit?.tenant_name2;
  const currentTenant =
    currentTenantIndex === 1
      ? {
          name: unit?.tenant_name1,
          name2: unit?.tenant_name2,
          email: unit?.tenant_mail1,
          phone: unit?.tenant_number1,
        }
      : {
          name: unit?.tenant_name2,
          name2: unit?.tenant_name1,
          email: unit?.tenant_mail2,
          phone: unit?.tenant_number2,
        };
  if (isLoading) {
    return (
      <PageAnimation>
        <div className="h-full flex items-center justify-center">
          <div className="text-muted-foreground">Loading unit data...</div>
        </div>
      </PageAnimation>
    );
  }

  if (!unit) {
    return (
      <PageAnimation>
        <div className="h-full flex items-center justify-center">
          <div className="text-muted-foreground">Unit not found</div>
        </div>
      </PageAnimation>
    );
  }

  console.log(unit);

  return (
    <PageAnimation>
      <div className="h-full flex flex-col gap-6">
        <Button
          variant="outline"
          className="gap-2 mb-2 w-full md:w-fit md:self-start md:ml-6"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Flow</span>
        </Button>
        <div className="w-full flex flex-col md:flex-row gap-6 min-w-0">
          {/* Property card */}
          <div className="md:pl-6 md:w-80 md:shrink-0 space-y-6">
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {unit.unit_address}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {unit.unit_type}
                </p>
              </div>

              <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-border bg-muted-foreground/20 text-muted-foreground">
                {getStatusText(unit.units_status)}
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mt-0.5"
                >
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  {unit.unit_address}, {unit.unit_zipcode}
                </span>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(unit.rent_current_gri)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Date</span>
                  <span className="text-foreground">
                    {formatDate(unit.lease_end)}
                  </span>
                </div>
              </div>

              <div className="h-px w-full bg-border" />

              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Specifications
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="text-foreground">{unit.size_sqm} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rooms:</span>
                    <span className="text-foreground">
                      {unit.rooms_amount} rooms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Built:</span>
                    <span className="text-foreground">
                      {unit.property_build_year}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Start:</span>
                    <span className="text-foreground">
                      {formatDate(unit.lease_start)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Relevant documents */}
            <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
                Relevant Documents
              </h3>

              <div className="text-sm text-muted-foreground">
                No documents available
              </div>
            </div>
          </div>

          {/* Middle column: activity */}
          <div className="border bg-card text-card-foreground shadow-sm h-full rounded-2xl flex flex-col md:flex-1 md:min-w-0">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Activity
              </h2>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Activity items */}
                {/* These are static for now, can later be driven from data */}
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        Email sent to Maria Andersen
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        16/11/2024 14:30
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Confirmation of viewing appointment
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                        Completed
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • John Doe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phone call */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        Phone call from Lars Nielsen
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        15/11/2024 10:15
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Discussion of financing options
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                        Completed
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • Jane Smith
                      </span>
                    </div>
                  </div>
                </div>

                {/* Viewing planned */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        Viewing planned
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        18/11/2024 15:00
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Maria Andersen wants to see the property
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                        Upcoming
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • John Doe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document uploaded */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M10 9H8" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        Energy label uploaded
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        14/11/2024 09:00
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      New energy rating added to documents
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                        Completed
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • System
                      </span>
                    </div>
                  </div>
                </div>

                {/* Internal note */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        Internal note added
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        13/11/2024 16:45
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Property requires minor repairs before sale
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                        Completed
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • Jane Smith
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Add note
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Send email
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call
                </Button>
              </div>
            </div>
          </div>

          {/* Right column: current tenant */}
          <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl h-fit md:w-100 md:shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Current Tenant
              </h3>
              {hasMultipleTenants && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentTenantIndex(1)}
                    disabled={currentTenantIndex === 1}
                    className="p-1 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous tenant"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground min-w-8 text-center">
                    {currentTenantIndex}/2
                  </span>
                  <button
                    onClick={() => setCurrentTenantIndex(2)}
                    disabled={currentTenantIndex === 2}
                    className="p-1 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next tenant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {currentTenant.name ? (
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                  {currentTenant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {currentTenant.name}
                  </h4>
                  {currentTenant.name2 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentTenant.name2}
                    </p>
                  )}
                  <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                    {currentTenant.email && (
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span>{currentTenant.email}</span>
                      </div>
                    )}
                    {currentTenant.phone && (
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>+{currentTenant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No tenant information available
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center gap-2">
                <h4 className="font-medium text-muted-foreground">
                  Lease Start:
                </h4>
                <span className="text-sm text-muted-foreground">
                  {formatDate(unit.lease_start)}
                </span>
              </div>
              <div className="flex flex-row justify-between items-center gap-2">
                <h4 className="font-medium text-muted-foreground">
                  Lease End:
                </h4>
                <span className="text-sm text-muted-foreground">
                  {formatDate(unit.lease_end)}
                </span>
              </div>
              <div className="flex flex-row justify-between items-center gap-2">
                <h4 className="font-medium text-muted-foreground">
                  Monthly Rent:
                </h4>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(unit.rent_current_gri)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
