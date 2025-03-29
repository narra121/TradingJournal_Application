"use client";

import { Column, Table } from "@tanstack/react-table"; // Import Column
import { X } from "lucide-react";
// Remove useSelector and RootState if no longer needed after removing options
// import { useSelector } from "react-redux";
// import { RootState } from "@/app/store";

import { Button } from "../../ui/button";
// Input seems unused, consider removing if not needed elsewhere
// import { Input } from "../../ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

// Remove imports for options/selectors as they are derived inside the filter component now
// import {
//   statuses,
//   sides,
//   symbolsSelector,
//   quantitiesSelector,
//   pnlRangesSelector,
// } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Trade } from "@/app/types"; // Import Trade
// Duplicate Table import removed from here

interface DataTableToolbarProps<TData> {
  // Remove 'extends Trade'
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  // Remove 'extends Trade'
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Remove useSelector calls for options derived inside the filter component
  // const symbols = useSelector(symbolsSelector);
  // const quantities = useSelector(quantitiesSelector);
  // const pnlRanges = useSelector(pnlRangesSelector);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 overflow-x-auto pb-2">
        {/* Status filter */}
        {/* Status filter */}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={
              table.getColumn("status") as unknown as Column<Trade, unknown>
            }
            title="Status"
            // options prop removed
          />
        )}

        {/* Open Date filter */}
        {table.getColumn("openDate") && (
          <DataTableFacetedFilter
            column={
              table.getColumn("openDate") as unknown as Column<Trade, unknown>
            }
            title="Open Date"
            // options prop removed
          />
        )}

        {/* Close Date filter */}
        {table.getColumn("closeDate") && (
          <DataTableFacetedFilter
            column={
              table.getColumn("closeDate") as unknown as Column<Trade, unknown>
            }
            title="Close Date"
            // options prop removed
          />
        )}

        {/* Side filter */}
        {table.getColumn("side") && (
          <DataTableFacetedFilter
            column={
              table.getColumn("side") as unknown as Column<Trade, unknown>
            }
            title="Side"
            // options prop removed
          />
        )}

        {/* Symbol filter */}
        {/* Remove length check as options are derived internally */}
        {table.getColumn("symbol") && (
          <DataTableFacetedFilter
            column={
              table.getColumn("symbol") as unknown as Column<Trade, unknown>
            }
            title="Symbol"
            // options prop removed
          />
        )}

        {/* Quantity filter */}
        {/* Remove length check as options are derived internally */}
        {table.getColumn("qty") && (
          <DataTableFacetedFilter
            column={table.getColumn("qty") as unknown as Column<Trade, unknown>}
            title="Quantity"
            // options prop removed
          />
        )}

        {/* PnL filter */}
        {/* Remove length check as options are derived internally */}
        {table.getColumn("pnl") && (
          <DataTableFacetedFilter
            column={table.getColumn("pnl") as unknown as Column<Trade, unknown>}
            title="PnL Range"
            // options prop removed
          />
        )}

        {/* Reset filters button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
