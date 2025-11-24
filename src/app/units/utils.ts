import type { PropertyStatus } from "./types";

export const getStatusBadgeVariant = (status: PropertyStatus) => {
  switch (status) {
    case "Rented Out":
      return { className: "bg-foreground text-background border-0" };
    case "Interested":
      return {
        className: "bg-background text-foreground border border-border",
      };
    default:
      return {
        className: "bg-muted text-muted-foreground border border-border",
      };
  }
};

