import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
});

export const metadata: Metadata = {
  title: "Parent Coach",
  description: "Brief, practical parenting guidance in English, Urdu and Roman Urdu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1618" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${atkinson.variable} ${nastaliq.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
