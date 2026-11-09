import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOMENTUS — The thoughtful event studio",
  description:
    "A private invitation, a day that flows, and memories worth keeping. MOMENTUS brings every part of a celebration together.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
