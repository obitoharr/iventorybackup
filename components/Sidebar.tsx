//components/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  FileText,
  Moon,
  Sun,
  Building2,
  Menu,
  X,
  Plus,
} from "lucide-react";

type Props = {
  page: string;
  setPage: (page: string) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
};

export default function Sidebar({
  page,
  setPage,
  dark,
  setDark,
}: Props) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClick = (name: string) => {
    setPage(name);
    setOpen(false);
  };

  const link = (name: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => handleClick(name)}
      className={`w-full text-left px-2 py-3 rounded-xl transition flex items-center gap-3 ${
        page === name ? "bg-white/20" : "hover:bg-white/10"
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-950">
        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
        <h1 className="font-bold">Inventory</h1>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed lg:static z-50 top-0 left-0 h-full
          ${collapsed ? "w-16" : "w-64"}
          bg-slate-950/95 backdrop-blur-xl border-r border-white/10
          flex flex-col p-4 transition-all duration-300
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* CLOSE BUTTON */}
        <div className="mb-4 flex justify-between lg:justify-end">
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block"
          >
            {collapsed ? <Menu /> : <X />}
          </button>
        </div>

        {/* BRAND */}
        <div className="mb-8 flex items-center gap-3">
          <Building2 size={24} className="text-cyan-400" />
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold">Luxury Inventory</h1>
              <p className="text-xs text-gray-400">ERP System</p>
            </div>
          )}
        </div>

        {/* NAV */}
        <div className="flex-1 flex flex-col gap-2">
          {link("dashboard", "Dashboard", <LayoutDashboard size={20} />)}
          {link("inventory", "Inventory", <Package size={20} />)}

          {/* ✅ FIXED: REAL ROUTE */}
          <Link
            href="/inventory/add"
            onClick={() => setOpen(false)}
            className={`px-2 py-3 rounded-xl flex items-center gap-3 ${
              pathname === "/inventory/add"
                ? "bg-white/20"
                : "hover:bg-white/10"
            }`}
          >
            <Plus size={20} />
            {!collapsed && <span>Add Product</span>}
          </Link>

          {link("categories", "Categories", <Tag size={20} />)}
          {link("sales", "Sales", <ShoppingCart size={20} />)}

          <Link
            href="/reports"
            onClick={() => setOpen(false)}
            className={`px-2 py-3 rounded-xl flex items-center gap-3 ${
              pathname === "/reports"
                ? "bg-white/20"
                : "hover:bg-white/10"
            }`}
          >
            <FileText size={20} />
            {!collapsed && <span>Reports</span>}
          </Link>
        </div>

        {/* THEME */}
        <button
          onClick={() => setDark(!dark)}
          className="mt-6 w-full bg-gradient-to-r from-purple-500 to-indigo-500 py-2 rounded-xl flex items-center justify-center gap-2"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>Toggle Theme</span>}
        </button>
      </div>
    </>
  );
}