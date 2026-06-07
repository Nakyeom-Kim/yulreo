import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "율려 (Yul-reo)",
  description: "차분하고 감각적인 브랜드 율려",
};

import Header from "@/components/Header";
import SplashScreen from "@/components/SplashScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <SplashScreen />
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
      </body>
    </html>
  );
}
