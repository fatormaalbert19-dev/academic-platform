import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic Platform",
  description: "Attendance, assignments, and grades for universities in Sierra Leone",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
