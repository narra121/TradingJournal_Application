import path from "path";
import Image from "next/image";
import { z } from "zod";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { taskSchema } from "./data/schema";
import { Trade, TradeDetails } from "@/app/types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { useEffect, useMemo, useState } from "react"; // Import useMemo
import { TradeJournalDialog } from "@/components/TradeJournalDialog";
import { TradeDetailsDialog } from "@/components/TradeDetailsDialogMain";
import { selectTradeDetails } from "@/app/selectors";
import { setSelectedItem } from "@/app/uiSlice";

function getTasks(data: TradeDetails[]): any {
  try {
    const tasks = data.filter(
      (item): item is TradeDetails => item !== undefined
    );
    const parsedTasks = z.array(taskSchema).parse(tasks);
    return parsedTasks;
  } catch (error) {
    console.error("Zod parsing error in getTasks:", error);
    return data.filter((item): item is TradeDetails => item !== undefined);
  }
}

export default function TaskPage() {
  const dispatch = useDispatch();
  const trades: TradeDetails[] = useSelector(selectTradeDetails);

  const isEditOpen = useSelector((state: RootState) => state.UI.isEditOpen);
  const selectedItem = useSelector(
    (state: RootState) => state.UI.selectedItem
  );

  const tasks = useMemo(() => getTasks(trades), [trades]);

  return (
    <>
      <DataTable data={tasks} columns={columns} />
      <TradeJournalDialog isOpen={isEditOpen} onClose={() => {}} trade={selectedItem} />
      {selectedItem && <TradeDetailsDialog isOpen={selectedItem !== null} onClose={() => dispatch(setSelectedItem(null))} trade={selectedItem} />}
    </>
  );
}
