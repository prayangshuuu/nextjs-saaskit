import { prisma } from "./prisma";
import { getBrandingConfig } from "./branding";

export interface TemplateVariables {
  [key: string]: any;
}

// Safe HTML escaping
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Render template with variable interpolation
function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;

  // Replace variables in format {{variable.path}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  rendered = rendered.replace(variableRegex, (match, path) => {
    const value = getNestedValue(variables, path.trim());
    if (value === null || value === undefined) {
      return match; // Keep original if variable not found
    }
    return String(value);
  });

  return rendered;
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

// Render HTML template with safe escaping for non-HTML variables
export function renderHtmlTemplate(
  template: string,
  variables: TemplateVariables
): string {
  // First, render variables
  let rendered = renderTemplate(template, variables);

  // Then escape any remaining unescaped variables (for safety)
  // This is a simple approach - in production, consider using a proper template engine
  const unescapedRegex = /\{\{([^}]+)\}\}/g;
  rendered = rendered.replace(unescapedRegex, (match, path) => {
    const value = getNestedValue(variables, path.trim());
    if (value === null || value === undefined) {
      return match;
    }
    return escapeHtml(String(value));
  });

  return rendered;
}

// Render text template (no HTML)
export function renderTextTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return renderTemplate(template, variables);
}

// Get email template (org-aware with fallback)
export async function getEmailTemplate(
  key: string,
  organizationId: string | null
): Promise<{ subject: string; htmlBody: string; textBody: string | null } | null> {
  // Try org-specific template first
  if (organizationId) {
    const orgTemplate = await prisma.emailTemplate.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });

    if (orgTemplate && orgTemplate.enabled) {
      return {
        subject: orgTemplate.subject,
        htmlBody: orgTemplate.htmlBody,
        textBody: orgTemplate.textBody,
      };
    }
  }

  // Fallback to global template
  const globalTemplate = await prisma.emailTemplate.findUnique({
    where: {
      organizationId_key: {
        organizationId: null,
        key,
      },
    },
  });

  if (globalTemplate && globalTemplate.enabled) {
    return {
      subject: globalTemplate.subject,
      htmlBody: globalTemplate.htmlBody,
      textBody: globalTemplate.textBody,
    };
  }

  return null;
}

// Render and get email template
export async function renderEmailTemplate(
  key: string,
  variables: TemplateVariables,
  organizationId?: string | null
): Promise<{ subject: string; html: string; text: string } | null> {
  const template = await getEmailTemplate(key, organizationId || null);

  if (!template) {
    return null;
  }

  // Add branding variables
  const branding = await getBrandingConfig(organizationId);
  const brandingVariables: TemplateVariables = {
    app: {
      name: branding.appName,
      logo: branding.logo,
    },
    whiteLabel: {
      hidePoweredBy: branding.hidePoweredBy,
      footerText: branding.footerText,
    },
  };

  const finalVariables = {
    ...variables,
    ...brandingVariables,
  };

  let html = renderHtmlTemplate(template.htmlBody, finalVariables);
  let text = template.textBody
    ? renderTextTemplate(template.textBody, finalVariables)
    : renderTextTemplate(template.htmlBody, finalVariables);

  // Add email footer branding
  const shouldShowAttribution = branding.showAttribution && !branding.hidePoweredBy;
  if (branding.footerText || shouldShowAttribution) {
    const footer = branding.footerText || (shouldShowAttribution ? "Powered by SaaS Kit" : "");
    if (footer) {
      html += `<div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.875rem;">${footer}</div>`;
      text += `\n\n---\n${footer}`;
    }
  }

  return {
    subject: renderTextTemplate(template.subject, finalVariables),
    html,
    text,
  };
}

