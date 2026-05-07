"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Categories from "@/components/Categories";
import { useInventory } from "@/hooks/useInventory";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function CategoriesPage() {
  const inventory = useInventory();
  const [dark, setDark] = useState(true);
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  const theme = dark
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-100 text-slate-950";

  return (
    <div className={`flex min-h-screen items-start flex-col lg:flex-row ${theme}`}>
      <Sidebar dark={dark} setDark={setDark} />
      <div className="flex-1 p-4 sm:p-6">
        <Categories
          categories={inventory.categories}
          loading={inventory.loading.isLoading}
          error={inventory.loading.error}
          addCategory={inventory.addCategory}
          updateCategory={inventory.updateCategory}
          deleteCategory={inventory.deleteCategory}
        />
      </div>
    </div>
  );
}
