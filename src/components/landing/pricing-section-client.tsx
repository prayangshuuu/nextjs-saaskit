"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { isModuleEnabled } from "@/lib/module-service";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: "MONTHLY" | "YEARLY";
  features: any;
  active: boolean;
}

export function PricingSectionClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingEnabled, setPricingEnabled] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Check if pricing module is enabled
      const enabled = await fetch("/api/v1/admin/modules")
        .then((res) => res.json())
        .then((data) => {
          const pricingModule = data.modules?.find((m: any) => m.key === "pricing");
          return pricingModule?.enabled ?? true;
        })
        .catch(() => true);

      setPricingEnabled(enabled);

      if (!enabled) {
        setLoading(false);
        return;
      }

      // Fetch plans
      try {
        const response = await fetch("/api/v1/plans");
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans?.filter((p: Plan) => p.active) || []);
        }
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (!pricingEnabled || loading) {
    return null;
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Choose Your Plan
      </h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${plan.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  /{plan.interval === "MONTHLY" ? "month" : "year"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {plan.features && Array.isArray(plan.features) && (
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild className="mt-auto">
                <Link href="/pricing">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

