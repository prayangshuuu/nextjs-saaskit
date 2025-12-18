import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";
import { isAdmin, hasPermission, PermissionResource, PermissionAction } from "./rbac";

export async function requireAuthServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const payload = verifyAccessToken(token);
    return payload;
  } catch {
    redirect("/login");
  }
}

export async function requireAdminServer() {
  const user = await requireAuthServer();
  const admin = await isAdmin(user.userId);

  if (!admin) {
    redirect("/dashboard");
  }

  return user;
}

export async function requirePermissionServer(
  resource: PermissionResource,
  action: PermissionAction
) {
  const user = await requireAuthServer();
  const hasPerm = await hasPermission(user.userId, resource, action);

  if (!hasPerm) {
    redirect("/dashboard");
  }

  return user;
}

