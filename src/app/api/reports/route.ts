import { NextResponse } from "next/server";

export type ReportStatus = "Ready" | "Processing" | "Failed";
export type ReportPeriod = "Monthly" | "Quarterly" | "Annual" | "On-demand";

export interface RecentReport {
  id: string;
  title: string;
  period: ReportPeriod;
  date: string;
  status: ReportStatus;
}

export interface ScheduledReport {
  id: string;
  title: string;
  frequency: ReportPeriod;
  nextRun: string;
}

export interface ReportsData {
  recent: RecentReport[];
  scheduled: ScheduledReport[];
}

// Fake data generator
function generateFakeReports(): ReportsData {
  const recentReports: RecentReport[] = [
    {
      id: "1",
      title: "Q4 2024 Portfolio Report",
      period: "Quarterly",
      date: "Dec 15, 2024",
      status: "Ready",
    },
    {
      id: "2",
      title: "Annual NOI Summary",
      period: "Annual",
      date: "Dec 1, 2024",
      status: "Ready",
    },
    {
      id: "3",
      title: "OPEX Variance Analysis",
      period: "Monthly",
      date: "Nov 30, 2024",
      status: "Ready",
    },
    {
      id: "4",
      title: "Rent Roll Export",
      period: "On-demand",
      date: "Nov 28, 2024",
      status: "Ready",
    },
    {
      id: "5",
      title: "CAPEX 5-Year Forecast",
      period: "Annual",
      date: "Nov 15, 2024",
      status: "Ready",
    },
    {
      id: "6",
      title: "Vacancy Trend Report",
      period: "Quarterly",
      date: "Oct 31, 2024",
      status: "Ready",
    },
  ];

  const scheduledReports: ScheduledReport[] = [
    {
      id: "s1",
      title: "Monthly Portfolio Summary",
      frequency: "Monthly",
      nextRun: "Jan 1, 2025",
    },
    {
      id: "s2",
      title: "Quarterly Performance Review",
      frequency: "Quarterly",
      nextRun: "Mar 31, 2025",
    },
    {
      id: "s3",
      title: "Annual Financial Report",
      frequency: "Annual",
      nextRun: "Dec 31, 2025",
    },
  ];

  return {
    recent: recentReports,
    scheduled: scheduledReports,
  };
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const data = generateFakeReports();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

