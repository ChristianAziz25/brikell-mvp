"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type RouteParams = {
  unit: string;
};

export default function Page({ params }: { params: RouteParams }) {
  const router = useRouter();
  const unitId = params.unit;

  const { data: unit } = useQuery({
    queryKey: ["unit", unitId],
    queryFn: async () => {
      const res = await fetch("/api/rent-roll");
      if (!res.ok) {
        throw new Error("Failed to load rent roll data");
      }
      const units = await res.json();
      return units.find((u: { unitId: string }) => u.unitId === unitId);
    },
  });
  return (
    <div className="h-full flex flex-col gap-6">
      <Button
        variant="outline"
        className="gap-2 mb-2 w-full md:w-fit md:self-start md:ml-6"
        onClick={() => router.back()}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to Flow</span>
      </Button>
      <div className="w-full flex flex-col md:flex-row gap-6 overflow-x-auto">
        {/* Property card */}
        <div className="md:pl-6 space-y-6">
          <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Glentevej 28
              </h2>
              <p className="text-sm text-muted-foreground">Rækkehus</p>
            </div>

            <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-border bg-muted text-muted-foreground">
              Ingen interesse
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
              <span>Glentevej 28, 2400 København NV</span>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beløb</span>
                <span className="font-semibold text-foreground">
                  15.000,00 kr.
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lukkedato</span>
                <span className="text-foreground">30/11/2024</span>
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div>
              <h3 className="font-semibold text-foreground mb-3">
                Specifikationer
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Størrelse:</span>
                  <span className="text-foreground">120 m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Værelser:</span>
                  <span className="text-foreground">4 værelser</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bygget:</span>
                  <span className="text-foreground">1987</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renoveret:</span>
                  <span className="text-foreground">2018</span>
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
              Relevante dokumenter
            </h3>

            <div className="space-y-3 text-sm">
              {[
                {
                  name: "Energimærke.pdf",
                  meta: "245 KB • 10/11/2024",
                },
                {
                  name: "Bygningsrapport.pdf",
                  meta: "3.2 MB • 08/11/2024",
                },
                {
                  name: "Salgsopstilling.pdf",
                  meta: "892 KB • 05/11/2024",
                },
                {
                  name: "Tilstandsrapport.pdf",
                  meta: "1.8 MB • 03/11/2024",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2 flex-1">
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
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M10 9H8" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.meta}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="inline-flex items-center justify-center rounded-md h-8 w-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
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
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md h-8 w-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle column: activity */}
        <div className="border bg-card text-card-foreground shadow-sm h-full rounded-2xl flex flex-col">
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
              Aktivitet
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
                      Email sendt til Maria Andersen
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      16/11/2024 14:30
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Bekræftelse af besigtigelsesaftale
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                      Afsluttet
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
                      Telefonopkald fra Lars Nielsen
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      15/11/2024 10:15
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drøftelse af finansieringsmuligheder
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                      Afsluttet
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
                      Besigtigelse planlagt
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      18/11/2024 15:00
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Maria Andersen ønsker at se ejendommen
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                      Kommende
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
                      Energimærke uploadet
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      14/11/2024 09:00
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ny energimærkning tilføjet til dokumenter
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                      Afsluttet
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • System
                    </span>
                  </div>
                </div>
              </div>

              {/* Internal note */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
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
                      Intern note tilføjet
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      13/11/2024 16:45
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ejendom kræver mindre reparationer før salg
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold">
                      Afsluttet
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • Jane Smith
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t">
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
                Tilføj note
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
                Ring op
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: current tenant */}
        <div className="border bg-card text-card-foreground shadow-sm p-6 rounded-2xl h-fit">
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
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Current Tenant
          </h3>

          <div className="flex items-start gap-3">
            <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
              PL
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Peter Larsen</h4>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
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
                  <span>peter.larsen@email.dk</span>
                </div>
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
                  <span>+45 50 12 34 56</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
