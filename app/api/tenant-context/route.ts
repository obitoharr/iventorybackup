import { getServerTenantContext, jsonError, jsonSuccess } from "@/lib/api";

export async function GET(req: Request) {
  const tenantContext = await getServerTenantContext(req);

  if ("error" in tenantContext) {
    return jsonError(tenantContext.error, tenantContext.status);
  }

  return jsonSuccess(
    {
      tenant_id: tenantContext.tenantId,
      role: tenantContext.role,
      user_id: tenantContext.userId,
      active: tenantContext.active,
    },
    200
  );
}
