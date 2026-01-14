import { AppSidebar } from "@/components";
import { SidebarProvider } from "@/components/ui/sidebar";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Ubuntu } from "next/font/google";
import { notFound } from "next/navigation";
import "./globals.css";
import { Providers } from "./providers";

const ubuntu = Ubuntu({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brikell",
  description:
    "Brikell is a platform for creating and managing your housing data",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // TODO: add not found page if no locale is provided
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  return (
    <html lang={locale} className={ubuntu.variable}>
      <head>
        <link rel="icon" href="/brikell.ico" sizes="any" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <SidebarProvider>
              <div className="flex w-full min-h-svh bg-muted/5 overflow-hidden">
                <AppSidebar>{children}</AppSidebar>
              </div>
            </SidebarProvider>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
