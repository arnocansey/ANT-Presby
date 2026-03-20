'use client';

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

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
};

export default function SimpleTable<T extends Record<string, any>>({
  columns,
  data,
  mobileTitleKey,
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

  const inferredTitleKey = mobileTitleKey || columns[0]?.key;

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-800 lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-100/80 dark:bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/80"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 align-top text-ui-muted">
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
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-800"
          >
            {inferredTitleKey && (
              <div className="mb-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {columns.find((column) => column.key === inferredTitleKey)?.render
                    ? columns.find((column) => column.key === inferredTitleKey)?.render?.(row)
                    : row[inferredTitleKey]}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {columns
                .filter((column) => column.key !== inferredTitleKey)
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-subtle">
                      {column.header}
                    </span>
                    <div className="text-sm text-ui-muted">
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
