"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";

interface UpdateNotice {
  version: string;
  changelog: string;
  date: string;
  important: boolean;
}

export function UpdateBanner() {
  const [notice, setNotice] = useState<UpdateNotice | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchUpdateNotice();
  }, []);

  const fetchUpdateNotice = async () => {
    try {
      const response = await fetch("/api/v1/admin/updates");
      if (response.ok) {
        const data = await response.json();
        if (data.shouldShow && data.notice) {
          setNotice(data.notice);
          // Check if dismissed in localStorage
          const dismissedVersion = localStorage.getItem("dismissedUpdateVersion");
          if (dismissedVersion === data.notice.version) {
            setDismissed(true);
          }
        }
      }
    } catch (error) {
      // Silently fail - update notices are optional
    }
  };

  const handleDismiss = () => {
    if (notice) {
      localStorage.setItem("dismissedUpdateVersion", notice.version);
      setDismissed(true);
    }
  };

  if (!notice || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-primary" variant={notice.important ? "destructive" : "default"}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          Update Available: v{notice.version}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="text-sm mb-2">{notice.changelog}</p>
          <p className="text-xs text-muted-foreground">
            Released: {new Date(notice.date).toLocaleDateString()}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

