import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jelajah — Smart Travel Experience",
  description: "Temukan destinasi, rancang perjalanan personal, dan kumpulkan cerita bersama AI Travel Companion."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
