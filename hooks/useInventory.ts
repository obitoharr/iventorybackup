//app/hooks/useInventory.ts
"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// COPILOT_MARKER
import { supabase } from "@/lib/supabase";
import {
  BulkSaleItem,
  Product,
  ProductForm,
  Sale,
  Category,
  LoadingState,
  ProductSchema,
  CategorySchema,
} from "../types";

const formatZodError = (issues: any[]) =>
  issues
    .map((issue) => `${issue.path?.join?.(".") || "input"}: ${issue.message}`)
    .join(", ");

const ProductFormSchema = ProductSchema.omit({ id: true, user_id: true });
const ProductUpdateSchema = ProductSchema.partial().omit({ id: true, user_id: true }).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);

export function useInventory() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [sellItem, setSellItem] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const queryClient = useQueryClient();

  const authUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error("Authentication required");
    }
    return data.user;
  };

  // ================= FETCH PRODUCTS WITH PAGINATION =================
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: async () => {
      const user = await authUser();
      const offset = (currentPage - 1) * itemsPerPage;

      const { data: products, error: productsError, count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .range(offset, offset + itemsPerPage - 1)
        .order("created_at", { ascending: false });

      if (productsError) throw new Error(productsError.message);

      return {
        products: products || [],
        count: productsCount || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ================= FETCH SALES =================
// SALES_MARKER
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const user = await authUser();

      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, product_id, product_name, quantity, total, created_at, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (salesError) throw new Error(salesError.message);
      return sales || [];
    },
    // SALES_QUERY_MARKER
    staleTime: 1000 * 60 * 5,
  });

  // ================= FETCH CATEGORIES =================
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const user = await authUser();

      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("name")
        .eq("user_id", user.id);

      if (categoriesError) throw new Error(categoriesError.message);
      return categories?.map((c) => c.name) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ================= ADD PRODUCT MUTATION =================
  const addProductMutation = useMutation({
    mutationFn: async (product: ProductForm) => {
      const parseResult = ProductFormSchema.safeParse(product);
      if (!parseResult.success) {
        throw new Error(formatZodError(parseResult.error.issues));
      }

      const user = await authUser();

      const { error } = await supabase.from("products").insert({
        ...product,
        user_id: user.id,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCurrentPage(1);
    },
  });

  // ================= UPDATE PRODUCT MUTATION =================
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductForm> }) => {
      if (Object.keys(updates).length === 0) {
        throw new Error("No changes provided");
      }

      const parseResult = ProductUpdateSchema.safeParse(updates);
      if (!parseResult.success) {
        throw new Error(formatZodError(parseResult.error.issues));
      }

      const user = await authUser();

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (productError || !product) {
        throw new Error("Product not found");
      }

      if (product.user_id !== user.id) {
        throw new Error("You can only edit products you own");
      }

      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // ================= DELETE PRODUCT MUTATION =================
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const user = await authUser();

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (productError || !product) {
        throw new Error("Product not found");
      }

      if (product.user_id !== user.id) {
        throw new Error("You can only delete products you own");
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCurrentPage(1);
    },
  });

  // ================= RESTOCK PRODUCT MUTATION =================
  const restockProductMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (amount <= 0) {
        throw new Error("Restock amount must be greater than zero");
      }

      const products = productsData?.products || [];
      const product = products.find((p) => p.id === id);
      if (!product) {
        throw new Error("Product not found");
      }

      const { data, error } = await supabase
        .from("products")
        .update({ stock: product.stock + amount })
        .eq("id", id)
        .select();

      if (error || !data?.length) {
        throw new Error(error?.message || "Failed to update stock");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // ================= SELL PRODUCT MUTATION =================
  const sellProductMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (quantity <= 0) {
        throw new Error("Sale quantity must be at least 1");
      }

      const products = productsData?.products || [];
      const product = products.find((p) => p.id === productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const user = await authUser();

      const { data: updatedProducts, error: updateError } = await supabase
        .from("products")
        .update({ stock: product.stock - quantity })
        .eq("id", productId)
        .gte("stock", quantity)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedProducts?.length) {
        throw new Error("Insufficient stock for this sale");
      }

      const { error: saleError } = await supabase.from("sales").insert({
        product_id: productId,
        product_name: product.name,
        quantity,
        total: quantity * product.price,
        user_id: user.id,
      });

      if (saleError) {
        await supabase
          .from("products")
          .update({ stock: product.stock })
          .eq("id", productId);
        throw new Error(saleError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  // ================= BULK SELL MUTATION =================
  const sellProductsMutation = useMutation({
    mutationFn: async (items: BulkSaleItem[]) => {
      const normalizedItems = items.reduce((acc, item) => {
        const existing = acc.find((entry) => entry.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [] as BulkSaleItem[]);

      if (normalizedItems.length === 0) {
        throw new Error("No items selected for sale");
      }

      const user = await authUser();
      const products = productsData?.products || [];
      const rollbackStack: Array<{ id: string; stock: number }> = [];

      for (const item of normalizedItems) {
        if (item.quantity <= 0) {
          throw new Error("Sale quantities must be greater than zero");
        }

        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const { data: updatedProducts, error: updateError } = await supabase
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("id", item.productId)
          .gte("stock", item.quantity)
          .select();

        if (updateError) {
          for (const rollback of rollbackStack) {
            await supabase.from("products").update({ stock: rollback.stock }).eq("id", rollback.id);
          }
          throw new Error(updateError.message);
        }

        if (!updatedProducts?.length) {
          for (const rollback of rollbackStack) {
            await supabase.from("products").update({ stock: rollback.stock }).eq("id", rollback.id);
          }
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        rollbackStack.push({ id: product.id, stock: product.stock });
      }

      const salesRows = normalizedItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return {
          product_id: item.productId,
          product_name: product.name,
          quantity: item.quantity,
          total: item.quantity * product.price,
          user_id: user.id,
        };
      });

      const { error: saleError } = await supabase.from("sales").insert(salesRows);
      if (saleError) {
        for (const rollback of rollbackStack) {
          await supabase.from("products").update({ stock: rollback.stock }).eq("id", rollback.id);
        }
        throw new Error(saleError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setCurrentPage(1);
    },
  });

  // ================= ADD CATEGORY MUTATION =================
  const addCategoryMutation = useMutation({
    mutationFn: async (name: Category) => {
      const parseResult = CategorySchema.safeParse(name);
      if (!parseResult.success) {
        throw new Error(formatZodError(parseResult.error.issues));
      }

      const categories = categoriesData || [];
      if (categories.includes(name)) {
        throw new Error("Category already exists");
      }

      const user = await authUser();

      const { error } = await supabase.from("categories").insert({
        name,
        user_id: user.id,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // ================= UPDATE CATEGORY MUTATION =================
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: Category; newName: Category }) => {
      const parseResult = CategorySchema.safeParse(newName);
      if (!parseResult.success) {
        throw new Error(formatZodError(parseResult.error.issues));
      }

      if (oldName === newName) {
        return;
      }

      const categories = categoriesData || [];
      if (categories.includes(newName)) {
        throw new Error("Category already exists");
      }

      const user = await authUser();

      const { error } = await supabase
        .from("categories")
        .update({ name: newName })
        .eq("name", oldName)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // ================= DELETE CATEGORY MUTATION =================
  const deleteCategoryMutation = useMutation({
    mutationFn: async (name: Category) => {
      const user = await authUser();

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("name", name)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // ================= HELPERS =================
  const getProductById = (id: string) =>
    (productsData?.products || []).find((p) => p.id === id);

  const getLowStockProducts = () =>
    (productsData?.products || []).filter((p) => p.stock > 0 && p.stock < 10);

  const getOutOfStockProducts = () =>
    (productsData?.products || []).filter((p) => p.stock === 0);

  // ================= SELL FLOW =================
  const openSell = (product: Product) => {
    setSellItem(product);
    setSellQty(1);
  };

  const confirmSell = async (): Promise<boolean> => {
    if (!sellItem) return false;
    try {
      await sellProductMutation.mutateAsync({ productId: sellItem.id, quantity: sellQty });
      setSellItem(null);
      setSellQty(1);
      return true;
    } catch {
      return false;
    }
  };

  // ================= COMPATIBILITY WRAPPERS =================
  const addProduct = async (product: ProductForm): Promise<boolean> => {
    try {
      await addProductMutation.mutateAsync(product);
      return true;
    } catch {
      return false;
    }
  };

  const updateProduct = async (id: string, updates: Partial<ProductForm>): Promise<boolean> => {
    try {
      await updateProductMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await deleteProductMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const restockProduct = async (id: string, amount: number): Promise<boolean> => {
    try {
      await restockProductMutation.mutateAsync({ id, amount });
      return true;
    } catch {
      return false;
    }
  };

  const sellProduct = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      await sellProductMutation.mutateAsync({ productId, quantity });
      return true;
    } catch {
      return false;
    }
  };

  const sellProducts = async (items: BulkSaleItem[]): Promise<boolean> => {
    try {
      await sellProductsMutation.mutateAsync(items);
      return true;
    } catch {
      return false;
    }
  };

  const addCategory = async (name: Category): Promise<boolean> => {
    try {
      await addCategoryMutation.mutateAsync(name);
      return true;
    } catch {
      return false;
    }
  };

  const updateCategory = async (oldName: Category, newName: Category): Promise<boolean> => {
    try {
      await updateCategoryMutation.mutateAsync({ oldName, newName });
      return true;
    } catch {
      return false;
    }
  };

  const deleteCategory = async (name: Category): Promise<boolean> => {
    try {
      await deleteCategoryMutation.mutateAsync(name);
      return true;
    } catch {
      return false;
    }
  };

  const updateCategories = (newCategories: Category[]) => {
    // No-op for compatibility; categories are managed via server mutations
  };

  // ================= LOADING STATE =================
  const loading: LoadingState = {
    isLoading:
      productsLoading || salesLoading || categoriesLoading,
    error:
      (productsError?.message) ||
      (salesError?.message) ||
      (categoriesError?.message) ||
      null,
  };

  return {
    products: productsData?.products || [],
    categories: categoriesData || [],
    sales: salesData || [],
    loading,

    // Pagination
    currentPage,
    totalCount: productsData?.count || 0,
    itemsPerPage,
    setCurrentPage,
    totalPages: Math.ceil((productsData?.count || 0) / itemsPerPage),

    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    sellProduct,
    sellProducts,

    addCategory,
    updateCategory,
    deleteCategory,
    updateCategories,

    getProductById,
    getLowStockProducts,
    getOutOfStockProducts,

    sellItem,
    sellQty,
    setSellQty,
    setSellItem,
    openSell,
    confirmSell,
  };
}