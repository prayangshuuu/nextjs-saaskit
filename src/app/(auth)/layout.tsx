import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  // Redirect logged-in users away from auth pages
  if (accessToken) {
    try {
      const { verifyAccessToken } = await import("@/lib/jwt");
      verifyAccessToken(accessToken.value);
      redirect("/dashboard");
    } catch {
      // Token invalid, allow access to auth pages
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      {children}
    </div>
  );
}
