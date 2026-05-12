// app/api/search/route.ts - Full-text search endpoint
import { z } from "zod";
import { searchProducts, getTrendingProducts } from "@/lib/search";
import { getServerTenantContext, jsonError, jsonSuccess } from "@/lib/api";
import { getCachedCategories } from "@/lib/cache";

const SearchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minStock: z.coerce.number().nonnegative().optional(),
  inStock: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  const url = new URL(req.url);
  const parseResult = SearchQuerySchema.safeParse({
    query: url.searchParams.get("q"),
    category: url.searchParams.get("category"),
    minPrice: url.searchParams.get("minPrice"),
    maxPrice: url.searchParams.get("maxPrice"),
    minStock: url.searchParams.get("minStock"),
    inStock: url.searchParams.get("inStock"),
    limit: url.searchParams.get("limit"),
  });

  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((i) => i.message).join(", "), 422);
  }

  const { query, limit, ...filters } = parseResult.data;

  try {
    const results = await searchProducts(
      tenantContext.tenantId,
      query || "",
      {
        ...filters,
        inStock: filters.inStock === "true",
      },
      limit
    );

    return jsonSuccess({
      results,
      query,
      count: results.length,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Search failed", 500);
  }
}
