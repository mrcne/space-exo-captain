"use client"

import * as React from "react"
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  Table as TanStackTable,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const data: OIData[] = [
  { toipfx: 2018, pl_pnum: 1, tfopwg_disp: "CP", ra: 142.173446, dec: -12.167165, st_pmra: 0.105, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 1217, pl_pnum: 1, tfopwg_disp: "PC", ra: 45.462478, dec: -16.594496, st_pmra: 0.14, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 4937, pl_pnum: 1, tfopwg_disp: "PC", ra: 207.66961, dec: -48.807654, st_pmra: 0.093, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 4581, pl_pnum: 1, tfopwg_disp: "KP", ra: 297.333072, dec: 41.891119, st_pmra: 0.038, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 5016, pl_pnum: 1, tfopwg_disp: "FP", ra: 236.159176, dec: -58.128314, st_pmra: 0.029, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 620, pl_pnum: 1, tfopwg_disp: "CP", ra: 142.173446, dec: -12.167165, st_pmra: 0.105, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 455, pl_pnum: 1, tfopwg_disp: "CP", ra: 45.462478, dec: -16.594496, st_pmra: 0.14, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 7487, pl_pnum: 1, tfopwg_disp: "KP", ra: 351.135378, dec: -5.164145, st_pmra: 0.063, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 5139, pl_pnum: 1, tfopwg_disp: "PC", ra: 153.384453, dec: 19.948217, st_pmra: 0.053, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 3300, pl_pnum: 1, tfopwg_disp: "PC", ra: 246.034734, dec: -82.550772, st_pmra: 0.031, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 1563, pl_pnum: 1, tfopwg_disp: "PC", ra: 38.810203, dec: 48.273763, st_pmra: 0.083, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 1897, pl_pnum: 1, tfopwg_disp: "FP", ra: 48.370422, dec: 75.268379, st_pmra: 0.042, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0 },
  { toipfx: 3908, pl_pnum: 1, tfopwg_disp: "APC", ra: 206.782929, dec: 42.736035, st_pmra: 0.082, st_pmraerr1: 0.0, st_pmraerr2: 0.0, st_pmralim: 0.0, st_pmrasymer: 0.0}
];


export type Disposition = string;

// Object of Interest Data
export type OIData = {
  toipfx: number,
  pl_pnum: number,
  tfopwg_disp: Disposition,
  ra: number,
  dec: number,
  st_pmra: number,
  st_pmraerr1: number,
  st_pmraerr2: number,
  st_pmralim: number,
  st_pmrasymer: number,
};

export type FeatureDetails = {
  shortname?: string,
};
export type FeaturesRecord = Record<keyof OIData, FeatureDetails>;
export type FeaturesMap = Map<keyof OIData, FeatureDetails>;

const features: FeaturesMap = new Map([
  ["toipfx", { shortname: "Pref." }],
  ["pl_pnum", { shortname: "Pl." }],
  ["tfopwg_disp", { shortname: "Disp." }],
  ["ra", { shortname: "RA" }],
  ["dec", { shortname: "Dec" }],
  ["st_pmra", { shortname: "PMRA" }],
  ["st_pmraerr1", { shortname: "PMRA Err1" }],
  ["st_pmraerr2", { shortname: "PMRA Err2" }],
  ["st_pmralim", { shortname: "PMRA Lim" }],
]);

export type Props = {
  onSelect: (row: OIData) => void,
}

const ObjectsTable: React.FC<Props> = ({
  onSelect,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleCheckedChange = (row: Row<OIData>, table: TanStackTable<OIData>) => {
    table.setRowSelection({ [row.id]: true });
    onSelect(row.original);
  };

  const columns: ColumnDef<OIData>[] = [
    {
      id: "select",
      cell: ({ row, table }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={() => handleCheckedChange(row, table)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    ...features.entries().map(([key, obj]) => ({
      accessorKey: key,
      header: ({ column }: { column: Column<OIData, unknown> }) => {
        return (
          <Button
            type="button"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            { obj.shortname ? obj.shortname : key}
            { !!column.getIsSorted() && <ArrowUpDown /> }
          </Button>
        )
      },
      // I'm just a human
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: { row: any }) => <div className="lowercase">{row.getValue(key)}</div>,
    })),
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableMultiRowSelection: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ObjectsTable;
