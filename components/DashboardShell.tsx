"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

type Props = {
  children: ReactNode;
  initialPage?: string;
};

export default function DashboardShell({ children, initialPage }: Props) {
  const [dark, setDark] = useState(true);

  return (
    <div
      className={`flex min-h-screen ${
        dark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-950"
      }`}
    >
      <Sidebar dark={dark} setDark={setDark} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
