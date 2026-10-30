import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuitKu — Manajemen Keuangan",
  description: "Aplikasi manajemen keuangan pribadi untuk melacak pemasukan dan pengeluaran dengan mudah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
