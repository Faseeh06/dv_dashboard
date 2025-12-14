"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { type DataRecord } from '@/lib/loadData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'


const formatValue = (value: number | null): string => {
  if (value === null) return '—'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(2)
}

const columns: ColumnDef<DataRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[150px]" title={row.original.country}>
        {row.original.country}
      </div>
    ),
    enableHiding: false,
    size: 150,
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.original.year ?? '—'}</div>
    ),
    size: 80,
  },
  {
    accessorKey: "urbanPopPerc",
    header: () => <div className="w-full text-right">Urban Pop %</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.urbanPopPerc)}</div>
    ),
    size: 110,
  },
  {
    accessorKey: "agValueAdded",
    header: () => <div className="w-full text-right">Agriculture % GDP</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.agValueAdded)}</div>
    ),
    size: 130,
  },
  {
    accessorKey: "renEnergyConsPerc",
    header: () => <div className="w-full text-right">Renewable Energy %</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.renEnergyConsPerc)}</div>
    ),
    size: 140,
  },
  {
    accessorKey: "cleanCookingAccess",
    header: () => <div className="w-full text-right">Clean Cooking %</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.cleanCookingAccess)}</div>
    ),
    size: 130,
  },
  {
    accessorKey: "giniCoefficient",
    header: () => <div className="w-full text-right">Gini Coefficient</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.giniCoefficient)}</div>
    ),
    size: 130,
  },
  {
    accessorKey: "homicideRate",
    header: () => <div className="w-full text-right">Homicide Rate</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.homicideRate)}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "safetyAndSecurity",
    header: () => <div className="w-full text-right">Safety & Security</div>,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{formatValue(row.original.safetyAndSecurity)}</div>
    ),
    size: 140,
  },
  {
    accessorKey: "clusterLabel",
    header: "Cluster",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5 whitespace-nowrap">
        {row.original.clusterLabel}
      </Badge>
    ),
    size: 120,
  },
]


export function DataTable({
  data: initialData,
}: {
  data: DataRecord[]
}) {
  // Filter out invalid records (empty country names, summary text, etc.)
  const [data] = React.useState(() => {
    return initialData.filter((record) => {
      // Must have a valid country name (not empty, not summary text)
      if (!record.country || record.country.trim() === '') return false
      
      // Filter out rows that look like summary/analysis text
      const countryLower = record.country.toLowerCase()
      const invalidPatterns = [
        'ultra-urban',
        'average',
        'summary',
        'total',
        'analysis',
        'carbon damage',
        'countries',
        'threshold',
        'unlabeled (ultra-urban)',
      ]
      
      if (invalidPatterns.some(pattern => countryLower.includes(pattern))) {
        return false
      }
      
      // Must have a valid year
      if (record.year == null || isNaN(record.year)) return false
      
      // Country name should be reasonable length (not too long, likely a summary)
      if (record.country.length > 50) return false
      
      return true
    })
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => `${row.country}-${row.year}-${index}`,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="overflow-x-auto rounded-lg border w-full">
          <Table className="w-full min-w-[1200px]">
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan}
                        className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                        style={{ minWidth: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto' }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="px-4 py-3 text-sm overflow-hidden"
                        style={{ 
                          minWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                          maxWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'none'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

