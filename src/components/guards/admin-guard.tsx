"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/v1/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role?.name === "ADMIN") {
            setIsAdmin(true);
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

