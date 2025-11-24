import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

import type { Property } from "../types";
import { getStatusBadgeVariant } from "../utils";

interface UnitCardViewProps {
  properties: Property[];
  isLoading: boolean;
}

export function UnitCardView({ properties, isLoading }: UnitCardViewProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading cards...
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No properties found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => {
        const variant = getStatusBadgeVariant(property.status);
        return (
          <Card key={property.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                {property.address}
              </CardTitle>
              <Badge
                variant="outline"
                className={`${variant.className} text-xs font-medium`}
              >
                {property.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Type</span>
                <span>{property.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Area</span>
                <span>{property.area}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Rent</span>
                <span>{property.rent}</span>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
