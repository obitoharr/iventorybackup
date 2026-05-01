"use client";

import { useMemo } from "react";
import { useInventory } from "../../hooks/useInventory";
import { Download, DollarSign, ShoppingBag, TrendingUp, Clock, Star } from "lucide-react";

function formatCsvRow(row: string[]) {
  return row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",");
}

export default function ReportsPage() {
  const { sales } = useInventory();

  const revenue = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.total, 0),
    [sales]
  );

  const orders = sales.length;
  const average = orders ? (revenue / orders).toFixed(2) : "0.00";
  const cashFlow = revenue;
  const latestSale = sales[0]?.date
    ? new Date(sales[0].date).toLocaleString()
    : "No sales yet";

  const productTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    sales.forEach((sale) => {
      totals[sale.productName] = (totals[sale.productName] || 0) + sale.quantity;
    });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([product]) => product);
  }, [sales]);

  const topProduct = productTotals[0] || "No sales yet";

  const downloadCsv = () => {
    const header = ["Sale ID", "Product", "Quantity", "Total", "Date"];
    const rows = sales.map((sale) => [
      sale.id,
      sale.productName,
      sale.quantity.toString(),
      sale.total.toFixed(2),
      new Date(sale.date).toLocaleString(),
    ]);

    const csv = [header, ...rows].map(formatCsvRow).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Reports</h2>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Get a clear view of your revenue, order trends, and recent sales history.
            </p>
          </div>

          <button
            onClick={downloadCsv}
            className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 flex items-center gap-2"
          >
            <Download size={20} />
            Download CSV
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-3xl bg-slate-900 p-6 shadow-lg shadow-black/20 border border-slate-800 flex items-center gap-4">
            <DollarSign size={32} className="text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold text-white">${revenue}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 shadow-lg shadow-black/20 border border-slate-800 flex items-center gap-4">
            <ShoppingBag size={32} className="text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Orders</p>
              <p className="text-3xl font-bold text-white">{orders}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 shadow-lg shadow-black/20 border border-slate-800 flex items-center gap-4">
            <TrendingUp size={32} className="text-purple-400" />
            <div>
              <p className="text-sm text-slate-400">Average Sale</p>
              <p className="text-3xl font-bold text-white">${average}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 shadow-lg shadow-black/20 border border-slate-800 flex items-center gap-4">
            <Star size={32} className="text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">Top Product</p>
              <p className="text-2xl font-bold text-cyan-300">{topProduct}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6 shadow-lg shadow-black/20 border border-slate-800">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4">
              <DollarSign size={24} className="text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Cash Flow</p>
                <p className="text-2xl font-bold text-white">${cashFlow}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Clock size={24} className="text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Latest Sale</p>
                <p className="text-2xl font-bold text-white">{latestSale}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="p-3 text-sm">Product</th>
                  <th className="p-3 text-sm">Qty</th>
                  <th className="p-3 text-sm">Total</th>
                  <th className="p-3 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-slate-800 hover:bg-slate-950/50">
                      <td className="p-3">{sale.productName}</td>
                      <td className="p-3">{sale.quantity}</td>
                      <td className="p-3">${sale.total}</td>
                      <td className="p-3">{new Date(sale.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
