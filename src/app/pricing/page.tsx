import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your needs. Flexible pricing with monthly and yearly options.",
};

async function getPlans() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  return plans;
}

export default async function PricingPage() {
  const plans = await getPlans();

  // Parse features from JSON
  const plansWithFeatures = plans.map((plan) => ({
    ...plan,
    features: (plan.features as Record<string, any>) || {},
  }));

  // Find recommended plan (middle tier or most popular)
  const recommendedPlanIndex = Math.floor(plansWithFeatures.length / 2);

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that's right for you
          </p>
        </div>

        {plansWithFeatures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plansWithFeatures.map((plan, index) => {
              const isRecommended = index === recommendedPlanIndex;
              const price = plan.price.toNumber();
              const monthlyPrice = plan.interval === "MONTHLY" ? price : price / 12;
              const yearlyPrice = plan.interval === "YEARLY" ? price : price * 12;

              return (
                <Card
                  key={plan.id}
                  className={isRecommended ? "border-primary border-2 relative" : ""}
                >
                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Recommended
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || ""}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${monthlyPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">/month</span>
                      {plan.interval === "YEARLY" && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed ${yearlyPrice.toFixed(2)} yearly
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      className="w-full mb-6"
                      variant={isRecommended ? "default" : "outline"}
                    >
                      <Link href={`/register?plan=${plan.id}`}>
                        Get Started
                      </Link>
                    </Button>

                    {plan.features && typeof plan.features === "object" && (
                      <ul className="space-y-3">
                        {Object.entries(plan.features).map(([key, value]) => {
                          if (typeof value === "boolean" && value) {
                            return (
                              <li key={key} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm capitalize">
                                  {key.replace(/_/g, " ")}
                                </span>
                              </li>
                            );
                          }
                          if (typeof value === "string" || typeof value === "number") {
                            return (
                              <li key={key} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">
                                  <span className="capitalize">{key.replace(/_/g, " ")}:</span> {String(value)}
                                </span>
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <Button asChild variant="outline">
            <Link href="/register">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

