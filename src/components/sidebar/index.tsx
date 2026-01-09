"use client";
import { Icon } from "@/components/icon";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  AlertTriangleIcon,
  Building2Icon,
  DatabaseIcon,
  HouseIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionMarkIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrendingDownIcon,
  UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  disabled?: boolean;
  beta?: boolean;
  divider?: boolean;
};

const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: (
      <HouseIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
  },
  // {
  //   title: "Flow",
  //   url: "/flow",
  //   icon: (
  //     <WorkflowIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
  //   ),
  // },
  {
    title: "Properties",
    url: "/properties",
    icon: (
      <LayoutDashboardIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
  },
  {
    title: "Units & Rent-rolls",
    url: "/units-and-rent-rolls",
    icon: (
      <Building2Icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
    divider: true,
  },
  {
    title: "OPEX",
    url: "/opex",
    icon: (
      <TrendingDownIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
  },
  {
    title: "Anomalies",
    url: "/anomalies",
    icon: (
      <AlertTriangleIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
    beta: true,
  },
  {
    title: "Diligence",
    url: "/diligence",
    icon: (
      <MessageSquareIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
    divider: true,
  },
  {
    title: "Data Library",
    url: "/data-library",
    icon: (
      <DatabaseIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200 flex items-center justify-center" />
    ),
    beta: true,
  },
];

const footerItems: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: (
      <SettingsIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Help",
    url: "/help",
    icon: (
      <MessageCircleQuestionMarkIcon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 mx-auto overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4 bg-white dark:bg-neutral-800 border-r border-r-sidebar-border">
          <Icon className="size-8 flex shrink-0" />
          <div className="h-px w-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-y-contain">
            <div className="flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <SidebarLink
                  key={idx}
                  link={{
                    label: item.title,
                    href: item.url,
                    icon: item.icon,
                    beta: item.beta,
                    divider: item.divider,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex flex-col gap-2">
            {footerItems.map((item, idx) => (
              <SidebarLink
                key={idx}
                link={{
                  label: item.title,
                  href: item.url,
                  icon: item.icon,
                }}
              />
            ))}
            <SidebarLink
              link={{
                label: "Christian Aziz",
                href: "#",
                icon: (
                  <div className="size-4 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <UserIcon className="size-[0.6rem] shrink-0 text-neutral-700 dark:text-neutral-200" />
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard>{children}</Dashboard>
    </div>
  );
}

const Dashboard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isChatPage = pathname?.includes("/diligence/");

  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      <div className="p-2 md:p-10 bg-gray-100 dark:bg-neutral-800 flex flex-col gap-2 flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar overscroll-y-contain">
        <div
          className={cn(
            "w-full max-w-7xl mx-auto min-w-0",
            isChatPage && "h-full"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
