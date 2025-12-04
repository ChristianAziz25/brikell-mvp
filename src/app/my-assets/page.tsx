"use client";

import { Button } from "@/components/ui/button";
import type { Prisma } from "@/generated/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Asset = Prisma.AssetGetPayload<{
  include: { tri: true; capex: true; opex: true };
}>;

type TableRow = {
  metric: string;
  [year: string]: string | number;
};

export default function MyAssets() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(`/api/assets`);
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
    // cache for 5 minutes and treat data as fresh during that time
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredAssetData = useMemo(
    () => assets?.filter((asset) => asset.name === selectedAsset) ?? [],
    [assets, selectedAsset]
  );

  return (
    <div>
      <div>
        {assets?.map((asset) => (
          <Button
            key={asset.id}
            variant="outline"
            className="w-full"
            onClick={() => setSelectedAsset(asset.name)}
          >
            <h1>{asset.name}</h1>
          </Button>
        ))}
      </div>
      {/* table */}
      <div></div>
    </div>
  );
}
