import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, notoSansSC.variable, "font-sans")}
    >
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
