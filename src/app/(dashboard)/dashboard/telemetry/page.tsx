"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TelemetryData {
  enabled: boolean;
  stats: {
    enabled: boolean;
    count: number;
    events: Array<{
      id: string;
      event: string;
      metadata: any;
      version: string | null;
      timestamp: string;
    }>;
  };
  dataCollected: string[];
  dataNotCollected: string[];
}

export default function TelemetryPage() {
  const { toast } = useToast();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch("/api/v1/admin/telemetry");
      if (response.ok) {
        const data = await response.json();
        setTelemetry(data);
      }
    } catch (error) {
      console.error("Failed to fetch telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/v1/admin/telemetry/toggle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Telemetry ${enabled ? "enabled" : "disabled"}`,
        });
        fetchTelemetry();
      } else {
        toast({
          title: "Error",
          description: "Failed to update telemetry setting",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update telemetry setting",
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    try {
      const response = await fetch("/api/v1/admin/telemetry", {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Telemetry data cleared",
        });
        setClearDialogOpen(false);
        fetchTelemetry();
      } else {
        toast({
          title: "Error",
          description: "Failed to clear telemetry data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear telemetry data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!telemetry) {
    return <div className="p-6">Failed to load telemetry data</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Telemetry</h1>
        <p className="text-muted-foreground">Manage optional telemetry collection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telemetry Settings</CardTitle>
          <CardDescription>
            Opt-in telemetry helps improve the product. Disabled by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="telemetry-enabled">Enable Telemetry</Label>
              <p className="text-sm text-muted-foreground">
                Collect anonymous usage data and error reports
              </p>
            </div>
            <Switch
              id="telemetry-enabled"
              checked={telemetry.enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {telemetry.enabled && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm space-y-2">
                  <p className="font-medium">What data is collected:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {telemetry.dataCollected.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="font-medium mt-4">What data is NOT collected:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {telemetry.dataNotCollected.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {telemetry.enabled && telemetry.stats.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Telemetry Data</CardTitle>
            <CardDescription>
              {telemetry.stats.count} events collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {telemetry.stats.events.length > 0 ? (
                <div className="space-y-2">
                  {telemetry.stats.events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-md text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{event.event}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No events collected yet</p>
              )}

              {telemetry.stats.count > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setClearDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Telemetry Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Telemetry Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all telemetry data? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>Clear Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

