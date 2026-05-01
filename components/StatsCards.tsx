"use client";

import { Product } from "@/types";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";

export default function StatsCards({ products }: { products: Product[] }) {
  const total = products.length;
  const low = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const out = products.filter(p => p.stock === 0).length;
  const value = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  const Card = ({ title, value, icon }: any) => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg flex items-center gap-4">
      <div className="text-cyan-400">
        {icon}
      </div>
      <div>
        <p className="text-gray-300 text-sm">{title}</p>
        <h2 className="text-2xl font-bold text-white mt-1">{value}</h2>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card title="Total Products" value={total} icon={<Package size={24} />} />
      <Card title="Low Stock" value={low} icon={<AlertTriangle size={24} />} />
      <Card title="Out of Stock" value={out} icon={<XCircle size={24} />} />
      <Card title="Inventory Value" value={`$${value}`} icon={<DollarSign size={24} />} />
    </div>
  );
}