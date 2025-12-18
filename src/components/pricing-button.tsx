"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PricingButton({
  planId,
  isRecommended,
}: {
  planId: string;
  isRecommended: boolean;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/v1/auth/me");
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <Button className="w-full mb-6" variant={isRecommended ? "default" : "outline"} disabled>
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        className="w-full mb-6"
        variant={isRecommended ? "default" : "outline"}
        onClick={() => router.push(`/dashboard/plans?subscribe=${planId}`)}
      >
        Subscribe Now
      </Button>
    );
  }

  return (
    <Button
      asChild
      className="w-full mb-6"
      variant={isRecommended ? "default" : "outline"}
    >
      <Link href={`/register?plan=${planId}`}>Get Started</Link>
    </Button>
  );
}

