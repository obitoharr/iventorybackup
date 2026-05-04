"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Inventory from "./inventory/Inventory";
import Dashboard from "../components/Dashboard";
import Categories from "../components/Categories";
import SalesPage from "./sales/page";
import { useInventory } from "../hooks/useInventory";

// ✅ NEW (auth)
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Page() {
  const inventory = useInventory();
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(true);

  const router = useRouter();

  // ✅ PROTECT PAGE (DO NOT REMOVE)
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  const theme = dark
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-100 text-slate-950";

  return (
    <div className={`flex min-h-screen items-start flex-col lg:flex-row ${theme}`}>

      <Sidebar
        page={page}
        setPage={setPage}
        dark={dark}
        setDark={setDark}
      />

      <div className="flex-1 p-4 sm:p-6">

        {page === "dashboard" && (
          <Dashboard
            products={inventory.products}
            sales={inventory.sales}
          />
        )}

        {page === "inventory" && (
          <Inventory {...inventory} />
        )}

        {page === "sales" && (
          <SalesPage />
        )}

        {page === "categories" && (
          <Categories
            categories={inventory.categories}
            addCategory={inventory.addCategory}
          />
        )}

      </div>
    </div>
  );
}