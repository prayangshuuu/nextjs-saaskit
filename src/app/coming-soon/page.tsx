import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Coming Soon - SaaS Kit",
  description: "We're working on something amazing. Check back soon!",
};

export default async function ComingSoonPage() {
  // Get custom coming soon message from system settings
  const setting = await prisma.systemSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId: null,
        key: "coming_soon.message",
      },
    },
  });

  const message = (setting?.value as string) || "We're working on something amazing. Check back soon!";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Coming Soon</CardTitle>
          <CardDescription className="text-lg mt-4">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            We're putting the finishing touches on our platform. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

