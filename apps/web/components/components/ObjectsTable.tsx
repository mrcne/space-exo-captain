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

import testingData from "../../data/pipeline/data/testing.json";
const data: OIData[] = (testingData as unknown as OIData[]);

export type Disposition = string;

// Object of Interest Data
export type OIData = {
  // Basic identifiers
  toi?: number,
  toipfx?: number,
  tid?: number,
  ctoi_alias?: string,

  // Coordinates
  rastr?: string,
  ra?: number,
  decstr?: string,
  dec?: number,

  // Proper motion
  st_pmra?: number,
  st_pmraerr1?: number,
  st_pmraerr2?: number,
  st_pmralim?: number,
  st_pmrasymerr?: number,
  st_pmdec?: number,
  st_pmdecerr1?: number,
  st_pmdecerr2?: number,
  st_pmdeclim?: number,
  st_pmdecsymerr?: number,

  // Planet params
  pl_pnum?: number,
  tfopwg_disp?: Disposition,
  pl_tranmid?: number,
  pl_tranmiderr1?: number,
  pl_tranmiderr2?: number,
  pl_tranmidlim?: number,
  pl_tranmidsymerr?: number,
  pl_orbper?: number,
  pl_orbpererr1?: number,
  pl_orbpererr2?: number,
  pl_orbperlim?: number,
  pl_orbpersymerr?: number,
  pl_trandurh?: number,
  pl_trandurherr1?: number,
  pl_trandurherr2?: number,
  pl_trandurhlim?: number,
  pl_trandurhsymerr?: number,
  pl_trandep?: number,
  pl_trandeperr1?: number,
  pl_trandeperr2?: number,
  pl_trandeplim?: number,
  pl_trandepsymerr?: number,
  pl_rade?: number,
  pl_radeerr1?: number,
  pl_radeerr2?: number,
  pl_radelim?: number,
  pl_radesymerr?: number,
  pl_insol?: number,
  pl_eqt?: number,

  // Stellar params
  st_tmag?: number,
  st_tmagerr1?: number,
  st_tmagerr2?: number,
  st_tmaglim?: number,
  st_tmagsymerr?: number,
  st_dist?: number,
  st_disterr1?: number,
  st_disterr2?: number,
  st_distlim?: number,
  st_distsymerr?: number,
  st_teff?: number,
  st_tefferr1?: number,
  st_tefferr2?: number,
  st_tefflim?: number,
  st_teffsymerr?: number,
  st_logg?: number,
  st_loggerr1?: number,
  st_loggerr2?: number,
  st_logglim?: number,
  st_loggsymerr?: number,
  st_rad?: number,
  st_raderr1?: number,
  st_raderr2?: number,
  st_radlim?: number,
  st_radsymerr?: number,

  // Metadata
  toi_created?: string,
  rowupdate?: string,
};

export type FeatureDetails = {
  name?: string,
  shortname?: string,
};
export type FeaturesRecord = Record<keyof OIData, FeatureDetails>;
export type FeaturesMap = Map<keyof OIData, FeatureDetails>;

const featuresFull: FeaturesMap = new Map([
  ["tfopwg_disp", { name: "TFOPWG Disposition", shortname: "Disp." }],
  ["toi", { name: "TESS Object of Interest", shortname: "TOI" }],
  ["toipfx", { name: "TESS Object of Interest Prefix", shortname: "TOI Pfx" }],
  ["tid", { name: "TESS Input Catalog ID", shortname: "TIC ID" }],
  ["ctoi_alias", { name: "Community TESS Object of Interest Alias", shortname: "CTOI" }],
  ["pl_pnum", { name: "Number of Planet Candidates", shortname: "Pl.#" }],
  ["rastr", { name: "RA [sexagesimal]", shortname: "RA (sex)" }],
  ["ra", { name: "RA [deg]", shortname: "RA" }],
  ["decstr", { name: "Dec [sexagesimal]", shortname: "Dec (sex)" }],
  ["dec", { name: "Dec [deg]", shortname: "Dec" }],
  ["st_pmra", { name: "PMRA [mas/yr]", shortname: "PMRA" }],
  ["st_pmdec", { name: "PMDec [mas/yr]", shortname: "PMDec" }],
  ["pl_tranmid", { name: "Planet Transit Midpoint [BJD]", shortname: "TranMid" }],
  ["pl_orbper", { name: "Planet Orbital Period [days]", shortname: "Period" }],
  ["pl_trandurh", { name: "Planet Transit Duration [hours]", shortname: "Dur(h)" }],
  ["pl_trandep", { name: "Planet Transit Depth [ppm]", shortname: "Depth" }],
  ["pl_rade", { name: "Planet Radius [R_Earth]", shortname: "R_E" }],
  ["pl_insol", { name: "Planet Insolation [Earth flux]", shortname: "Insol." }],
  ["pl_eqt", { name: "Planet Equilibrium Temperature [K]", shortname: "Teq" }],
  ["st_tmag", { name: "TESS Magnitude", shortname: "Tmag" }],
  ["st_dist", { name: "Stellar Distance [pc]", shortname: "Dist" }],
  ["st_teff", { name: "Stellar Effective Temperature [K]", shortname: "Teff" }],
  ["st_logg", { name: "Stellar log(g) [cm/s**2]", shortname: "log g" }],
  ["st_rad", { name: "Stellar Radius [R_Sun]", shortname: "R_Sun" }],
  ["toi_created", { name: "TOI Creation Date", shortname: "TOI Created" }],
  ["rowupdate", { name: "Date of Last Update", shortname: "Updated" }],
]);

const featuresMini: FeaturesMap = new Map([
  ["tfopwg_disp", { name: "TFOPWG Disposition", shortname: "Di." }],
  ["pl_orbper", { name: "Planet Orbital Period [days]", shortname: "Per." }],
  ["pl_trandurh", { name: "Planet Transit Duration [hours]", shortname: "Dur." }],
]);

export type Props = {
  onSelect: (row: OIData) => void,
  minimal?: boolean,
}

const ObjectsTable: React.FC<Props> = ({
  onSelect,
  minimal = false,
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

  const features = minimal ? featuresMini : featuresFull;

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default ObjectsTable;
