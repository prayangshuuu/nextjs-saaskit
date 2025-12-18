"use client";

import { Card, CardContent } from "@/components/ui/card";

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Trusted by Developers
      </h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "This starter kit saved us weeks of development time. Everything we needed was already there."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                JD
              </div>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-muted-foreground">CTO, TechStart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "The multi-tenancy support is excellent. We launched our SaaS in record time."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                JS
              </div>
              <div>
                <p className="font-semibold">Jane Smith</p>
                <p className="text-sm text-muted-foreground">Founder, CloudApp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "Production-ready from day one. The billing integration made our launch seamless."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                MB
              </div>
              <div>
                <p className="font-semibold">Mike Brown</p>
                <p className="text-sm text-muted-foreground">Lead Developer, SaaSPro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

