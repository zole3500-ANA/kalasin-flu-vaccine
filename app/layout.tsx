import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#073b40",
};

export const metadata: Metadata = {
  title: "ระบบรายงานวัคซีนไข้หวัดใหญ่บุคลากร | จังหวัดกาฬสินธุ์",
  description: "บันทึกและติดตามผลการฉีดวัคซีนไข้หวัดใหญ่ของบุคลากรในโรงพยาบาลจังหวัดกาฬสินธุ์ 18 แห่ง",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
