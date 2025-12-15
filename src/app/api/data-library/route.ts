import { NextResponse } from "next/server";

export type DataSourceStatus = "Connected" | "Disconnected" | "Syncing" | "Error";

export interface DataSource {
  id: string;
  name: string;
  recordCount: number;
  lastSync: string;
  status: DataSourceStatus;
}

export interface RecentUpdate {
  id: string;
  tableName: string;
  action: string;
  recordCount: number;
  timestamp: string;
}

export interface DataLibraryData {
  dataSources: DataSource[];
  recentUpdates: RecentUpdate[];
}

// Fake data generator
function generateFakeData(): DataLibraryData {
  const dataSources: DataSource[] = [
    {
      id: "1",
      name: "Property Financials",
      recordCount: 12450,
      lastSync: "2 min ago",
      status: "Connected",
    },
    {
      id: "2",
      name: "Rent Roll",
      recordCount: 1580,
      lastSync: "5 min ago",
      status: "Connected",
    },
    {
      id: "3",
      name: "OPEX Transactions",
      recordCount: 8920,
      lastSync: "10 min ago",
      status: "Connected",
    },
    {
      id: "4",
      name: "CAPEX Projects",
      recordCount: 245,
      lastSync: "1 hour ago",
      status: "Connected",
    },
    {
      id: "5",
      name: "Tenant Directory",
      recordCount: 892,
      lastSync: "30 min ago",
      status: "Connected",
    },
  ];

  const recentUpdates: RecentUpdate[] = [
    {
      id: "1",
      tableName: "rent_roll",
      action: "Updated",
      recordCount: 12,
      timestamp: "5 min ago",
    },
    {
      id: "2",
      tableName: "property_financials",
      action: "Synced",
      recordCount: 48,
      timestamp: "2 min ago",
    },
    {
      id: "3",
      tableName: "opex_transactions",
      action: "Added",
      recordCount: 156,
      timestamp: "10 min ago",
    },
    {
      id: "4",
      tableName: "tenant_directory",
      action: "Updated",
      recordCount: 3,
      timestamp: "30 min ago",
    },
  ];

  return {
    dataSources,
    recentUpdates,
  };
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const data = generateFakeData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching data library:", error);
    return NextResponse.json(
      { error: "Failed to fetch data library" },
      { status: 500 }
    );
  }
}

