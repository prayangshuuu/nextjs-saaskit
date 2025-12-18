"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthData {
  app: {
    version: string;
    environment: string;
    nodeVersion: string;
  };
  database: {
    status: string;
    connected: boolean;
  };
  smtp: {
    status: string;
    configured: boolean;
    testResult?: { success: boolean; error?: string };
  };
  paymentProviders: {
    stripe: { enabled: boolean; configured: boolean };
    bkash: { enabled: boolean; configured: boolean };
    sslcommerz: { enabled: boolean; configured: boolean };
    piprapay: { enabled: boolean; configured: boolean };
  };
  maintenance: {
    enabled: boolean;
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/health");
      if (response.ok) {
        const data = await response.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (status === true || status === "connected" || status === "configured") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (status === false || status === "disconnected" || status === "not_configured") {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | string) => {
    if (status === true || status === "connected" || status === "configured") {
      return <Badge variant="default" className="bg-green-500">OK</Badge>;
    }
    if (status === false || status === "disconnected" || status === "not_configured") {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="secondary">Warning</Badge>;
  };

  if (loading) {
    return <div className="p-6">Loading health data...</div>;
  }

  if (!health) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load health data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">Monitor system status and diagnostics</p>
        </div>
        <Button variant="outline" onClick={fetchHealth}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">{health.app.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Environment</span>
              <Badge variant="secondary">{health.app.environment}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Node.js</span>
              <span className="text-sm font-medium">{health.app.nodeVersion}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Database
              {getStatusIcon(health.database.connected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(health.database.connected)}
            </div>
            <p className="text-xs text-muted-foreground">{health.database.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              SMTP
              {getStatusIcon(health.smtp.configured)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(health.smtp.configured)}
            </div>
            {health.smtp.testResult && (
              <p className="text-xs text-muted-foreground">
                {health.smtp.testResult.success
                  ? "Connection test passed"
                  : `Test failed: ${health.smtp.testResult.error}`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(health.paymentProviders).map(([key, provider]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">{key}</span>
                <div className="flex items-center gap-2">
                  {provider.enabled && (
                    <Badge variant="default" className="bg-green-500">Enabled</Badge>
                  )}
                  {provider.configured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Maintenance Mode
              {getStatusIcon(!health.maintenance.enabled)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {health.maintenance.enabled ? (
                <Badge variant="destructive">Enabled</Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">Disabled</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

