import { Card, Chat } from "@/components";
import { Badge } from "@/components/ui/badge";
import { FileIcon, HouseIcon, UsersIcon, WorkflowIcon } from "lucide-react";

const dashboardConfigs = [
  {
    icon: <HouseIcon />,
    title: "Properties",
    description: "Manage all properties ",
  },
  {
    icon: <FileIcon />,
    title: "Rent Roll",
    description: "View rent details",
  },
  {
    icon: <UsersIcon />,
    title: "Tenants",
    description: "Tenant management",
  },
  {
    icon: <WorkflowIcon />,
    title: "Workflows",
    description: "Track processes",
  },
];

export default function Home() {
  return (
    <div className="container mx-auto relative w-full flex flex-col items-center justify-center gap-4">
      <div className="w-full flex flex-col items-center justify-center gap-4">
        <h1 className="font-bold">Welcome Christian</h1>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4 w-full max-w-6xl">
          <Badge
            variant="outline"
            className="border border-primary-border cursor-pointer hover:bg-gray-300 hover:text-gray-900"
          >
            <p>Show me all vacant units</p>
          </Badge>
          <Badge
            variant="outline"
            className="border border-primary-border cursor-pointer hover:bg-gray-300 hover:text-gray-900"
          >
            <p>Generate rent roll report</p>
          </Badge>
          <Badge
            variant="outline"
            className="border border-primary-border cursor-pointer hover:bg-gray-300 hover:text-gray-900"
          >
            <p>Calculate portfolio ROI</p>
          </Badge>
          <Badge
            variant="outline"
            className="border border-primary-border cursor-pointer hover:bg-gray-300 hover:text-gray-900"
          >
            <p>Find expiring leases</p>
          </Badge>
        </div>
      </div>
      <Chat />
      <div className="w-full flex flex-col items-start justify-center gap-4">
        <p>My Dashboards</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4 w-full">
          {dashboardConfigs.map((config) => (
            <Card
              key={config.title}
              title={config.title}
              content={config.description}
              className="cursor-pointer hover:shadow-md transition-shadow duration-500"
            >
              {config.icon}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
