"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, isValid, startOfDay } from "date-fns"; // Import isValid and startOfDay

import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn utility
// Assuming you have similar data structures for statuses, etc.
// You might need to create these if they don't exist.
import { statuses } from "../data/data"; // Example, adjust as needed
//import { Trade } from "../data/schema"; // Assuming you have a Trade schema
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Trade, TradeDetails } from "@/app/traceSlice"; // Import Trade

// Change definition to use Trade type
export const columns: ColumnDef<TradeDetails>[] = [
  {
    // No accessorKey needed, id is fine
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
    id: "openDate", // Explicit ID
    accessorKey: "openDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Open Date" />
    ),
    cell: ({ row }) => {
      const dateString = row.getValue("openDate") as string | undefined; // Allow undefined
      // Check if dateString exists before parsing
      if (!dateString) {
        return <div className="font-semibold text-muted-foreground">-</div>;
      }
      let date = parseISO(dateString);

      // Check validity
      if (!isValid(date)) {
        // If invalid, try parsing as just a date (might lack time) or default
        date = new Date(dateString); // Fallback parsing
        if (!isValid(date)) {
          return (
            <div className="font-semibold text-muted-foreground">
              Invalid Date
            </div>
          ); // Handle completely invalid dates
        }
        // If date part is valid but time might be missing, default to start of day
        date = startOfDay(date);
      }

      // Check if the original string contained time info (e.g., includes 'T' or ':')
      const hasTime = dateString?.includes("T") || dateString?.includes(":");
      const formatString = hasTime
        ? "dd MMM yyyy, HH:mm:ss"
        : "dd MMM yyyy, 00:00:00";
      const formattedDate = format(date, formatString);

      return <div className="font-semibold">{formattedDate}</div>;
    },
    enableSorting: true,
    // Filter function for date columns (compares date part only)
    filterFn: (row, columnId, value: string[]) => {
      // Use columnId
      if (!value || value.length === 0) return true;
      const dateString = row.getValue(columnId) as string | undefined; // Allow undefined
      if (!dateString) return false; // Don't include rows with no date if filtering by date

      let date = parseISO(dateString);
      if (!isValid(date)) {
        date = new Date(dateString); // Fallback parsing
      }
      if (!isValid(date)) return false; // Don't include invalid dates in results

      const rowDateFormatted = format(startOfDay(date), "yyyy-MM-dd"); // Compare date part
      return value.includes(rowDateFormatted);
    },
  },
  {
    id: "closeDate", // Explicit ID
    accessorKey: "closeDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Close Date" />
    ),
    cell: ({ row }) => {
      const dateString = row.getValue("closeDate") as string | undefined; // Allow undefined

      // Handle potentially empty or null close dates
      if (!dateString) {
        return <div className="text-muted-foreground">-</div>;
      }

      let date = parseISO(dateString);

      if (!isValid(date)) {
        date = new Date(dateString);
        if (!isValid(date)) {
          return <div className="text-muted-foreground">Invalid Date</div>;
        }
        date = startOfDay(date);
      }

      const hasTime = dateString?.includes("T") || dateString?.includes(":");
      const formatString = hasTime
        ? "dd MMM yyyy, HH:mm:ss"
        : "dd MMM yyyy, 00:00:00";
      const formattedDate = format(date, formatString);

      return <div>{formattedDate}</div>;
    },
    enableSorting: true,
    // Filter function for date columns (compares date part only)
    filterFn: (row, columnId, value: string[]) => {
      // Use columnId
      if (!value || value.length === 0) return true;
      const dateString = row.getValue(columnId) as string | undefined; // Allow undefined

      // Handle empty close dates - don't filter them out if no specific date is selected
      if (!dateString) return false; // If filtering by date, exclude rows with no close date

      let date = parseISO(dateString);
      if (!isValid(date)) {
        date = new Date(dateString); // Fallback parsing
      }
      if (!isValid(date)) return false; // Don't include invalid dates

      const rowDateFormatted = format(startOfDay(date), "yyyy-MM-dd"); // Compare date part
      return value.includes(rowDateFormatted);
    },
  },
  {
    id: "symbol", // Explicit ID
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string | undefined;
      return (
        <Badge variant="outline">
          {/* Use optional chaining */}
          {symbol?.toLocaleUpperCase() ?? "-"}
        </Badge>
      );
    },
    enableSorting: true,
    // Use the standard function for array inclusion
    filterFn: "arrIncludesSome",
  },
  {
    id: "side", // Explicit ID
    accessorKey: "side",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Side" />
    ),
    cell: ({ row }) => {
      const side = row.getValue("side") as string | undefined;
      return (
        <Badge variant="outline">{side?.toLocaleUpperCase() ?? "-"}</Badge>
      );
    },
    enableSorting: true,
    // Use the standard function for array inclusion
    filterFn: "arrIncludesSome",
  },
  {
    id: "entry", // Explicit ID
    accessorKey: "entry",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry Price" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("entry") as number | undefined; // Cast to expected type
      // Check if amount is a valid number before formatting
      const formattedAmount =
        typeof amount === "number" && !isNaN(amount) // Add isNaN check
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
          : "-";

      return <div className="">{formattedAmount}</div>;
    }, // Format as currency
    enableSorting: true,
  },
  {
    id: "exit", // Explicit ID
    accessorKey: "exit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exit Price" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("exit") as number | undefined; // Cast to expected type
      const formattedAmount =
        typeof amount === "number" && !isNaN(amount) // Add isNaN check
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
          : "-";

      return <div className="">{formattedAmount}</div>;
    }, // Format as currency
    enableSorting: true,
  },
  {
    id: "qty", // Explicit ID
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
    cell: ({ row }) => {
      const qty = row.getValue("qty");
      return <div>{typeof qty === "number" ? `${qty} Lots` : "-"}</div>;
    },
    enableSorting: true,
    // Use the standard function for array inclusion
    filterFn: "arrIncludesSome",
  },
  {
    id: "pnl", // Explicit ID
    accessorKey: "pnl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PnL" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("pnl") as number | undefined; // Cast to expected type
      const formattedAmount =
        typeof amount === "number" && !isNaN(amount) // Add isNaN check
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)
          : "-";

      // Determine text color based on PnL value
      const pnlColor =
        typeof amount === "number" && !isNaN(amount)
          ? amount > 0
            ? "text-green-600"
            : amount < 0
            ? "text-red-600"
            : "text-yellow-600" // Yellow for break-even
          : ""; // Default color if not a valid number

      return (
        <div className={cn("font-semibold", pnlColor)}>{formattedAmount}</div>
      );
    },
    enableSorting: true,
    // Adjust filterFn to check if the stringified PnL value is in the selected array
    filterFn: (row, columnId, value) => {
      // Use columnId
      if (!value || value.length === 0) return true;
      const pnlValue = row.getValue(columnId);
      // Ensure pnlValue is not null/undefined before converting to string
      return pnlValue !== null && pnlValue !== undefined
        ? value.includes(String(pnlValue))
        : false;
    },
  },
  {
    id: "status", // Explicit ID
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string | undefined;
      return (
        <Badge variant="outline">{status?.toLocaleUpperCase() ?? "-"}</Badge>
      );
    },
    // Use the standard function for array inclusion
    filterFn: "arrIncludesSome",
    enableSorting: true,
  },

  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
