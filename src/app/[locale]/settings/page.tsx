import { PageAnimation } from "@/components/page-animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Building, Database, Palette, Shield, User } from "lucide-react";

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your account details and preferences",
    icon: User,
    delay: 0,
  },
  {
    title: "Portfolio Settings",
    description: "Configure properties, benchmarks, and data sources",
    icon: Building,
    delay: 50,
  },
  {
    title: "Notifications",
    description: "Customize alert thresholds and delivery preferences",
    icon: Bell,
    delay: 100,
  },
  {
    title: "Security",
    description: "Two-factor authentication and access controls",
    icon: Shield,
    delay: 150,
  },
  {
    title: "Data Management",
    description: "Import/export data and manage integrations",
    icon: Database,
    delay: 200,
  },
  {
    title: "Appearance",
    description: "Theme, display density, and chart preferences",
    icon: Palette,
    delay: 250,
  },
];

export default function SettingsPage() {
  return (
    <PageAnimation>
      <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className="bg-card border border-border rounded-lg shadow-elevation-1 text-left card-interactive animate-fade-in cursor-pointer transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${section.delay}ms` }}
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted/60">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="font-semibold text-foreground text-base">
                      {section.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5">
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </PageAnimation>
  );
}
