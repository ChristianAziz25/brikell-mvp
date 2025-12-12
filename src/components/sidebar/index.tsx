"use client";
import { Icon } from "@/components/icon";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  FileCheckIcon,
  FileIcon,
  FolderIcon,
  HouseIcon,
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
      <HouseIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Flow",
    url: "/flow",
    icon: (
      <WorkflowIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "My assets",
    url: "/my-assets",
    icon: (
      <FolderIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Rent-roll",
    url: "/rent-roll",
    icon: (
      <FileIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Diligence",
    url: "/diligence",
    icon: (
      <FileCheckIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    title: "Performance",
    beta: true,
    url: "/performance",
    icon: (
      <TrendingUpIcon className="size-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
            <Icon />
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
            <SidebarLink
              link={{
                label: "Manu Arora",
                href: "#",
                icon: (
                  <Image
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
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
        {children}
      </div>
    </div>
  );
};
