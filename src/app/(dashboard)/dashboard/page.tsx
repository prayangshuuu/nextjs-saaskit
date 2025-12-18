import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { headers } from "next/headers";

async function getUser() {
  const headersList = headers();
  const cookieHeader = headersList.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...rest] = c.split("=");
      return [key, rest.join("=")];
    })
  );

  if (!cookies.accessToken) {
    redirect("/login");
  }

  try {
    const { verifyAccessToken } = await import("@/lib/auth");
    const payload = verifyAccessToken(cookies.accessToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });
    return user;
  } catch {
    redirect("/login");
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user.role.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email Verified:</span>{" "}
                {user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Quick actions will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

