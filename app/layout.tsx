import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    "Dura Payment is a payment gateway that allows merchants to accept payments from customers in Africa. With Dura Payment, merchants can easily integrate our payment gateway into their website or mobile app and start accepting payments from customers in Nigeria, Ghana, Kenya, South Africa, Uganda, Tanzania, Rwanda, Senegal, Côte d'Ivoire, and Ethiopia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="h-svh flex flex-col flex-1 bg-background text-foreground">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
