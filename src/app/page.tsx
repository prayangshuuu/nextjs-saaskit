import type { Metadata } from "next";
import { isModuleEnabled } from "@/lib/module-service";
import { LANDING_SECTIONS, getEnabledSections } from "@/lib/landing-sections";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SaaS Kit - Build Your SaaS Faster",
  description: "Production-ready SaaS starter kit with authentication, billing, multi-tenancy, and everything you need to launch.",
  keywords: ["SaaS", "starter kit", "Next.js", "TypeScript", "multi-tenant"],
  openGraph: {
    title: "SaaS Kit - Build Your SaaS Faster",
    description: "Production-ready SaaS starter kit with authentication, billing, multi-tenancy, and everything you need to launch.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  // Check if landing page module is enabled
  const landingEnabled = await isModuleEnabled("landing");
  
  if (!landingEnabled) {
    // Redirect to coming soon page if landing is disabled
    redirect("/coming-soon");
  }

  // Get enabled sections
  const enabledSections = await getEnabledSections();
  
  // Render sections in order
  return (
    <div className="min-h-screen">
      {enabledSections.map((sectionKey) => {
        const section = LANDING_SECTIONS.find((s) => s.key === sectionKey);
        if (!section) return null;
        
        const SectionComponent = section.component;
        return <SectionComponent key={sectionKey} />;
      })}

      {/* Open Source Notice - Always shown if landing is enabled */}
      <section className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">
          <Link href="/open-source" className="hover:underline">
            Learn more about our open-source philosophy
          </Link>
        </p>
      </section>
    </div>
  );
}
