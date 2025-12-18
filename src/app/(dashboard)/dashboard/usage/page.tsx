"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UsageData {
  current: number;
  limit: number | null;
  percentage: number;
}

interface UsageResponse {
  usage: Record<string, UsageData>;
  limits: Record<string, number>;
}

export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/v1/usage");
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMetricName = (metric: string): string => {
    return metric
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (metric: string, value: number): string => {
    if (metric === "storage_bytes") {
      const gb = value / (1024 * 1024 * 1024);
      return `${gb.toFixed(2)} GB`;
    }
    if (metric === "compute_seconds") {
      const hours = value / 3600;
      return `${hours.toFixed(2)} hours`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return <div className="p-6">Loading usage data...</div>;
  }

  if (!usageData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No usage data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usage & Limits</h1>
        <p className="text-muted-foreground">Monitor your organization's usage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(usageData.usage).map(([metric, data]) => (
          <Card key={metric}>
            <CardHeader>
              <CardTitle className="text-lg">{formatMetricName(metric)}</CardTitle>
              <CardDescription>
                Current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    {formatValue(metric, data.current)}
                    {data.limit && ` / ${formatValue(metric, data.limit)}`}
                  </span>
                </div>
                {data.limit ? (
                  <>
                    <Progress value={data.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {data.percentage.toFixed(1)}% of limit used
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No limit set
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(usageData.usage).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No usage data recorded yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}

