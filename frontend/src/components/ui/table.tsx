'use client';

import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import EmptyState from '@/components/ui/empty-state';

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type SimpleTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  mobileTitleKey?: string;
  emptyMessage?: string;
};

export default function SimpleTable<T extends Record<string, any>>({
  columns,
  data,
  mobileTitleKey,
  emptyMessage,
}: SimpleTableProps<T>) {
  const columnDefs = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: () => column.header,
        cell: ({ row }) => (
          <div className={column.className}>
            {column.render ? column.render(row.original) : row.original[column.key]}
          </div>
        ),
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0 && emptyMessage) {
    return <EmptyState title={emptyMessage} />;
  }

  const inferredTitleKey = mobileTitleKey || columns[0]?.key;
  const titleColumn = columns.find((column) => column.key === inferredTitleKey);

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-card border border-border bg-card lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-surface/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {data.map((row, index) => (
          <div key={index} className="rounded-card border border-border bg-card p-4">
            {titleColumn && (
              <div className="mb-3 border-b border-border pb-3 text-sm font-semibold text-foreground">
                {titleColumn.render ? titleColumn.render(row) : row[titleColumn.key]}
              </div>
            )}
            <div className="space-y-3">
              {columns
                .filter((column) => column.key !== inferredTitleKey)
                .map((column) => (
                  <div key={column.key} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{column.header}</span>
                    <div className="text-sm text-foreground">{column.render ? column.render(row) : row[column.key]}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
