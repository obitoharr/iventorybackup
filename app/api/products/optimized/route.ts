// app/api/products/optimized/route.ts - Optimized products fetch with caching
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerTenantContext, jsonError, jsonSuccess } from "@/lib/api";
import { getCachedCategories, getCachedProductStats, setCachedProductStats, setCachedCategories } from "@/lib/cache";
import { getProductAnalytics } from "@/lib/search";
import { z } from "zod";

const OptimizedProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeStats: z.enum(["true", "false"]).default("false"),
  includeCategories: z.enum(["true", "false"]).default("false"),
});

export async function GET(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  const url = new URL(req.url);
  const parseResult = OptimizedProductsQuerySchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    includeStats: url.searchParams.get("includeStats"),
    includeCategories: url.searchParams.get("includeCategories"),
  });

  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((i) => i.message).join(", "), 422);
  }

  const { page, limit, includeStats, includeCategories } = parseResult.data;
  const offset = (page - 1) * limit;

  try {
    // Fetch products (always)
    const { data: products, error: productsError, count } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantContext.tenantId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (productsError) {
      return jsonError(productsError.message, 500);
    }

    const response: any = {
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };

    // Optionally include statistics (cached)
    if (includeStats === "true") {
      let stats = await getCachedProductStats(tenantContext.tenantId);
      if (!stats) {
        stats = await getProductAnalytics(tenantContext.tenantId);
        await setCachedProductStats(tenantContext.tenantId, {
          totalProducts: stats.totalProducts,
          totalValue: stats.totalValue,
          averagePrice: stats.averagePrice,
          lowStockCount: stats.lowStockCount,
        });
      }
      response.stats = stats;
    }

    // Optionally include categories (cached)
    if (includeCategories === "true") {
      let categories = await getCachedCategories(tenantContext.tenantId);
      if (!categories) {
        const { data: categoriesData, error: categoriesError } = await supabaseAdmin
          .from("categories")
          .select("name")
          .eq("tenant_id", tenantContext.tenantId)
          .order("name");

        if (!categoriesError && categoriesData) {
          categories = categoriesData.map((c) => c.name);
          await setCachedCategories(tenantContext.tenantId, categories);
        }
      }
      response.categories = categories || [];
    }

    return jsonSuccess(response);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to fetch products", 500);
  }
}
