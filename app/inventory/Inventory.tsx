"use client";

import { useEffect, useState } from "react";
import { Product } from "../../types";
import ProductTable from "./ProductTable";
import SellModal from "./SellModal";

type InventoryProps = {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, "id">) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  restockProduct: (id: string, amount: number) => Promise<boolean>;

  sellItem: Product | null;
  sellQty: number;
  setSellQty: (qty: number) => void;
  setSellItem: (item: Product | null) => void;
  openSell: (product: Product) => void;
  confirmSell: () => void;
};

export default function Inventory({
  products,
  categories,
  addProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  sellItem,
  sellQty,
  setSellQty,
  setSellItem,
  openSell,
  confirmSell,
}: InventoryProps) {

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories?.[0] ?? "");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const [editItem, setEditItem] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);

  const [restockItem, setRestockItem] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState(1);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories]);

  useEffect(() => {
    if (editItem) {
      setEditName(editItem.name);
      setEditCategory(editItem.category);
      setEditPrice(editItem.price);
      setEditStock(editItem.stock);
    }
  }, [editItem]);

  const addProductHandler = async () => {
    if (!name.trim() || !category || price <= 0 || stock < 0) return;

    const success = await addProduct({
      name: name.trim(),
      category,
      price,
      stock,
    });

    if (success) {
      setName("");
      setCategory(categories?.[0] ?? "");
      setPrice(0);
      setStock(0);
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;

    await updateProduct(editItem.id, {
      name: editName,
      category: editCategory,
      price: editPrice,
      stock: editStock,
    });

    setEditItem(null);
  };

  const deleteProductHandler = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (confirm(`Delete ${product.name}?`)) {
      await deleteProduct(id);
    }
  };

  const openRestockModal = (product: Product) => {
    setRestockItem(product);
    setRestockAmount(1);
  };

  const saveRestock = async () => {
    if (!restockItem) return;

    await restockProduct(restockItem.id, restockAmount);

    setRestockItem(null);
    setRestockAmount(1);
  };

  return (
    <div>
      <h2 className="text-3xl mb-4">Inventory</h2>

      <ProductTable
        products={products}
        openSell={openSell}
        onEdit={setEditItem}
        onRestock={openRestockModal}
        onDelete={deleteProductHandler}
      />

      <SellModal
        sellItem={sellItem}
        sellQty={sellQty}
        setSellQty={setSellQty}
        setSellItem={setSellItem}
        confirmSell={confirmSell}
      />

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-2xl w-[400px] text-white">
            <h2 className="text-xl mb-4">Edit Product</h2>

            <input value={editName} onChange={e => setEditName(e.target.value)} />
            <input value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} />

            <button onClick={saveEdit}>Save</button>
            <button onClick={() => setEditItem(null)}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}