import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dura Payment For Merchants",
  description:
    "Dura Payment is a payment gateway that allows merchants to accept payments from customers in Africa...",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        {/* 
          Only add nonce to inline <script> or <style> that you manually write.
          Next.js bundled scripts are under /_next/static and covered by 'self'.
        */}
      </head>
      <body className="h-svh flex flex-col flex-1 bg-background text-foreground">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
