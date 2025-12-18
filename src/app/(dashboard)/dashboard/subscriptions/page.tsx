"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  features: Record<string, any>;
  active: boolean;
}

interface Subscription {
  id: string;
  status: string;
  plan: Plan;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscribePlanId = searchParams.get("subscribe");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (subscribePlanId && plans.length > 0) {
      // Auto-scroll to plan or show subscription modal
      const planElement = document.getElementById(`plan-${subscribePlanId}`);
      if (planElement) {
        planElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [subscribePlanId, plans]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/v1/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/v1/subscriptions");
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setSubscription(data.subscription);
        }
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = (planId: string) => {
    setSelectedPlanId(planId);
    setConfirmDialogOpen(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;

    try {
      const response = await fetch("/api/v1/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmDialogOpen(false);
        // Redirect to payment if needed
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          router.push("/dashboard/subscriptions?success=true");
          router.refresh();
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to subscribe");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans & Subscriptions</h1>
        <p className="text-muted-foreground">Manage your subscription</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                <p className="text-muted-foreground">{subscription.plan.description}</p>
                <Badge className="mt-2" variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${subscription.plan.price.toNumber()}
                  <span className="text-sm text-muted-foreground">
                    /{subscription.plan.interval === "MONTHLY" ? "month" : "year"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.plan.id === plan.id;
            const isRecommended = index === Math.floor(plans.length / 2);
            const price = plan.price.toNumber();
            const monthlyPrice = plan.interval === "MONTHLY" ? price : price / 12;

            return (
              <Card
                key={plan.id}
                id={`plan-${plan.id}`}
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
                  </div>
                </CardHeader>
                <CardContent>
                  {isCurrentPlan ? (
                    <Button className="w-full mb-6" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full mb-6"
                      variant={isRecommended ? "default" : "outline"}
                      onClick={() => handleSubscribeClick(plan.id)}
                    >
                      {subscription ? "Change Plan" : "Subscribe"}
                    </Button>
                  )}

                  {plan.features && typeof plan.features === "object" && (
                    <ul className="space-y-3">
                      {Object.entries(plan.features).map(([key, value]) => {
                        if (typeof value === "boolean" && value) {
                          return (
                            <li key={key} className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
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
      </div>
    </div>
  );
}

