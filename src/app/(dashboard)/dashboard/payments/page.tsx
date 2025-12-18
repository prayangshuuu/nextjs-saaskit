"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CheckCircle2, XCircle } from "lucide-react";
import { PaymentProviderModal } from "./provider-modal";

interface PaymentProvider {
  id: string;
  type: "STRIPE" | "BKASH" | "SSLCOMMERZ" | "PIPRAPAY";
  enabled: boolean;
  testMode: boolean;
  config: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/v1/admin/payments/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleEdit = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingProvider(null);
    fetchProviders();
  };

  const getProviderName = (type: string) => {
    const names: Record<string, string> = {
      STRIPE: "Stripe",
      BKASH: "bKash",
      SSLCOMMERZ: "SSLCommerz",
      PIPRAPAY: "PipraPay",
    };
    return names[type] || type;
  };

  if (loading) {
    return <div className="p-6">Loading payment providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Providers</h1>
        <p className="text-muted-foreground">Configure payment gateway settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{getProviderName(provider.type)}</CardTitle>
                {provider.enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <CardDescription>
                {provider.testMode ? "Test Mode" : "Live Mode"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      provider.enabled
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEdit(provider)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No payment providers found. Please run database seed.
          </CardContent>
        </Card>
      )}

      <PaymentProviderModal
        open={modalOpen}
        onClose={handleClose}
        provider={editingProvider}
      />
    </div>
  );
}

