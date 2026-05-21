"use client";

import { Search, X } from "lucide-react";

export default function SearchBar({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary">
        <Search size={18} />
      </div>
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-10 py-3 rounded-xl bg-theme-input border border-theme text-theme-primary placeholder-theme-secondary focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-theme-primary"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}