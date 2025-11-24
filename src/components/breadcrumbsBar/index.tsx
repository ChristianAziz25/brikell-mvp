"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { Fragment } from "react";

const fixedProtectedRoutes = [
  "flow",
  "rent-roll",
  "diligence",
  "units",
  "my-assets",
];

export function BreadCrumbsBar() {
  const segments = useSelectedLayoutSegments();
  const router = useRouter();

  const cleanedSegments = segments.filter((segment) =>
    fixedProtectedRoutes.includes(segment)
  );

  return (
    <Breadcrumb
      className={cn("flex flex-row items-center justify-start gap-1")}
    >
      {cleanedSegments.map((segment, index) => (
        <Fragment key={index}>
          <BreadcrumbItem className={cn("list-none")}>
            <BreadcrumbLink
              onClick={() =>
                router.push(`/${cleanedSegments.slice(0, index + 1).join("/")}`)
              }
              className={cn(
                index === cleanedSegments.length - 1
                  ? "pointer-events-none"
                  : "cursor-pointer"
              )}
            >
              <h1 className="text-sm font-semibold">
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </h1>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {index < cleanedSegments.length - 1 && (
            <BreadcrumbSeparator className="list-none text-neutral-500" />
          )}
        </Fragment>
      ))}
    </Breadcrumb>
  );
}
