import { ThemeProvider } from "@/components/theme-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </ThemeProvider>
  );
}

