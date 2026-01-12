import {
  flexRender,
  type RowData,
  type Table as TableInstance,
} from "@tanstack/react-table";

interface TableProp<TData extends RowData> {
  table: TableInstance<TData>;
  columnCount: number;
  isLoading: boolean;
  noHeader?: boolean;
}

export function Table<TData extends RowData>({
  table,
  columnCount,
  isLoading,
  noHeader = false,
}: TableProp<TData>) {
  const rows = table.getRowModel().rows;
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="relative w-full overflow-auto no-scrollbar overscroll-x-contain">
        <table className="w-full caption-bottom text-sm table-fixed">
          <thead className="bg-muted/20">
            {!noHeader &&
              table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border/40"
                >
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      return null;
                    }

                    const columnMeta = header.column.columnDef.meta as
                      | {
                          isYearGroup?: boolean;
                          yearIndex?: number;
                          isFirstInGroup?: boolean;
                        }
                      | undefined;
                    const isYearGroupFirst =
                      columnMeta?.isYearGroup &&
                      columnMeta?.isFirstInGroup &&
                      columnMeta?.yearIndex !== undefined &&
                      columnMeta.yearIndex > 0;

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.column.getSize() }}
                        className={`h-12 px-5 align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider [&:has([role=checkbox])]:pr-0 ${
                          isYearGroupFirst ? "border-l border-border/30" : ""
                        }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No properties found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/30 transition-colors hover:bg-muted/10"
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnMeta = cell.column.columnDef.meta as
                      | {
                          isYearGroup?: boolean;
                          yearIndex?: number;
                          isFirstInGroup?: boolean;
                        }
                      | undefined;
                    const isYearGroupFirst =
                      columnMeta?.isYearGroup &&
                      columnMeta?.isFirstInGroup &&
                      columnMeta?.yearIndex !== undefined &&
                      columnMeta.yearIndex > 0;

                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`py-4 px-5 align-middle text-sm [&:has([role=checkbox])]:pr-0 ${
                          isYearGroupFirst ? "border-l border-border/30" : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-muted/10">
            {(() => {
              const footerGroups = table.getFooterGroups();
              const leafGroup = footerGroups[footerGroups.length - 1];

              if (!leafGroup) return null;

              const hasAnyFooter = table
                .getAllLeafColumns()
                .some((column) => column.columnDef.footer !== undefined);

              if (!hasAnyFooter) return null;

              return (
                <tr
                  key={leafGroup.id}
                  className="border-t border-border/40"
                >
                  {leafGroup.headers.map((footer) => {
                    if (footer.isPlaceholder) {
                      return null;
                    }

                    const columnMeta = footer.column.columnDef.meta as
                      | {
                          isYearGroup?: boolean;
                          yearIndex?: number;
                          isFirstInGroup?: boolean;
                        }
                      | undefined;

                    const parentColumn = footer.column.parent;
                    const parentMeta = parentColumn?.columnDef.meta as
                      | {
                          isYearGroup?: boolean;
                          yearIndex?: number;
                          isFirstInGroup?: boolean;
                        }
                      | undefined;

                    const isYearGroupFirst =
                      (columnMeta?.isYearGroup &&
                        columnMeta?.isFirstInGroup &&
                        columnMeta?.yearIndex !== undefined &&
                        columnMeta.yearIndex > 0) ||
                      (parentMeta?.isYearGroup &&
                        parentMeta?.yearIndex !== undefined &&
                        parentMeta.yearIndex > 0 &&
                        (footer.id?.includes("-actual") ||
                          footer.column.id?.includes("-actual")));

                    return (
                      <td
                        key={footer.id}
                        colSpan={footer.colSpan}
                        className={`h-12 px-5 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${
                          isYearGroupFirst ? "border-l border-border/30" : ""
                        }`}
                      >
                        {flexRender(
                          footer.column.columnDef.footer,
                          footer.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
