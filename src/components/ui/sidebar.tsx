"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React, { createContext, useContext, useState } from "react";
import { Badge } from "./badge";

interface Links {
  label: string;
  href: string;
  icon: React.ReactElement | React.ReactNode;
  beta?: boolean;
  divider?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-5 pt-6 hidden md:flex md:flex-col bg-card dark:bg-neutral-800 w-[280px] shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "64px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-12 px-4 py-3 flex flex-row md:hidden items-center justify-between bg-card dark:bg-neutral-800 w-full border-b border-border/40"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="size-5 text-foreground dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-card dark:bg-neutral-900 p-10 z-100 flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-foreground dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X className="size-5" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const displayType = link.beta ? "flex" : "inline-block";

  // Check if the link is active (safely handle null pathname)
  const isActive = pathname
    ? link.href === "/"
      ? pathname === "/"
      : pathname.startsWith(link.href)
    : false;

  return (
    <>
      <Link
        href={link.href}
        className={cn(
          "flex items-center group/sidebar px-3 py-2.5 gap-3 rounded-xl transition-all duration-200",
          isActive
            ? "bg-muted/80 dark:bg-neutral-700"
            : "hover:bg-muted/50 dark:hover:bg-neutral-700/50",
          className
        )}
        {...props}
      >
        {link.icon}
        <motion.span
          initial={false}
          animate={{
            display: animate ? (open ? displayType : "none") : displayType,
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className={cn(
            "text-foreground/80 dark:text-neutral-200 text-[13px] font-normal group-hover/sidebar:translate-x-0.5 transition duration-200 whitespace-pre p-0! m-0!",
            link.beta ? "flex flex-row items-center" : "inline-block",
            "leading-none",
            isActive && "text-foreground font-medium"
          )}
        >
          {link.label}
          {link.beta && (
            <Badge
              variant="outline"
              className="ml-2 text-[9px] text-muted-foreground dark:text-neutral-400 leading-none shrink-0 border-border/50"
            >
              Beta
            </Badge>
          )}
        </motion.span>
      </Link>
      {link.divider && (
        <div className="h-px my-3 w-full bg-border/40 dark:bg-neutral-700 shrink-0" />
      )}
    </>
  );
};
