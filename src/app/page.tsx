import { Chat } from "@/components";
import { ChartBarMultiple } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import { ChartLineDefault } from "@/components/ui/line-chart";
import { ChartPieSimple } from "@/components/ui/pie-chart";

const graphs = [
  {
    name: "Line Chart",
    description: "A line chart",
    image: "/line-chart.png",
  },
  {
    name: "Pie Chart",
    description: "A pie chart",
    image: "/pie-chart.png",
  },
  {
    name: "Bar Chart",
    description: "A bar chart",
    image: "/bar-chart.png",
  },
  {
    name: "Line Chart",
    description: "A line chart",
  },
  {
    name: "Pie Chart",
    description: "A pie chart",
  },
  {
    name: "Bar Chart",
    description: "A bar chart",
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
          {graphs.map((graph) => {
            switch (graph.name) {
              case "Line Chart":
                return <ChartLineDefault />;
              case "Pie Chart":
                return <ChartPieSimple />;
              case "Bar Chart":
                return <ChartBarMultiple />;
            }
          })}
        </div>
      </div>
    </div>
  );
}
