import { Product } from "../../types";
import { ShoppingCart, Plus, Edit, Trash2 } from "lucide-react";

export default function ProductTable({
  products = [],
  openSell,
  onEdit,
  onRestock,
  onDelete,
}: {
  products?: Product[];
  openSell: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onRestock?: (product: Product) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-150">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="text-left">Category</th>
              <th className="text-left">Price</th>
              <th className="text-left">Stock</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-gray-400">
                No inventory items found.
              </td>
            </tr>
          ) : (
            products.map((p: Product) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="p-3">{p.name}</td>
                <td>{p.category}</td>
                <td>${p.price}</td>
                <td>{p.stock}</td>
                <td className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openSell(p)}
                    className="text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    <ShoppingCart size={16} />
                    Sell
                  </button>

                  <button
                    onClick={() => onRestock?.(p)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Restock
                  </button>

                  <button
                    onClick={() => onEdit?.(p)}
                    className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete?.(p.id)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}