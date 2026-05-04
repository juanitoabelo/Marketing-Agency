import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abelo Creative - Agency Management",
  description: "Internal tool for managing Abelo Creative agency operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
