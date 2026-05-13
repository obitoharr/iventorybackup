import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerTenantContext, jsonError, jsonSuccess } from "@/lib/api";

const ProductCreateSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  category: z.string().trim().min(1, "Category is required"),
  cost_price: z.number().nonnegative("Cost price cannot be negative"),
  price: z.number().nonnegative("Price must be 0 or greater"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),
  custom_data: z.record(z.any()).optional(),
});

const ProductUpdateSchema = ProductCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);

const ProductPatchSchema = z.object({
  id: z.string().uuid(),
  updates: ProductUpdateSchema,
});

const ProductDeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page") || "10")));
  const offset = (page - 1) * perPage;

  const { data, error, count } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantContext.tenantId)
    .range(offset, offset + perPage - 1)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ products: data ?? [], count: count ?? 0 });
}

export async function POST(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (!["owner", "accountant"].includes(tenantContext.role)) {
    return jsonError("Only owners or accountants can create products", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parseResult = ProductCreateSchema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((issue) => issue.message).join(", "), 422);
  }

  const { name, category, cost_price, price, stock, custom_data } = parseResult.data;

  const { data: insertedProduct, error: insertError } = await supabaseAdmin
    .from("products")
    .insert({
      name,
      category,
      cost_price,
      price,
      stock,
      custom_data: custom_data || {},
      tenant_id: tenantContext.tenantId,
      user_id: tenantContext.userId,
      created_by: tenantContext.userId,
    })
    .select()
    .single();

  if (insertError || !insertedProduct) {
    return jsonError(insertError?.message || "Failed to add product", 500);
  }

  return jsonSuccess(insertedProduct, 201);
}

export async function PATCH(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (!["owner", "accountant"].includes(tenantContext.role)) {
    return jsonError("Only owners or accountants can update products", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parseResult = ProductPatchSchema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((issue) => issue.message).join(", "), 422);
  }

  const { id, updates } = parseResult.data;

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("tenant_id")
    .eq("id", id)
    .single();

  if (productError || !product) {
    return jsonError(productError?.message || "Product not found", 404);
  }

  if (product.tenant_id !== tenantContext.tenantId) {
    return jsonError("You do not have permission to edit this product", 403);
  }

  const { error } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ id, updates });
}

export async function DELETE(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (!["owner", "accountant"].includes(tenantContext.role)) {
    return jsonError("Only owners or accountants can delete products", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parseResult = ProductDeleteSchema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((issue) => issue.message).join(", "), 422);
  }

  const { id } = parseResult.data;

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("tenant_id")
    .eq("id", id)
    .single();

  if (productError || !product) {
    return jsonError(productError?.message || "Product not found", 404);
  }

  if (product.tenant_id !== tenantContext.tenantId) {
    return jsonError("You do not have permission to delete this product", 403);
  }

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ id });
}
