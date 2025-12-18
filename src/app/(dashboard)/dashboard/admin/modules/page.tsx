"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface SystemModule {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  scope: "GLOBAL" | "PUBLIC" | "AUTH" | "ADMIN";
  organizationId: string | null;
  updatedAt: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/v1/admin/modules");
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }
      const data = await response.json();
      // Filter to show only global modules (organizationId === null)
      setModules(data.modules.filter((m: SystemModule) => m.organizationId === null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (module: SystemModule) => {
    setUpdating({ ...updating, [module.key]: true });
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/v1/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: module.key,
          enabled: !module.enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update module");
      }

      const data = await response.json();
      setModules(
        modules.map((m) => (m.key === module.key ? data.module : m))
      );
      setSuccess(`Module "${module.description || module.key}" ${!module.enabled ? "enabled" : "disabled"} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module");
    } finally {
      setUpdating({ ...updating, [module.key]: false });
    }
  };

  const getScopeBadge = (scope: string) => {
    const colors: Record<string, string> = {
      GLOBAL: "bg-blue-100 text-blue-800",
      PUBLIC: "bg-green-100 text-green-800",
      AUTH: "bg-purple-100 text-purple-800",
      ADMIN: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[scope] || "bg-gray-100 text-gray-800"}`}>
        {scope}
      </span>
    );
  };

  const getWarning = (module: SystemModule) => {
    if (module.key === "admin") {
      return "Critical: This module cannot be disabled. It is required for system administration.";
    }
    if (module.key === "auth") {
      return "Warning: Disabling auth will prevent all user logins. Ensure dashboard is disabled first.";
    }
    if (module.key === "dashboard") {
      return "Warning: Disabling dashboard will prevent users from accessing their accounts. All users must be removed first.";
    }
    if (module.key === "rest_api") {
      return "Note: Disabling REST API will block all API access. Ensure API docs are disabled first.";
    }
    return null;
  };

  const getDependencyInfo = (module: SystemModule) => {
    const dependencies: Record<string, string[]> = {
      dashboard: ["auth"],
      api_docs: ["rest_api"],
    };
    return dependencies[module.key] || [];
  };

  const isCritical = (key: string) => {
    return ["admin", "auth", "dashboard"].includes(key);
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
          <Shield className="h-8 w-8" />
          System Modules
        </h1>
        <p className="text-muted-foreground mt-2">
          Enable or disable system features. Changes apply instantly without redeployment.
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
        {modules.map((module) => {
          const warning = getWarning(module);
          const critical = isCritical(module.key);

          return (
            <Card key={module.id} className={critical ? "border-yellow-200" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{module.description || module.key}</CardTitle>
                      {getScopeBadge(module.scope)}
                    </div>
                    <CardDescription className="text-sm">
                      Module Key: <code className="text-xs bg-muted px-1 py-0.5 rounded">{module.key}</code>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <Label htmlFor={`module-${module.key}`} className="text-sm">
                        {module.enabled ? (
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
                        id={`module-${module.key}`}
                        checked={module.enabled}
                        onCheckedChange={() => toggleModule(module)}
                        disabled={
                          updating[module.key] ||
                          module.key === "admin" ||
                          (module.key === "auth" && modules.find((m) => m.key === "dashboard")?.enabled) ||
                          (module.key === "dashboard" && modules.find((m) => m.key === "dashboard")?.enabled && true) // Check user count would need API call
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              {(warning || getDependencyInfo(module).length > 0) && (
                <CardContent className="space-y-2">
                  {warning && (
                    <Alert className={critical ? "border-yellow-200 bg-yellow-50" : ""}>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className={critical ? "text-yellow-800" : ""}>
                        {warning}
                      </AlertDescription>
                    </Alert>
                  )}
                  {getDependencyInfo(module).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Dependencies:</strong> Requires {getDependencyInfo(module).join(", ")} module(s) to be enabled
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Module System</h3>
        <p className="text-sm text-muted-foreground">
          Modules control access to features at both the API and UI level. When a module is disabled:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
          <li>API routes return 404 or 403 errors</li>
          <li>Pages redirect to appropriate fallback pages</li>
          <li>UI components are hidden or disabled</li>
          <li>Changes apply instantly without code deployment</li>
        </ul>
      </div>
    </div>
  );
}

