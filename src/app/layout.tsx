import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { inter, notoSansSC } from "@/lib/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Prompt Library",
    template: "%s | AI Prompt Library",
  },
  description:
    "Exclusive AI Prompt template library for Vibe Coding students. Ready-to-use templates — copy and paste into Cursor / Claude.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn(inter.variable, notoSansSC.variable, "font-sans")}
    >
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
