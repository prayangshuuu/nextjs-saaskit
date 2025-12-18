/**
 * Landing Page Section Registry
 * 
 * Defines all available landing page sections and their module dependencies
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CallToActionSection } from "@/components/landing/call-to-action-section";

export type LandingSectionKey = "hero" | "features" | "pricing" | "testimonials" | "faq" | "call_to_action";

export interface LandingSection {
  key: LandingSectionKey;
  component: React.ComponentType;
  moduleDependency?: string; // Module that must be enabled for this section
  defaultEnabled: boolean;
  description: string;
}

export const LANDING_SECTIONS: LandingSection[] = [
  {
    key: "hero",
    component: HeroSection,
    defaultEnabled: true,
    description: "Hero section with main headline and CTA buttons",
  },
  {
    key: "features",
    component: FeaturesSection,
    defaultEnabled: true,
    description: "Feature highlights and benefits",
  },
  {
    key: "pricing",
    component: PricingSection,
    moduleDependency: "pricing",
    defaultEnabled: true,
    description: "Pricing plans and comparison",
  },
  {
    key: "testimonials",
    component: TestimonialsSection,
    defaultEnabled: true,
    description: "Customer testimonials and social proof",
  },
  {
    key: "faq",
    component: FAQSection,
    defaultEnabled: true,
    description: "Frequently asked questions",
  },
  {
    key: "call_to_action",
    component: CallToActionSection,
    defaultEnabled: true,
    description: "Final call-to-action section",
  },
];

/**
 * Get enabled sections based on module state
 */
export async function getEnabledSections(): Promise<LandingSectionKey[]> {
  const { isModuleEnabled } = await import("./module-service");
  
  const enabledSections: LandingSectionKey[] = [];
  
  for (const section of LANDING_SECTIONS) {
    // Check if section has module dependency
    if (section.moduleDependency) {
      const moduleEnabled = await isModuleEnabled(section.moduleDependency);
      if (!moduleEnabled) {
        continue; // Skip this section if module is disabled
      }
    }
    
    // Check if landing page module itself is enabled
    const landingEnabled = await isModuleEnabled("landing");
    if (!landingEnabled) {
      return []; // If landing module is disabled, return no sections
    }
    
    enabledSections.push(section.key);
  }
  
  return enabledSections;
}

