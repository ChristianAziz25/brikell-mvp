import { Sidebar } from "@/components";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Brikell",
  description:
    "Brikell is a platform for creating and managing your housing data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <SidebarProvider>
            <div className="flex w-full min-h-svh bg-muted/5 overflow-hidden">
              <Sidebar>{children}</Sidebar>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
