import type { Metadata, Viewport } from "next";
import { Providers } from "@/app/_components/providers";
import { OfflineStatus } from "@/components/offline-status";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Summer OS — 把忙碌的夏天变成可执行的每一天",
    template: "%s · Summer OS",
  },
  description:
    "面向学习、健康与日程执行的移动优先个人操作系统。非商业公开测试版。",
  applicationName: "Summer OS",
  appleWebApp: {
    capable: true,
    title: "Summer OS",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090b11" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-dvh antialiased">
        <Providers>
          <OfflineStatus />
          {children}
        </Providers>
      </body>
    </html>
  );
}
