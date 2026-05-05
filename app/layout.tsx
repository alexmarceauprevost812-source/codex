import type { Metadata, Viewport } from "next";

import { ConversationsProvider } from "@/components/conversations-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Codex",
  description: "Assistant de programmation IA propulsé par Claude.",
  applicationName: "Codex",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Codex",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-bg-mode="black">
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <ConversationsProvider>{children}</ConversationsProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
