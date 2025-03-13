import path from "path";
import Image from "next/image";
import { z } from "zod";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { taskSchema } from "./data/schema";
import { TradeDetails } from "@/app/traceSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { useState } from "react";
import { TradeJournalDialog } from "@/components/TradeJournalDialog";
import { TradeDetailsDialog } from "@/components/TradeDetailsDialog";
import { set } from "date-fns";
import {
  setSelectedItem,
  toggleDetailsOpen,
  toggleEditOpen,
} from "@/app/uiSlice";

// Simulate a database read for tasks.
function getTasks(data: TradeDetails[]): any {
  const tasks = data.filter((item) => item !== undefined);

  const a = z.array(taskSchema).parse(tasks);
  return a;
}

export default function TaskPage() {
  const dispatch = useDispatch();
  const trades: TradeDetails[] = useSelector((state: RootState) => {
    const data = state.TradeData.trades.map((trade) => trade.trade);
    if (data.length === 0) {
      return data;
    }
    dispatch(setSelectedItem(data[0]));
    return data;
  });
  const isEditOpen = useSelector((state: RootState) => state.UI.isEditOpen);

  const selectedItem = useSelector((state: RootState) => state.UI.selectedItem);

  const tasks = getTasks(trades);

  return (
    <>
      <DataTable data={tasks} columns={columns} />
      <TradeJournalDialog />
      <TradeDetailsDialog />
    </>
  );
}
