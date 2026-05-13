//app/inventory/components/AddProductForm.tsx
"use client";

import { CustomField } from "../../../types";
import { CustomFieldInput } from "@/components/CustomFieldInput";

type Props = {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  costPrice: number;
  setCostPrice: (v: number) => void;
  price: number;
  setPrice: (v: number) => void;
  stock: number;
  setStock: (v: number) => void;
  categories: string[];
  loadingCategories?: boolean;
  customFields?: CustomField[];
  customData?: Record<string, any>;
  setCustomData?: (data: Record<string, any>) => void;
  addProductHandler: () => void;
};

export default function AddProductForm({
  name,
  setName,
  category,
  setCategory,
  costPrice,
  setCostPrice,
  price,
  setPrice,
  stock,
  setStock,
  categories,
  loadingCategories = false,
  customFields = [],
  customData = {},
  setCustomData,
  addProductHandler,
}: Props) {
  const handleCustomFieldChange = (fieldName: string, value: any) => {
    if (!setCustomData) return;
    setCustomData({
      ...customData,
      [fieldName]: value,
    });
  };

  return (
    <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white">
        ➕ Add New Product
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Name */}
        <div>
          <label className="text-sm text-gray-300">Product Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm text-gray-300">Category</label>
          <select
            className="input text-white bg-slate-800"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loadingCategories}
          >
            {loadingCategories ? (
              <option>Loading categories...</option>
            ) : (categories || []).length === 0 ? (
              <option className="text-black">No categories</option>
            ) : (
              (categories || []).map((c, index) => (
                <option key={`${c}-${index}`} value={c} className="text-black">
                  {c}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Cost Price */}
        <div>
          <label className="text-sm text-gray-300">Cost Price ($)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
          />
        </div>

        {/* Sell Price */}
        <div>
          <label className="text-sm text-gray-300">Sell Price ($)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        {/* Stock */}
        <div>
          <label className="text-sm text-gray-300">Stock Qty</label>
          <input
            className="input"
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </div>

        {/* Custom Fields */}
        {customFields
          .filter((field) => !field.is_system)
          .map((field) => (
            <CustomFieldInput
              key={field.id}
              field={field}
              value={customData?.[field.field_name]}
              onChange={(value) => handleCustomFieldChange(field.field_name, value)}
              disabled={false}
            />
          ))}
      </div>

      {/* Button */}
      <div className="mt-5 flex justify-end">
        <button
          type="button" // ✅ prevents accidental page reload
          onClick={addProductHandler}
          className="btn w-full sm:w-auto"
        >
          + Add Product
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
        }

        .btn {
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          color: white;
          background: linear-gradient(to right, #7c3aed, #4f46e5);
        }
      `}</style>
    </div>
  );
}