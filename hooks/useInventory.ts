"use client";

import { useCallback, useEffect, useState } from "react";
import { Product, Sale, Category, ProductSchema, SaleSchema, CategorySchema, LoadingState } from "../types";

interface InventoryHookReturn {
  // State
  products: Product[];
  categories: Category[];
  sales: Sale[];
  loading: LoadingState;

  // Product operations
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  restockProduct: (id: string, amount: number) => Promise<boolean>;

  // Sale operations
  sellProduct: (productId: string, quantity: number) => Promise<boolean>;

  // Category operations
  addCategory: (category: Category) => Promise<boolean>;
  updateCategories: (categories: Category[]) => void;

  // Utility
  getProductById: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
}

// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'inventory_products',
  CATEGORIES: 'inventory_categories',
  SALES: 'inventory_sales',
} as const;

// Default data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: crypto.randomUUID(),
    name: "Laptop",
    category: "Electronics",
    price: 1299,
    stock: 18,
  },
  {
    id: crypto.randomUUID(),
    name: "Coffee Beans",
    category: "Food",
    price: 15,
    stock: 42,
  },
  {
    id: crypto.randomUUID(),
    name: "Handbag",
    category: "Fashion",
    price: 249,
    stock: 10,
  },
];

const DEFAULT_CATEGORIES: Category[] = ["Electronics", "Food", "Fashion"];

export function useInventory(): InventoryHookReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  // Legacy sell modal state for backward compatibility
  const [sellItem, setSellItem] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState(1);

  // Safe localStorage operations with error handling
  const safeLocalStorage = {
    get: <T>(key: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return fallback;
      }
    },

    set: (key: string, value: any): boolean => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
        return false;
      }
    },
  };

  // Load data from localStorage with validation
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading({ isLoading: true, error: null });

        // Load and validate products
        const storedProducts = safeLocalStorage.get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const validatedProducts = storedProducts
          .map(product => {
            try {
              return ProductSchema.parse(product);
            } catch (error) {
              console.warn('Invalid product data, skipping:', product, error);
              return null;
            }
          })
          .filter((product): product is Product => product !== null);

        // Load and validate categories
        const storedCategories = safeLocalStorage.get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const validatedCategories = storedCategories
          .map(category => {
            try {
              return CategorySchema.parse(category);
            } catch (error) {
              console.warn('Invalid category data, skipping:', category, error);
              return null;
            }
          })
          .filter((category): category is Category => category !== null);

        // Load and validate sales
        const storedSales = safeLocalStorage.get(STORAGE_KEYS.SALES, []);
        const validatedSales = storedSales
          .map(sale => {
            try {
              return SaleSchema.parse(sale);
            } catch (error) {
              console.warn('Invalid sale data, skipping:', sale, error);
              return null;
            }
          })
          .filter((sale): sale is Sale => sale !== null);

        setProducts(validatedProducts);
        setCategories(validatedCategories);
        setSales(validatedSales);
        setLoading({ isLoading: false, error: null });

      } catch (error) {
        console.error('Error loading inventory data:', error);
        setLoading({
          isLoading: false,
          error: 'Failed to load inventory data. Using defaults.',
        });

        // Fallback to defaults
        setProducts(DEFAULT_PRODUCTS);
        setCategories(DEFAULT_CATEGORIES);
        setSales([]);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (!loading.isLoading) {
      safeLocalStorage.set(STORAGE_KEYS.PRODUCTS, products);
    }
  }, [products, loading.isLoading]);

  useEffect(() => {
    if (!loading.isLoading) {
      safeLocalStorage.set(STORAGE_KEYS.CATEGORIES, categories);
    }
  }, [categories, loading.isLoading]);

  useEffect(() => {
    if (!loading.isLoading) {
      safeLocalStorage.set(STORAGE_KEYS.SALES, sales);
    }
  }, [sales, loading.isLoading]);

  // Product operations
  const addProduct = useCallback(async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const newProduct = ProductSchema.parse({
        ...productData,
        id: crypto.randomUUID(),
      });

      setProducts(prev => [newProduct, ...prev]);
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<boolean> => {
    try {
      setProducts(prev =>
        prev.map(product => {
          if (product.id === id) {
            const updated = { ...product, ...updates };
            return ProductSchema.parse(updated);
          }
          return product;
        })
      );
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      setProducts(prev => prev.filter(product => product.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }, []);

  const restockProduct = useCallback(async (id: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;

    try {
      setProducts(prev =>
        prev.map(product => {
          if (product.id === id) {
            const updated = { ...product, stock: product.stock + amount };
            return ProductSchema.parse(updated);
          }
          return product;
        })
      );
      return true;
    } catch (error) {
      console.error('Error restocking product:', error);
      return false;
    }
  }, []);

  // Sale operations
  const sellProduct = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');
      if (quantity <= 0 || quantity > product.stock) throw new Error('Invalid quantity');

      const total = quantity * product.price;

      // Update stock
      await updateProduct(productId, { stock: product.stock - quantity });

      // Record sale
      const newSale = SaleSchema.parse({
        id: crypto.randomUUID(),
        productId,
        productName: product.name,
        quantity,
        total,
        date: new Date().toISOString(),
      });

      setSales(prev => [newSale, ...prev]);
      return true;
    } catch (error) {
      console.error('Error selling product:', error);
      return false;
    }
  }, [products, updateProduct]);

  // Category operations
  const addCategory = useCallback(async (category: Category): Promise<boolean> => {
    try {
      const validatedCategory = CategorySchema.parse(category);
      if (categories.includes(validatedCategory)) {
        throw new Error('Category already exists');
      }
      setCategories(prev => [...prev, validatedCategory]);
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  }, [categories]);

  const updateCategories = useCallback((newCategories: Category[]) => {
    try {
      const validatedCategories = newCategories.map(cat => CategorySchema.parse(cat));
      setCategories(validatedCategories);
    } catch (error) {
      console.error('Error updating categories:', error);
    }
  }, []);

  // Utility functions
  const getProductById = useCallback((id: string) => {
    return products.find(product => product.id === id);
  }, [products]);

  const getLowStockProducts = useCallback(() => {
    return products.filter(product => product.stock > 0 && product.stock < 10);
  }, [products]);

  const getOutOfStockProducts = useCallback(() => {
    return products.filter(product => product.stock === 0);
  }, [products]);

  return {
    // State
    products,
    categories,
    sales,
    loading,

    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,

    // Sale operations
    sellProduct,

    // Category operations
    addCategory,
    updateCategories,

    // Utility
    getProductById,
    getLowStockProducts,
    getOutOfStockProducts,
  };
}