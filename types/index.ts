//types/index.ts
import { z } from 'zod';

// Validation schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive').max(999999, 'Price too high'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  user_id: z.string().uuid().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const SaleSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be positive'),
  total: z.number().positive('Total must be positive'),
  date: z.string().datetime(),
});

export const CategorySchema = z.string().min(1, 'Category name required').max(50, 'Category name too long');

// Types inferred from schemas
export type Product = z.infer<typeof ProductSchema>;
export type Sale = z.infer<typeof SaleSchema>;
export type Category = z.infer<typeof CategorySchema>;

// Form types (for partial updates)
export type ProductForm = Omit<Product, 'id'>;
export type SaleForm = Omit<Sale, 'id' | 'date'>;
export type BulkSaleItem = {
  productId: string;
  quantity: number;
};

export type TenantRole = 'owner' | 'accountant' | 'sales';

export interface TenantMember {
  user_id: string;
  tenant_id: string;
  user_email: string;
  role: TenantRole;
  active: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface InventoryState {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  loading: LoadingState;
}

// Custom Fields Types
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'currency';
export type BusinessType = 'pharmacy' | 'ngo' | 'warehouse' | 'supermarket' | 'retail_shop' | 'distributor' | 'custom';

export interface CustomField {
  id: string;
  tenant_id: string;
  field_name: string;
  display_name: string;
  field_type: CustomFieldType;
  is_required: boolean;
  is_visible: boolean;
  is_system?: boolean;
  field_order: number;
  select_options?: string[];
  default_value?: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  tenant_id: string;
  business_type: BusinessType;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Extended Product with custom data
export interface ProductWithCustomData extends Product {
  custom_data?: Record<string, any>;
}

// Custom Field Validation Schema
export const CustomFieldSchema = z.object({
  field_name: z.string().min(1).max(50),
  display_name: z.string().min(1).max(100),
  field_type: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'currency']),
  is_required: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  field_order: z.number().int().default(0),
  select_options: z.array(z.string()).optional(),
  default_value: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type CustomFieldForm = z.infer<typeof CustomFieldSchema>;
