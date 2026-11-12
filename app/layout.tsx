import type { Metadata, Viewport } from "next";
import { Unbounded, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORSI | Coming Soon",
  description: "Something is on its way. ORSI is coming soon.",
  metadataBase: new URL("https://orsi.co"),
  openGraph: {
    title: "ORSI | Coming Soon",
    description: "Something is on its way.",
    url: "https://orsi.co",
    siteName: "ORSI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050404",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
