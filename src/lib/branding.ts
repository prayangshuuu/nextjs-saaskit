/**
 * Branding Service
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { getStringSetting, getBooleanSetting } from "./settings-service";
import { getTenantFromRequest } from "./tenant";
import { NextRequest } from "next/server";

export interface BrandingConfig {
  appName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  radius: string;
  font: string;
  hidePoweredBy: boolean;
  footerText: string;
  showAttribution: boolean;
}

export async function getBrandingConfig(
  organizationId?: string | null
): Promise<BrandingConfig> {
  return {
    appName: await getStringSetting("app.name", "SaaS Kit", organizationId),
    logo: await getStringSetting("app.logo", "", organizationId),
    favicon: await getStringSetting("app.favicon", "", organizationId),
    primaryColor: await getStringSetting("brand.primaryColor", "#3b82f6", organizationId),
    secondaryColor: await getStringSetting("brand.secondaryColor", "#8b5cf6", organizationId),
    radius: await getStringSetting("brand.radius", "0.5rem", organizationId),
    font: await getStringSetting("brand.font", "Inter", organizationId),
    hidePoweredBy: await getBooleanSetting("whiteLabel.hidePoweredBy", false, organizationId),
    footerText: await getStringSetting("whiteLabel.footerText", "", organizationId),
    showAttribution: await getBooleanSetting("branding.showAttribution", true, organizationId),
  };
}

export function generateBrandingCSS(config: BrandingConfig): string {
  return `
    :root {
      --brand-primary: ${config.primaryColor};
      --brand-secondary: ${config.secondaryColor};
      --brand-radius: ${config.radius};
      --brand-font: ${config.font}, sans-serif;
    }
    
    * {
      font-family: var(--brand-font);
    }
  `;
}
