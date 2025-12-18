"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-6">
        Build Your SaaS Faster
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Production-ready SaaS starter kit with authentication, billing, multi-tenancy, and everything you need to launch.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/pricing">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    </section>
  );
}

