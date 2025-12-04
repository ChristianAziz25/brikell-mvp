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
    <div className="rounded-lg border bg-card">
      <div className="relative w-full overflow-auto no-scrollbar overscroll-x-contain">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {!noHeader &&
              table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50"
                >
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      // Skip rendering placeholder headers so parent headers
                      // visually span multiple rows instead of creating
                      // empty cells on the subheader row.
                      return null;
                    }

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
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
                  className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
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
                  className="border-t transition-colors data-[state=selected]:bg-muted hover:bg-muted/50"
                >
                  {leafGroup.headers.map((footer) => {
                    if (footer.isPlaceholder) {
                      return null;
                    }

                    return (
                      <td
                        key={footer.id}
                        colSpan={footer.colSpan}
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
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
