"use client";

import { useEffect, useState } from "react";
import AddProductForm from "./../components/AddProductForm";
import { supabase } from "@/lib/supabase";

type Product = {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export default function AddPage() {
  const [categories, setCategories] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ fetch categories (UNCHANGED)
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      const names = data.map((c: any) => c.name);
      setCategories(names);
    };

    fetchCategories();
  }, []);

  // ✅ auto select category
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // ✅ FIXED: API + AUTH
  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      // 🔥 ensure user exists
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("❌ You must be logged in");
        return false;
      }

      // 🔥 get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setMessage("❌ Session expired. Please login again.");
        return false;
      }

      // ✅ call API
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Insert error:", data.error);
        setMessage("❌ " + (data.error || "Failed to add product"));
        return false;
      }

      return true;
    } catch (err) {
      console.error("Network error:", err);
      setMessage("❌ Network error");
      return false;
    }
  };

  // ✅ handler (UNCHANGED)
  const addProductHandler = async () => {
    if (loading) return;

    if (!name.trim() || price <= 0 || stock < 0) {
      setMessage("⚠️ Fill all fields correctly");
      return;
    }

    setLoading(true);
    setMessage("");

    const success = await addProduct({
      name: name.trim(),
      category,
      price,
      stock,
    });

    if (success) {
      setMessage("✅ Product added successfully");
      setName("");
      setPrice(0);
      setStock(0);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* ✅ message */}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-white/10 text-center">
            {message}
          </div>
        )}

        <AddProductForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          price={price}
          setPrice={setPrice}
          stock={stock}
          setStock={setStock}
          categories={categories}
          addProductHandler={addProductHandler}
        />

        {/* ✅ loading */}
        {loading && (
          <p className="mt-3 text-sm text-gray-400 text-center">
            Adding product...
          </p>
        )}
      </div>
    </div>
  );
}