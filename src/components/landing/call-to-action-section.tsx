"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CallToActionSection() {
  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Join thousands of developers building SaaS products faster.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" variant="secondary">
            <Link href="/pricing">
              View Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/register">
              Start Free Trial
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

