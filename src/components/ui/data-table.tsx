
"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  defaultSorting?: { id: string; desc: boolean }[];
  filterableColumns?: {
    id: string;
    title: string;
    options?: { label: string; value: string }[];
    type?: 'select' | 'text';
    getValueFrom?: keyof TData | ((row: TData) => string);
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  isLoading = false,
  emptyMessage = "No data available",
  defaultSorting = [],
  filterableColumns = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Global filter state
  const [globalFilter, setGlobalFilter] = useState<string>("");
  
  // Custom filter functions for nested data
  const customFilterFns = {
    offerFilter: (row: any, columnId: string, filterValue: string) => {
      // For clicks table where offer is in row.offers.name
      if (columnId === 'offer' && row.original.offers) {
        return row.original.offers.name.toLowerCase().includes(filterValue.toLowerCase()) ||
               row.original.offers.id === filterValue;
      }
      
      // For conversions table where offer is in row.click.offers.name
      if (columnId === 'offer' && row.original.click && row.original.click.offers) {
        return row.original.click.offers.name.toLowerCase().includes(filterValue.toLowerCase()) ||
               row.original.click.offers.id === filterValue;
      }
      
      return false;
    },
  };
  
  // Setup filter function for the table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    enableGlobalFilter: true,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    filterFns: {
      ...customFilterFns,
    },
  });

  // Apply custom pre-filtering for special cases like nested objects
  const preFilteredData = table.getFilteredRowModel().rows;

  return (
    <div>
      {filterableColumns.length > 0 && (
        <div className="flex flex-wrap gap-2 py-4">
          {filterableColumns.map((column) => (
            <div key={column.id} className="flex gap-1 items-center">
              <label htmlFor={`filter-${column.id}`} className="text-sm font-medium">
                {column.title}:
              </label>
              
              {column.type === 'text' ? (
                <Input
                  id={`filter-${column.id}`}
                  value={(table.getColumn(column.id)?.getFilterValue() as string) || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // For nested data like offers, we need a custom approach
                    if (column.id === 'offer') {
                      // Use our custom filter function
                      table.getColumn(column.id)?.setFilterValue(value);
                    } else {
                      // Normal filtering
                      table.getColumn(column.id)?.setFilterValue(value);
                    }
                  }}
                  className="max-w-sm h-8 text-sm"
                  placeholder={`Filter by ${column.title.toLowerCase()}`}
                />
              ) : (
                <select
                  id={`filter-${column.id}`}
                  value={(table.getColumn(column.id)?.getFilterValue() as string) || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // For nested data like offers
                    if (column.id === 'offer') {
                      // Use our custom filter function
                      table.getColumn(column.id)?.setFilterValue(value);
                    } else {
                      // Normal filtering
                      table.getColumn(column.id)?.setFilterValue(value || undefined);
                    }
                  }}
                  className="p-1 text-sm border rounded-md"
                >
                  <option value="">All</option>
                  {column.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-medium"
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <div className="ml-1">
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : preFilteredData.length ? (
              preFilteredData.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {preFilteredData.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
