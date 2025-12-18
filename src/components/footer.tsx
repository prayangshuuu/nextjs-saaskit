"use client";

import { useEffect, useState } from "react";
import { getBrandingConfig } from "@/lib/branding";

export function Footer() {
  const [branding, setBranding] = useState<{ hidePoweredBy: boolean; footerText: string; showAttribution: boolean } | null>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/v1/branding");
      if (response.ok) {
        const data = await response.json();
        setBranding({
          hidePoweredBy: data.branding.hidePoweredBy,
          footerText: data.branding.footerText,
          showAttribution: data.branding.showAttribution ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  if (!branding) return null;

  const shouldShowAttribution = branding.showAttribution && !branding.hidePoweredBy;

  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        {branding.footerText ? (
          <p>{branding.footerText}</p>
        ) : (
          shouldShowAttribution && (
            <p>Built with <a href="https://github.com/prayangshuuu/nextjs-saaskit" className="hover:underline" target="_blank" rel="noopener noreferrer">nextjs-saaskit</a></p>
          )
        )}
      </div>
    </footer>
  );
}

