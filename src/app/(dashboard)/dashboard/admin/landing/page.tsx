"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Layout, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface LandingSection {
  key: string;
  enabled: boolean;
  description: string;
  moduleDependency?: string;
  defaultEnabled: boolean;
}

export default function LandingPageAdmin() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/v1/admin/landing-sections");
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      const data = await response.json();
      setSections(data.sections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = async (section: LandingSection) => {
    setUpdating({ ...updating, [section.key]: true });
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/v1/admin/landing-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: section.key,
          enabled: !section.enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update section");
      }

      const data = await response.json();
      setSections(
        sections.map((s) => (s.key === section.key ? { ...s, enabled: data.section.enabled } : s))
      );
      setSuccess(`Section "${section.description}" ${!section.enabled ? "enabled" : "disabled"} successfully`);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
    } finally {
      setUpdating({ ...updating, [section.key]: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layout className="h-8 w-8" />
          Landing Page Sections
        </h1>
        <p className="text-muted-foreground mt-2">
          Enable or disable individual landing page sections. Changes apply instantly.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg capitalize">
                    {section.key.replace(/_/g, " ")}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {section.description}
                  </CardDescription>
                  {section.moduleDependency && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Requires: <code className="bg-muted px-1 py-0.5 rounded">{section.moduleDependency}</code> module
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <Label htmlFor={`section-${section.key}`} className="text-sm">
                      {section.enabled ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Enabled
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> Disabled
                        </span>
                      )}
                    </Label>
                    <Switch
                      id={`section-${section.key}`}
                      checked={section.enabled}
                      onCheckedChange={() => toggleSection(section)}
                      disabled={updating[section.key]}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Section Control</h3>
        <p className="text-sm text-muted-foreground">
          Disabling a section will hide it from the landing page immediately. Sections that depend on other modules
          (like pricing) will automatically be hidden if the required module is disabled.
        </p>
      </div>
    </div>
  );
}

