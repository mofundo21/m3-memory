import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M3 Memory",
  description: "Private memory archive for Yeriel / MOFUNDO"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
