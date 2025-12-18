"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PaymentProvider {
  id: string;
  type: "STRIPE" | "BKASH" | "SSLCOMMERZ" | "PIPRAPAY";
  enabled: boolean;
  testMode: boolean;
  apiKey?: string | null;
  apiSecret?: string | null;
  webhookSecret?: string | null;
  config?: Record<string, any> | null;
}

interface PaymentProviderModalProps {
  open: boolean;
  onClose: () => void;
  provider: PaymentProvider | null;
}

export function PaymentProviderModal({
  open,
  onClose,
  provider,
}: PaymentProviderModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      setEnabled(provider.enabled);
      setTestMode(provider.testMode);
      setApiKey(provider.apiKey || "");
      setApiSecret(provider.apiSecret || "");
      setWebhookSecret(provider.webhookSecret || "");
    } else {
      setEnabled(false);
      setTestMode(true);
      setApiKey("");
      setApiSecret("");
      setWebhookSecret("");
    }
  }, [provider, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        enabled,
        testMode,
      };

      // Only include secrets if they're provided (not empty and not masked)
      if (apiKey && !apiKey.startsWith("••••")) {
        payload.apiKey = apiKey;
      }
      if (apiSecret && !apiSecret.startsWith("••••")) {
        payload.apiSecret = apiSecret;
      }
      if (webhookSecret && !webhookSecret.startsWith("••••")) {
        payload.webhookSecret = webhookSecret;
      }

      const response = await fetch(`/api/v1/admin/payments/providers/${provider?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update provider");
      }
    } catch (error) {
      console.error("Failed to update provider:", error);
      alert("Failed to update provider");
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  const getProviderName = (type: string) => {
    const names: Record<string, string> = {
      STRIPE: "Stripe",
      BKASH: "bKash",
      SSLCOMMERZ: "SSLCommerz",
      PIPRAPAY: "PipraPay",
    };
    return names[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {getProviderName(provider.type)}</DialogTitle>
          <DialogDescription>
            Update payment provider settings and credentials
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Provider</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to pay with this provider
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Test Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use test credentials instead of live
              </p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKey.startsWith("••••") ? "Leave blank to keep current" : "Enter API key"}
            />
            {apiKey.startsWith("••••") && (
              <p className="text-xs text-muted-foreground">
                Leave blank to keep current value
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={apiSecret.startsWith("••••") ? "Leave blank to keep current" : "Enter API secret"}
            />
            {apiSecret.startsWith("••••") && (
              <p className="text-xs text-muted-foreground">
                Leave blank to keep current value
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={webhookSecret.startsWith("••••") ? "Leave blank to keep current" : "Enter webhook secret"}
            />
            {webhookSecret.startsWith("••••") && (
              <p className="text-xs text-muted-foreground">
                Leave blank to keep current value
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

