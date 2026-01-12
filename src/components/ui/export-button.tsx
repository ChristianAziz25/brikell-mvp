"use client";

import { Download } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { exportToCSV, exportToXLS, type ExportData } from "@/lib/export";

interface ExportButtonProps {
  data: ExportData;
  filename: string;
  className?: string;
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
  const handleExportCSV = () => {
    exportToCSV(data, filename);
  };

  const handleExportXLS = () => {
    exportToXLS(data, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground hover:text-foreground ${className || ""}`}
          title="Export data"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <span className="text-sm">Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportXLS} className="cursor-pointer">
          <span className="text-sm">Export as XLS</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
