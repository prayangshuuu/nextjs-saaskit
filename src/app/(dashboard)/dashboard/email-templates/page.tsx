"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  enabled: boolean;
  organizationId: string | null;
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/v1/admin/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate({ ...template });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/email-templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTemplate.subject,
          htmlBody: selectedTemplate.htmlBody,
          textBody: selectedTemplate.textBody || null,
          enabled: selectedTemplate.enabled,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
        setOpen(false);
        fetchTemplates();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;
    // Simple preview - in production, use a proper HTML preview component
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(selectedTemplate.htmlBody);
      previewWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">Manage email templates for your application</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading templates...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.key}</CardTitle>
                <CardDescription>{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={template.enabled}
                      disabled
                    />
                    <Label>{template.enabled ? "Enabled" : "Disabled"}</Label>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEdit(template)}
                >
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {selectedTemplate?.key}</DialogTitle>
            <DialogDescription>
              Edit the email template. Use variables like {"{{user.name}}"}, {"{{app.name}}"}, etc.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={selectedTemplate.subject}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlBody">HTML Body</Label>
                <Textarea
                  id="htmlBody"
                  value={selectedTemplate.htmlBody}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, htmlBody: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="textBody">Text Body (Optional)</Label>
                <Textarea
                  id="textBody"
                  value={selectedTemplate.textBody || ""}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      textBody: e.target.value || null,
                    })
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={selectedTemplate.enabled}
                  onCheckedChange={(checked) =>
                    setSelectedTemplate({ ...selectedTemplate, enabled: checked })
                  }
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

