import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerTenantContext, jsonError, jsonSuccess } from "@/lib/api";

const CUSTOM_FIELDS_TABLE_NAME = "custom_fields";
const SYSTEM_FIELDS = [
  { field_name: "name", display_name: "Name", field_type: "text" },
  { field_name: "category", display_name: "Category", field_type: "text" },
  { field_name: "price", display_name: "Price", field_type: "currency" },
  { field_name: "stock", display_name: "Stock", field_type: "number" },
  { field_name: "notes", display_name: "Notes", field_type: "textarea" },
];

function handleCustomFieldsSchemaError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.includes(`Could not find the table 'public.${CUSTOM_FIELDS_TABLE_NAME}'`)
  ) {
    return jsonError(
      "Custom fields are not installed. Run the Supabase migration 20260507000010_add_custom_fields.sql and refresh the app.",
      500
    );
  }

  return null;
}

async function initializeSystemFieldsForTenant(tenantId: string, userId: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_system", true);

  if (existingError) {
    console.error("Error checking system fields:", existingError);
    return;
  }

  if (existing && existing.length > 0) {
    return; // Already initialized
  }

  // Insert system fields
  const systemFieldsToInsert = SYSTEM_FIELDS.map((field, index) => ({
    tenant_id: tenantId,
    field_name: field.field_name,
    display_name: field.display_name,
    field_type: field.field_type,
    is_system: true,
    is_required: false,
    is_visible: true,
    field_order: index,
    created_by: userId,
  }));

  const { error: insertError } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .insert(systemFieldsToInsert);

  if (insertError) {
    console.error("Error initializing system fields:", insertError);
  }
}

const CustomFieldSchema = z.object({
  field_name: z.string().trim().min(1, "Field name is required").max(50),
  display_name: z.string().trim().min(1, "Display name is required").max(100),
  field_type: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'currency']),
  is_required: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  field_order: z.number().int().default(0),
  select_options: z.array(z.string().trim()).optional(),
  default_value: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  // Ensure system fields are initialized for this tenant
  await initializeSystemFieldsForTenant(tenantContext.tenantId, tenantContext.userId);

  const { data, error } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .order("field_order", { ascending: true });

  if (error) {
    const tableError = handleCustomFieldsSchemaError(error);
    if (tableError) return tableError;
    return jsonError(error.message, 500);
  }

  return jsonSuccess(data ?? []);
}

export async function POST(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (tenantContext.role !== "owner") {
    return jsonError("Only owners can create custom fields", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parseResult = CustomFieldSchema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((i) => i.message).join(", "), 422);
  }

  const { field_name, display_name, field_type, is_required, is_visible, field_order, select_options, default_value, description } = parseResult.data;

  // Check if field name already exists for this tenant
  const { data: existing, error: existingError } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .select("id")
    .eq("tenant_id", tenantContext.tenantId)
    .eq("field_name", field_name)
    .maybeSingle();

  if (existingError) {
    const tableError = handleCustomFieldsSchemaError(existingError);
    if (tableError) return tableError;
    return jsonError(existingError.message, 500);
  }

  if (existing) {
    return jsonError("Field name already exists for this tenant", 409);
  }

  const { data, error } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .insert({
      tenant_id: tenantContext.tenantId,
      field_name,
      display_name,
      field_type,
      is_required,
      is_visible,
      field_order,
      select_options,
      default_value,
      description,
      created_by: tenantContext.userId,
    })
    .select()
    .single();

  if (error) {
    const tableError = handleCustomFieldsSchemaError(error);
    if (tableError) return tableError;
    return jsonError(error.message, 500);
  }

  return jsonSuccess(data, 201);
}

export async function PATCH(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (tenantContext.role !== "owner") {
    return jsonError("Only owners can update custom fields", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const schema = z.object({
    id: z.string().uuid(),
    updates: CustomFieldSchema.partial(),
  });

  const parseResult = schema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((i) => i.message).join(", "), 422);
  }

  const { id, updates } = parseResult.data;

  // Verify field belongs to tenant
  const { data: field, error: fieldError } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .select("tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (fieldError) {
    const tableError = handleCustomFieldsSchemaError(fieldError);
    if (tableError) return tableError;
    return jsonError(fieldError.message, 500);
  }

  if (!field || field.tenant_id !== tenantContext.tenantId) {
    return jsonError("Custom field not found", 404);
  }

  const { data, error } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const tableError = handleCustomFieldsSchemaError(error);
    if (tableError) return tableError;
    return jsonError(error.message, 500);
  }

  return jsonSuccess(data);
}

export async function DELETE(req: Request) {
  const tenantContext = await getServerTenantContext(req);
  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  if (tenantContext.role !== "owner") {
    return jsonError("Only owners can delete custom fields", 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const schema = z.object({
    id: z.string().uuid(),
  });

  const parseResult = schema.safeParse(payload);
  if (!parseResult.success) {
    return jsonError(parseResult.error.issues.map((i) => i.message).join(", "), 422);
  }

  const { id } = parseResult.data;

  // Verify field belongs to tenant and get full field info
  const { data: field, error: fieldError } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .select("tenant_id, field_name, display_name, is_system")
    .eq("id", id)
    .maybeSingle();

  if (fieldError) {
    const tableError = handleCustomFieldsSchemaError(fieldError);
    if (tableError) return tableError;
    return jsonError(fieldError.message, 500);
  }

  if (!field || field.tenant_id !== tenantContext.tenantId) {
    return jsonError("Custom field not found", 404);
  }

  // Prevent deletion of system fields if they have data
  if (field.is_system) {
    const { data: productsWithData, error: dataCheckError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("tenant_id", tenantContext.tenantId)
      .not(`${field.field_name}`, "is", null)
      .limit(1);

    if (!dataCheckError && productsWithData && productsWithData.length > 0) {
      return jsonError(
        `Cannot delete standard column "${field.display_name}" because it contains data. You can only rename or hide it.`,
        409
      );
    }
  }

  const { error } = await supabaseAdmin
    .from(CUSTOM_FIELDS_TABLE_NAME)
    .delete()
    .eq("id", id);

  if (error) {
    const tableError = handleCustomFieldsSchemaError(error);
    if (tableError) return tableError;
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ id });
}
