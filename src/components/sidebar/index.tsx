"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  FileCheckIcon,
  FileIcon,
  FolderIcon,
  HouseIcon,
  WorkflowIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BreadCrumbsBar } from "../breadcrumbsBar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: HouseIcon,
  },
  {
    title: "Flow",
    url: "/flow",
    icon: WorkflowIcon,
  },
  {
    title: "My assets",
    url: "/my-assets",
    icon: FolderIcon,
  },
  {
    title: "Rent-roll",
    url: "/rent-roll",
    icon: FileIcon,
  },
  {
    title: "Diligence",
    url: "/diligence",
    icon: FileCheckIcon,
  },
];

function AppSidebar({ setOpen }: { setOpen?: (open: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex w-full items-center gap-2 rounded-xl bg-sidebar-accent/10 px-3 py-2">
          <div className="size-9 rounded-full bg-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Domly
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Real Estate OS
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4">
        <nav className="space-y-1 pb-4">
          {navItems.map((item) => {
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname.startsWith(item.url);

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  if (item.disabled) return;
                  router.push(item.url);
                  setOpen?.(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                  item.disabled &&
                    "cursor-not-allowed text-sidebar-foreground/40",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isFlow = pathname.startsWith("/flow");

  return (
    <div className="flex min-h-svh w-full flex-col">
      {/* Mobile header with menu button */}
      <header className="fixed z-50 top-0 h-16 left-0 w-full flex shrink-0 items-center gap-2 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="border border-gray-200" asChild>
            <Button
              variant="ghost"
              size="icon"
              className={
                "backdrop-blur-sm md:hidden size-10 hover:bg-sidebar-accent rounded-full"
              }
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 20H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
                <path
                  d="M4 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
                <path
                  d="M4 4H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-2/3 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <AppSidebar setOpen={setOpen} />
          </SheetContent>
        </Sheet>
      </header>

      <div
        className={cn(
          "flex-1 min-h-0 py-16 no-scrollbar overflow-y-auto",
          !isFlow && "px-4"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DesktopSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFlow = pathname.startsWith("/flow");
  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex h-full w-full"
      >
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={30}
          className="border-r border-sidebar-border bg-sidebar min-h-0"
        >
          <AppSidebar />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-sidebar-border" />
        <ResizablePanel defaultSize={75} minSize={70} className="min-h-0">
          <div className="flex h-full min-h-0 flex-col main-bg">
            <header className="flex h-14 items-center border-b px-6">
              <BreadCrumbsBar />
            </header>
            <main
              className={cn("flex-1 min-h-0 overflow-y-auto", !isFlow && "p-6")}
            >
              {children}
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar>{children}</MobileSidebar>;
  }

  return <DesktopSidebar>{children}</DesktopSidebar>;
}
