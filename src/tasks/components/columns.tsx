"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";

import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";

import { DollarSign } from "lucide-react";
// Assuming you have similar data structures for statuses, etc.
// You might need to create these if they don't exist.
import { statuses } from "../data/data"; // Example, adjust as needed
//import { Trade } from "../data/schema"; // Assuming you have a Trade schema
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { TradeDetails } from "@/app/traceSlice";

export const columns: ColumnDef<TradeDetails>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // {
  //   accessorKey: "tradeId",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Trade ID" />
  //   ),
  //   cell: ({ row }) => (
  //     <div className="w-[80px]">{row.getValue("tradeId")}</div>
  //   ),
  //   enableSorting: true, // Trade ID should likely be sortable
  //   enableHiding: false,
  // },
  {
    accessorKey: "openDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Open Date" />
    ),
    cell: ({ row }) => {
      const dateString = row.getValue("openDate") as string;
      const date = parseISO(dateString);
      const formattedDate = format(date, "dd MMM yyyy");
      return <div className="font-semibold">{formattedDate}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "closeDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Close Date" />
    ),
    cell: ({ row }) => <div>{row.getValue("closeDate")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {(row.getValue("symbol") as String).toLocaleUpperCase()}
      </Badge>
    ), // Example formatting
    enableSorting: true,
  },
  {
    accessorKey: "side",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Side" />
    ),
    cell: ({ row }) => {
      const side = row.getValue("side");
      return (
        <Badge variant="outline">{(side as String).toLocaleUpperCase()}</Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "entry",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry Price" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("entry"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="">{formatted}</div>;
    }, // Format as currency
    enableSorting: true,
  },
  {
    accessorKey: "exit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exit Price" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("exit"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="">{formatted}</div>;
    }, // Format as currency
    enableSorting: true,
  },
  {
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
    cell: ({ row }) => <div>{row.getValue("qty") + " Lots"}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "pnl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PnL" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("pnl"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-semibold">{formatted}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge variant="outline">
          {(status as String).toLocaleUpperCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
  },

  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
