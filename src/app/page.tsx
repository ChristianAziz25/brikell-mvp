import { Card, Chat } from "@/components";
import { Button } from "@/components/ui/button";
import { FileIcon, HouseIcon, UsersIcon, WorkflowIcon } from "lucide-react";

const dashboardConfigs = [
  {
    icon: HouseIcon,
    title: "Properties",
    description: "Manage all properties",
  },
  {
    icon: FileIcon,
    title: "Rent Roll",
    description: "View rent details",
  },
  {
    icon: UsersIcon,
    title: "Tenants",
    description: "Tenant management",
  },
  {
    icon: WorkflowIcon,
    title: "Workflows",
    description: "Track processes",
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground text-center">
          How can I <span className="text-muted-foreground">help today?</span>
        </h2>
        <p className="text-muted-foreground text-center text-sm">
          Type a command or ask a question
        </p>
      </div>
      <Chat />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 rounded-xl"
        >
          Show me all vacant units
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 rounded-xl"
        >
          Generate rent roll report
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 rounded-xl"
        >
          Calculate portfolio ROI
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2 px-2.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 rounded-xl"
        >
          Find expiring leases
        </Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          My Dashboards
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dashboardConfigs.map((config) => {
            const IconComponent = config.icon;
            return (
              <Card
                key={config.title}
                title={config.title}
                content={config.description}
                className="cursor-pointer hover:shadow-md transition-all hover:border-foreground/20 bg-card border rounded-2xl"
              >
                <IconComponent className="h-5 w-5 text-foreground" />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
