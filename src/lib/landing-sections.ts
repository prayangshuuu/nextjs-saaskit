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
 * Get enabled sections based on module state and section-level controls
 */
export async function getEnabledSections(): Promise<LandingSectionKey[]> {
  const { isModuleEnabled, getModule } = await import("./module-service");
  
  // Check if landing page module itself is enabled
  const landingEnabled = await isModuleEnabled("landing");
  if (!landingEnabled) {
    return []; // If landing module is disabled, return no sections
  }
  
  // Get landing module metadata for section-level control
  const landingModule = await getModule("landing");
  const sectionStates = landingModule?.metadata as Record<string, boolean> | undefined;
  
  const enabledSections: LandingSectionKey[] = [];
  
  for (const section of LANDING_SECTIONS) {
    // Check section-level control (stored in metadata)
    if (sectionStates && sectionStates[section.key] === false) {
      continue; // Section explicitly disabled
    }
    
    // Check if section has module dependency
    if (section.moduleDependency) {
      const moduleEnabled = await isModuleEnabled(section.moduleDependency);
      if (!moduleEnabled) {
        continue; // Skip this section if module is disabled
      }
    }
    
    // Section is enabled (either default or explicitly enabled)
    enabledSections.push(section.key);
  }
  
  return enabledSections;
}

