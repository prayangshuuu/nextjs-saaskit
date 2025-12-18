import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import Link from "next/link";
import { LogOut, LayoutDashboard, Users, Settings, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="font-semibold text-lg">
                SaaS Kit
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/users"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/plans"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  title="Plans"
                >
                  <CreditCard className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  title="Payment Providers"
                >
                  <Wallet className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/usage"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  title="Usage"
                >
                  <BarChart3 className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <OrganizationSwitcher />
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}

