"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  actor: {
    id: string;
    email: string | null;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    userId: "",
    organizationId: "",
    action: "",
    entity: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.organizationId) params.append("organizationId", filters.organizationId);
      if (filters.action) params.append("action", filters.action);
      if (filters.entity) params.append("entity", filters.entity);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/v1/admin/audit-logs?${params}`);
      if (response.ok) {
        const data: AuditLogsResponse = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Actor", "Action", "Entity", "Entity ID", "Organization", "IP Address"].join(","),
      ...logs.map((log) =>
        [
          log.createdAt,
          log.actor.email || log.actor.id,
          log.action,
          log.entity,
          log.entityId || "",
          log.organization?.name || "",
          log.ipAddress || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">View system activity and compliance logs</p>
        </div>
        <Button onClick={handleExport} disabled={logs.length === 0}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Input
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
            <Input
              placeholder="Organization ID"
              value={filters.organizationId}
              onChange={(e) => setFilters({ ...filters, organizationId: e.target.value })}
            />
            <Input
              placeholder="Action"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
            <Input
              placeholder="Entity"
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={fetchLogs}>Apply Filters</Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  userId: "",
                  organizationId: "",
                  action: "",
                  entity: "",
                  startDate: "",
                  endDate: "",
                });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            Showing {logs.length} of {pagination.total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No audit logs found</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.entity} {log.entityId && `(${log.entityId})`}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="font-medium">Actor:</span> {log.actor.email || log.actor.id}
                    </div>
                    {log.organization && (
                      <div>
                        <span className="font-medium">Organization:</span> {log.organization.name}
                      </div>
                    )}
                    {log.ipAddress && (
                      <div>
                        <span className="font-medium">IP:</span> {log.ipAddress}
                      </div>
                    )}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Metadata</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

