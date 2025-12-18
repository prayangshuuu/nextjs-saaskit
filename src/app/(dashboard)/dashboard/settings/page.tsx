"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  type: string;
  isSecret: boolean;
  organizationId: string | null;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/v1/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting({ ...setting });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editingSetting) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/v1/admin/settings/${encodeURIComponent(editingSetting.key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: editingSetting.value,
            type: editingSetting.type,
            isSecret: editingSetting.isSecret,
            description: editingSetting.description,
            organizationId: editingSetting.organizationId,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Setting updated successfully",
        });
        setOpen(false);
        fetchSettings();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update setting",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderValueInput = () => {
    if (!editingSetting) return null;

    switch (editingSetting.type) {
      case "boolean":
        return (
          <Switch
            checked={Boolean(editingSetting.value)}
            onCheckedChange={(checked) =>
              setEditingSetting({ ...editingSetting, value: checked })
            }
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={editingSetting.value}
            onChange={(e) =>
              setEditingSetting({
                ...editingSetting,
                value: parseFloat(e.target.value) || 0,
              })
            }
          />
        );
      case "json":
        return (
          <Textarea
            value={
              typeof editingSetting.value === "string"
                ? editingSetting.value
                : JSON.stringify(editingSetting.value, null, 2)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setEditingSetting({ ...editingSetting, value: parsed });
              } catch {
                setEditingSetting({ ...editingSetting, value: e.target.value });
              }
            }}
            rows={10}
            className="font-mono text-sm"
          />
        );
      default:
        return (
          <Input
            type={editingSetting.isSecret ? "password" : "text"}
            value={editingSetting.value}
            onChange={(e) =>
              setEditingSetting({ ...editingSetting, value: e.target.value })
            }
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Manage runtime configuration settings</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading settings...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Global and organization-level configuration settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{setting.key}</span>
                      {setting.isSecret && (
                        <span className="text-xs text-muted-foreground">(Secret)</span>
                      )}
                      {setting.organizationId && (
                        <span className="text-xs text-muted-foreground">(Org Override)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {setting.type} | Updated: {new Date(setting.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(setting)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Setting: {editingSetting?.key}</DialogTitle>
            <DialogDescription>
              Update the setting value. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          {editingSetting && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                {renderValueInput()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingSetting.description || ""}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      description: e.target.value || null,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isSecret"
                  checked={editingSetting.isSecret}
                  onCheckedChange={(checked) =>
                    setEditingSetting({ ...editingSetting, isSecret: checked })
                  }
                />
                <Label htmlFor="isSecret">Mark as Secret</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Setting"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

