export type PropertyStatus = "No interest" | "Interested" | "Rented Out";

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  type: string;
  area: string;
  rent: string;
}

