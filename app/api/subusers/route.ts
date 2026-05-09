import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CreateSubUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["accountant", "sales"]),
});

async function authorizeOwner(authHeader: string | null | undefined) {
  if (!authHeader) {
    return { error: "Missing authorization token" };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(authHeader);
  if (userError || !userData.user) {
    return { error: "Invalid or expired session" };
  }

  let { data: membership, error: membershipError } = await supabaseAdmin
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membershipError) {
    return { error: membershipError.message || "Failed to verify user role" };
  }

  if (!membership) {
    const { data: createdMembership, error: createMembershipError } = await supabaseAdmin
      .from("tenant_members")
      .insert({
        tenant_id: userData.user.id,
        user_id: userData.user.id,
        user_email: userData.user.email || "",
        role: "owner",
        active: true,
        created_by: userData.user.id,
      })
      .select("tenant_id, role")
      .single();

    if (createMembershipError || !createdMembership) {
      return { error: createMembershipError?.message || "Failed to initialize owner membership" };
    }

    membership = createdMembership;
  }

  const role = membership.role;
  const tenantId = membership.tenant_id;

  if (role !== "owner") {
    return { error: "Only owners can manage sub-users", status: 403 };
  }

  return { user: userData.user, tenantId };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")?.trim();
  const auth = await authorizeOwner(authHeader);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { tenantId } = auth;

  const { data, error } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id, user_email, role, active, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")?.trim();
  const auth = await authorizeOwner(authHeader);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const payload = await req.json();
  const parseResult = CreateSubUserSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.errors.map((e) => e.message).join(", ") }, { status: 422 });
  }

  const { email, password, role } = parseResult.data;
  const ownerId = auth.user.id;
  const tenantId = auth.tenantId;

  const {
    data: createData,
    error: createError,
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  const newUser = createData?.user;
  if (createError || !newUser) {
    return NextResponse.json({ error: createError?.message || "Failed to create sub-user" }, { status: 500 });
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("tenant_members")
    .insert({
      tenant_id: tenantId,
      user_id: newUser.id,
      user_email: email,
      role,
      active: true,
      created_by: ownerId,
    })
    .select("user_id, user_email, role, active, created_at")
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ error: membershipError?.message || "Failed to create tenant membership" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: membership });
}
