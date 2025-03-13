"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { taskSchema } from "../data/schema";
import { useDispatch } from "react-redux"; // Import useDispatch
import {
  setIsDetailsOpen,
  setIsEditOpen,
  setSelectedItem,
} from "@/app/uiSlice";
import {
  deleteTradeFromFirestore,
  TradeDetails,
  tradesSlice,
} from "@/app/traceSlice";
// Adjust path as needed
// Assuming TradeDetails is defined in your uiSlice, and import it

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original);
  const dispatch = useDispatch();

  const handleEdit = () => {
    // Assuming your row.original *is* a TradeDetails object
    // Type assertion to TradeDetails - Be *very* careful with this.  Ensure row.original is actually compatible.
    dispatch(setSelectedItem(row.original as unknown as TradeDetails));
    dispatch(setIsEditOpen(true));
  };

  const handleOpenDetails = () => {
    // Same assumption and type assertion as handleEdit
    dispatch(setSelectedItem(row.original as unknown as TradeDetails));
    dispatch(setIsDetailsOpen(true));
  };

  const handleDelete = () => {
    dispatch(
      tradesSlice.actions.deleteTrade(
        (row.original as unknown as TradeDetails).tradeId
      )
    );
    dispatch(
      deleteTradeFromFirestore(
        (row.original as unknown as TradeDetails).tradeId
      ) as any
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleOpenDetails}>
          Open Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
