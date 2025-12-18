"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, Check } from "lucide-react";
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

export default function TwoFactorPage() {
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch("/api/v1/auth/me");
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.user?.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      const response = await fetch("/api/v1/auth/2fa/setup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setTempSecret(data.tempSecret);
        setSetupMode(true);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to setup 2FA",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup 2FA",
        variant: "destructive",
      });
    }
  };

  const handleEnable = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verificationToken,
          tempSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecoveryCodes(data.recoveryCodes || []);
        setShowRecoveryCodes(true);
        setTwoFactorEnabled(true);
        setSetupMode(false);
        toast({
          title: "Success",
          description: "2FA enabled successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to enable 2FA",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable 2FA",
        variant: "destructive",
      });
    }
  };

  const handleDisable = async () => {
    if (!disableToken) {
      toast({
        title: "Error",
        description: "Please enter verification code or recovery code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: disableToken,
          useRecoveryCode: disableToken.length !== 6, // Recovery codes are 8 chars
        }),
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        setShowDisableDialog(false);
        setDisableToken("");
        toast({
          title: "Success",
          description: "2FA disabled successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to disable 2FA",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive",
      });
    }
  };

  const copyRecoveryCodes = () => {
    const codesText = recoveryCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2FA Status
          </CardTitle>
          <CardDescription>
            {twoFactorEnabled
              ? "Two-factor authentication is enabled"
              : "Two-factor authentication is disabled"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!twoFactorEnabled ? (
            <div className="space-y-4">
              {!setupMode ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Enable two-factor authentication to protect your account with
                    an additional security layer.
                  </p>
                  <Button onClick={handleSetup}>Enable 2FA</Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Scan QR Code</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan this QR code with your authenticator app (Google
                      Authenticator, Authy, etc.)
                    </p>
                    {qrCode && (
                      <div className="flex justify-center">
                        <img src={qrCode} alt="QR Code" className="border rounded" />
                      </div>
                    )}
                  </div>
                  {secret && (
                    <div>
                      <Label>Manual Entry</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Or enter this code manually:
                      </p>
                      <code className="block p-2 bg-muted rounded text-sm">
                        {secret}
                      </code>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="verification-token">
                      Enter Verification Code
                    </Label>
                    <Input
                      id="verification-token"
                      type="text"
                      maxLength={6}
                      value={verificationToken}
                      onChange={(e) =>
                        setVerificationToken(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleEnable}>Enable 2FA</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSetupMode(false);
                        setQrCode(null);
                        setSecret(null);
                        setTempSecret(null);
                        setVerificationToken("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication. You
                will need to enter a code from your authenticator app when
                logging in.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                Disable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showRecoveryCodes && recoveryCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery Codes</CardTitle>
            <CardDescription>
              Save these codes in a safe place. You can use them to access your
              account if you lose access to your authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {recoveryCodes.map((code, index) => (
                <code
                  key={index}
                  className="block p-2 bg-muted rounded text-sm font-mono"
                >
                  {code}
                </code>
              ))}
            </div>
            <Button onClick={copyRecoveryCodes} variant="outline">
              {copiedCodes ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Codes
                </>
              )}
            </Button>
            <Button
              className="ml-2"
              onClick={() => {
                setShowRecoveryCodes(false);
                setRecoveryCodes([]);
              }}
            >
              I've Saved These Codes
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your verification code or a recovery code to disable 2FA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-token">Verification Code or Recovery Code</Label>
              <Input
                id="disable-token"
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                placeholder="Enter 6-digit code or recovery code"
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable}>Disable 2FA</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

