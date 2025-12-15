"use client";
import { Icon } from "@/components/icon";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Building2Icon,
  HammerIcon,
  HouseIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionMarkIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WorkflowIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  disabled?: boolean;
  beta?: boolean;
};

const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: (
      <HouseIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Flow",
    url: "/flow",
    icon: (
      <WorkflowIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Properties",
    url: "/properties",
    icon: (
      <LayoutDashboardIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Units & Rent-rolls",
    url: "/units-and-rent-rolls",
    icon: (
      <Building2Icon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "OPEX",
    url: "/opex",
    icon: (
      <TrendingDownIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "CAPEX",
    url: "/capex",
    icon: (
      <HammerIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Diligence",
    url: "/diligence",
    icon: (
      <MessageSquareIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Performance",
    beta: true,
    url: "/performance",
    icon: (
      <TrendingUpIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

const footerItems: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: (
      <SettingsIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Help",
    url: "/help",
    icon: (
      <MessageCircleQuestionMarkIcon className="size-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Icon className="size-6" />
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <SidebarLink
                  key={idx}
                  link={{
                    label: item.title,
                    href: item.url,
                    icon: item.icon,
                  }}
                />
              ))}
            </div>
          </div>
          <div>
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
                  <div className="relative size-6 flex shrink-0 items-center gap-2">
                    <Image
                      src="https://media.licdn.com/dms/image/v2/D4D03AQHUjH0mftm-9w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1718977943739?e=1767225600&v=beta&t=qcQSAZuYN6QJQfDIA4ddEQVQSVRQue2W-wpGwVBK0uU"
                      fill
                      className="w-full h-full object-contain shrink-0 rounded-full"
                      alt="Avatar"
                    />
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
  return (
    <div className="flex flex-1 p-2">
      <div className="p-2 md:p-10 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto no-scrollbar overscroll-y-contain">
        <div className="w-full max-w-4xl mx-auto">{children}</div>
      </div>
    </div>
  );
};
