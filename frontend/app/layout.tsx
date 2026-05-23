import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Digby.rocks", template: "%s | Digby.rocks" },
  description:
    "Discover and book rockhound sites across Ontario and Canada. Pay-to-dig, guided tours, and collecting walks.",
  metadataBase: new URL("https://digby.rocks"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Digby.rocks",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ca8a04",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
