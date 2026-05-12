// lib/cache.ts - Centralized caching layer for high-frequency queries
import { redisClient } from "@/lib/redis";

const redis = redisClient;

export const CACHE_KEYS = {
  // Categories: 10min TTL (changes infrequently)
  categories: (tenantId: string) => `categories:${tenantId}`,
  
  // Product aggregates: 5min TTL
  productStats: (tenantId: string) => `product_stats:${tenantId}`,
  lowStockProducts: (tenantId: string) => `low_stock:${tenantId}`,
  
  // Sales trends: 15min TTL (changes less frequently)
  dailySales: (tenantId: string, date: string) => `sales:${tenantId}:${date}`,
  monthlySales: (tenantId: string, month: string) => `sales_month:${tenantId}:${month}`,
  
  // Search cache: 5min TTL
  searchResults: (tenantId: string, query: string) => `search:${tenantId}:${query}`,
};

export const CACHE_TTL = {
  categories: 600,      // 10 minutes
  productStats: 300,    // 5 minutes
  lowStock: 300,        // 5 minutes
  salesTrends: 900,     // 15 minutes
  search: 300,          // 5 minutes
  userSession: 3600,    // 1 hour
};

export async function getCachedCategories(tenantId: string) {
  if (!redis) return null;
  
  const key = CACHE_KEYS.categories(tenantId);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string) as string[];
    }
  } catch (err) {
    // Cache read failure is non-fatal
    console.warn(`Cache miss for ${key}:`, err);
  }
  
  return null;
}

export async function setCachedCategories(tenantId: string, categories: string[]) {
  if (!redis) return;
  
  const key = CACHE_KEYS.categories(tenantId);
  try {
    await redis.setex(key, CACHE_TTL.categories, JSON.stringify(categories));
  } catch (err) {
    console.warn(`Cache write failure for ${key}:`, err);
  }
}

export async function invalidateCategoriesCache(tenantId: string) {
  if (!redis) return;
  
  try {
    await redis.del(CACHE_KEYS.categories(tenantId));
  } catch (err) {
    console.warn("Failed to invalidate categories cache:", err);
  }
}

export interface ProductStats {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  lowStockCount: number;
}

export async function getCachedProductStats(tenantId: string) {
  if (!redis) return null;
  
  const key = CACHE_KEYS.productStats(tenantId);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string) as ProductStats;
    }
  } catch (err) {
    console.warn(`Cache miss for ${key}:`, err);
  }
  
  return null;
}

export async function setCachedProductStats(tenantId: string, stats: ProductStats) {
  if (!redis) return;
  
  const key = CACHE_KEYS.productStats(tenantId);
  try {
    await redis.setex(key, CACHE_TTL.productStats, JSON.stringify(stats));
  } catch (err) {
    console.warn(`Cache write failure for ${key}:`, err);
  }
}

export async function invalidateProductCaches(tenantId: string) {
  if (!redis) return;
  
  try {
    await Promise.all([
      redis.del(CACHE_KEYS.productStats(tenantId)),
      redis.del(CACHE_KEYS.lowStockProducts(tenantId)),
    ]);
  } catch (err) {
    console.warn("Failed to invalidate product caches:", err);
  }
}

export interface DailySalesData {
  date: string;
  totalSales: number;
  totalQuantity: number;
  transactionCount: number;
}

export async function getCachedDailySales(tenantId: string, date: string) {
  if (!redis) return null;
  
  const key = CACHE_KEYS.dailySales(tenantId, date);
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached as string) as DailySalesData;
    }
  } catch (err) {
    console.warn(`Cache miss for ${key}:`, err);
  }
  
  return null;
}

export async function setCachedDailySales(tenantId: string, date: string, data: DailySalesData) {
  if (!redis) return;
  
  const key = CACHE_KEYS.dailySales(tenantId, date);
  try {
    await redis.setex(key, CACHE_TTL.salesTrends, JSON.stringify(data));
  } catch (err) {
    console.warn(`Cache write failure for ${key}:`, err);
  }
}

export async function invalidateSalesCaches(tenantId: string, date: string) {
  if (!redis) return;
  
  try {
    const month = date.substring(0, 7); // YYYY-MM
    await Promise.all([
      redis.del(CACHE_KEYS.dailySales(tenantId, date)),
      redis.del(CACHE_KEYS.monthlySales(tenantId, month)),
    ]);
  } catch (err) {
    console.warn("Failed to invalidate sales caches:", err);
  }
}
