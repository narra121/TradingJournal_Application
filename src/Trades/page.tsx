import path from "path";
import Image from "next/image";
import { z } from "zod";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { taskSchema } from "./data/schema";
import { Trade, TradeDetails } from "@/app/traceSlice"; // Import Trade type
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { useEffect, useMemo, useState } from "react"; // Import useMemo
import { TradeJournalDialog } from "@/components/TradeJournalDialog";
import { TradeDetailsDialog } from "@/components/TradeDetailsDialog";
// import { set } from "date-fns"; // Seems unused
import { selectTradeDetails } from "@/app/selectors"; // Import the memoized selector
import {
  setSelectedItem,
  // toggleDetailsOpen, // Seems unused
  // toggleEditOpen, // Seems unused
} from "@/app/uiSlice";

// Simulate a database read for tasks.
// TODO: Review if taskSchema and this parsing are still relevant or need adjustment
function getTasks(data: TradeDetails[]): any {
  try {
    const tasks = data.filter(
      (item): item is TradeDetails => item !== undefined
    );
    // Ensure the data structure matches taskSchema before parsing
    // This might need adjustment based on the actual structure vs schema
    const parsedTasks = z.array(taskSchema).parse(tasks);
    return parsedTasks;
  } catch (error) {
    console.error("Zod parsing error in getTasks:", error);
    // Return the raw data or an empty array in case of parsing failure
    return data.filter((item): item is TradeDetails => item !== undefined);
  }
}

export default function TaskPage() {
  const dispatch = useDispatch();
  // Use the memoized selector to get trade details
  const trades: TradeDetails[] = useSelector(selectTradeDetails);

  // Use useEffect to dispatch setSelectedItem after render and when trades change
  useEffect(() => {
    if (trades.length > 0) {
      // Optionally check if selectedItem needs updating to avoid unnecessary dispatches
      // const currentSelectedItem = store.getState().UI.selectedItem; // Need direct store access or pass selectedItem down
      // if (!currentSelectedItem || currentSelectedItem.tradeId !== trades[0].tradeId) {
      dispatch(setSelectedItem(trades[0]));
      // }
    }
    // Add dependencies: dispatch and trades array reference
  }, [dispatch, trades]);

  // These selectors seem fine as they select primitive/stable values
  const isEditOpen = useSelector((state: RootState) => state.UI.isEditOpen);
  const selectedItem = useSelector((state: RootState) => state.UI.selectedItem);

  // Memoize the result of getTasks
  const tasks = useMemo(() => getTasks(trades), [trades]);

  return (
    // Cast data to DataTable's expected type if necessary, assuming TradeDetails matches TData
    // The DataTable component expects TData extends Trade, but columns use TradeDetails.
    // This might indicate a mismatch. Assuming tasks (derived from TradeDetails) is compatible for now.
    <>
      {/* Pass tasks directly, removing the incorrect cast */}
      <DataTable data={tasks} columns={columns} />
      <TradeJournalDialog />
      <TradeDetailsDialog />
    </>
  );
}
