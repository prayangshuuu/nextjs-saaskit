import { isModuleEnabled } from "@/lib/module-service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check } from "lucide-react";

export async function PricingSection() {
  // Check if pricing module is enabled
  const pricingEnabled = await isModuleEnabled("pricing");
  
  if (!pricingEnabled) {
    return null;
  }

  // Fetch active plans from database
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

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
              <CardDescription>{plan.description || ""}</CardDescription>
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
              {plan.features && typeof plan.features === "object" && Array.isArray(plan.features) && (
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

