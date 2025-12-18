"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandingConfig } from "@/lib/branding";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetchBranding();
  }, [pathname]); // Re-fetch on route change (org switch)

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/v1/branding");
      if (response.ok) {
        const data = await response.json();
        setBranding(data.branding);

        // Apply CSS variables
        if (data.css) {
          const styleId = "dynamic-branding";
          let styleElement = document.getElementById(styleId);
          if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
          }
          styleElement.textContent = data.css;
        }

        // Apply favicon
        if (data.branding.favicon) {
          let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
          }
          favicon.href = data.branding.favicon;
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  return <>{children}</>;
}

