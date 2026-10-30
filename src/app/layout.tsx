import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M3 Memory Archive",
  description: "A living archive of the moments, people, and stories surrounding MOFUNDO.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
