import { ProductWithCustomData, CustomField } from "../../types";
import { ShoppingCart, Plus, Edit, Trash2 } from "lucide-react";

export default function ProductTable({
  products = [],
  customFields = [],
  openSell,
  onEdit,
  onRestock,
  onDelete,
  loading = false,
}: {
  products?: ProductWithCustomData[];
  customFields?: CustomField[];
  openSell: (product: ProductWithCustomData) => void;
  onEdit?: (product: ProductWithCustomData) => void;
  onRestock?: (product: ProductWithCustomData) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}) {
  // Standard columns that are always shown
  const standardColumns = ["name", "category", "price", "stock", "notes"];

  // Visible custom fields sorted by order
  const visibleCustomFields = customFields
    .filter((f) => f.is_visible)
    .sort((a, b) => a.field_order - b.field_order);

  // Calculate total columns
  const totalCols = standardColumns.length + visibleCustomFields.length + 1; // +1 for actions

  const renderCustomFieldValue = (field: CustomField, value: any) => {
    if (value === undefined || value === null) {
      return "—";
    }

    switch (field.field_type) {
      case "currency":
        return `$${parseFloat(value).toFixed(2)}`;
      case "checkbox":
        return value ? "✓" : "—";
      case "date":
        return new Date(value).toLocaleDateString();
      case "number":
        return parseFloat(value).toString();
      default:
        return String(value);
    }
  };

  return (
    <div className="w-full max-h-[70vh] overflow-auto rounded-2xl bg-white/10">
      <table className="min-w-full w-full text-sm">
        <thead className="sticky top-0 bg-slate-900 z-10">
          <tr>
            <th className="p-3 text-left whitespace-nowrap">Name</th>
            <th className="p-3 text-left whitespace-nowrap">Category</th>
            <th className="p-3 text-left whitespace-nowrap">Price</th>
            <th className="p-3 text-left whitespace-nowrap">Stock</th>
            <th className="p-3 text-left whitespace-nowrap">Notes</th>

            {visibleCustomFields.map((field) => (
              <th key={field.id} className="p-3 text-left whitespace-nowrap" title={field.description}>
                {field.display_name}
              </th>
            ))}

            <th className="p-3 text-left whitespace-nowrap">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={totalCols} className="p-8 text-center text-gray-400">
                <div className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Loading products...
                </div>
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="p-6 text-center text-gray-400">
                No inventory items found.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition">
                <td className="p-3 whitespace-nowrap font-medium">{p.name}</td>
                <td className="p-3 whitespace-nowrap text-slate-300">{p.category}</td>
                <td className="p-3 whitespace-nowrap text-slate-300">${p.price.toFixed(2)}</td>
                <td className="p-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      p.stock === 0
                        ? "bg-red-500/20 text-red-300"
                        : p.stock < 10
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="p-3 max-w-xs text-ellipsis overflow-hidden whitespace-nowrap text-slate-400">
                  {p.notes ? (p.notes.length > 40 ? `${p.notes.slice(0, 40)}...` : p.notes) : "—"}
                </td>

                {visibleCustomFields.map((field) => (
                  <td
                    key={field.id}
                    className="p-3 whitespace-nowrap text-slate-300"
                    title={String(p.custom_data?.[field.field_name])}
                  >
                    {renderCustomFieldValue(field, p.custom_data?.[field.field_name])}
                  </td>
                ))}

                <td className="p-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => p.stock > 0 && openSell(p)}
                    className={`flex items-center gap-1 text-xs ${
                      p.stock === 0 ? "text-gray-500 cursor-not-allowed" : "text-green-400 hover:text-green-300"
                    } transition`}
                    disabled={p.stock === 0}
                    title={p.stock === 0 ? "Out of stock" : "Record a sale"}
                  >
                    <ShoppingCart size={14} />
                    Sell
                  </button>

                  <button
                    onClick={() => onRestock?.(p)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    title="Add to stock"
                  >
                    <Plus size={14} />
                    Restock
                  </button>

                  <button
                    onClick={() => onEdit?.(p)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition"
                    title="Edit product"
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete?.(p.id)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}