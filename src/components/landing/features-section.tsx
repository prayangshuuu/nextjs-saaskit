"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Globe, BarChart3, Check } from "lucide-react";

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Everything You Need to Launch
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Fast Setup</CardTitle>
            <CardDescription>
              Get up and running in minutes with pre-built authentication, billing, and admin tools.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Secure by Default</CardTitle>
            <CardDescription>
              Built-in RBAC, audit logs, and security best practices out of the box.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Globe className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Multi-Tenant</CardTitle>
            <CardDescription>
              Full multi-tenancy support with organization management and tenant isolation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Usage Tracking</CardTitle>
            <CardDescription>
              Built-in usage metering and plan-based limits for your SaaS metrics.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Check className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Payment Ready</CardTitle>
            <CardDescription>
              Stripe, bKash, SSLCommerz, and PipraPay integrations included.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>White-Label</CardTitle>
            <CardDescription>
              Fully customizable branding and white-label support for your clients.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}

