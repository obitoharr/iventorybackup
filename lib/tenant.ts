import { supabase } from "@/lib/supabase";

export type TenantRole = "owner" | "accountant" | "sales";

export interface TenantContext {
  tenant_id: string;
  role: TenantRole;
  user_id: string;
  user_email: string;
}

export async function getTenantContext(): Promise<TenantContext> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Authentication required");
  }

  const userId = authData.user.id;
  const userEmail = authData.user.email || "";

  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, user_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return {
      tenant_id: data.tenant_id,
      role: data.role as TenantRole,
      user_id: userId,
      user_email: data.user_email,
    };
  }

  const { data: created, error: createError } = await supabase
    .from("tenant_members")
    .insert({
      tenant_id: userId,
      user_id: userId,
      user_email: userEmail,
      role: "owner",
      active: true,
      created_by: userId,
    })
    .select("tenant_id, role, user_email")
    .maybeSingle();

  if (createError || !created) {
    throw new Error(createError?.message || "Failed to initialize tenant membership");
  }

  return {
    tenant_id: created.tenant_id,
    role: created.role as TenantRole,
    user_id: userId,
    user_email: created.user_email,
  };
}
