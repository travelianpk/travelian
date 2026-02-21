import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travelian",
  description:
    "Travelian Next.js migration shell with route mapping for all pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
