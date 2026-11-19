import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parent Coach",
  description: "Brief, practical parenting guidance in English, Urdu and Roman Urdu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
